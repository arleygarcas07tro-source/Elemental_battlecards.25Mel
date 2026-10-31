import Player from '../game_objects/player.js';
import TurnManager from './TurnManager.js';
import EventBus from '../utils/eventBus.js';
import { GAME_CONFIG } from '../helpers/constants.js';
import { resolveCombat } from '../helpers/combat.js';
import VictoryEvaluator from './VictoryEvaluator.js';
import ConvergenceService from './ConvergenceService.js';
import PoderesRegistry from './powers/PoderesRegistry.js';

/**
 * Motor de partida (dominio puro). Es la única fuente de estado de una
 * partida: posee los jugadores, el flujo de turnos y la configuración, y
 * expone comandos que aplican reglas (victoria, convergencia, poderes de
 * esencia, combate) devolviendo resultados para que la capa de presentación
 * reaccione.
 *
 * Responsabilidad: concentrar las reglas del juego fuera de las Scenes.
 * Sin dependencias de Phaser: los cambios de estado se notifican vía un
 * EventBus propio que la escena puentea a su UI.
 */
export default class GameMatch {
    /**
     * @param {object} [opts]
     * @param {object} [opts.config=GAME_CONFIG] Configuración de reglas.
     * @param {string} [opts.playerId='player']
     * @param {string} [opts.opponentId='opponent']
     * @param {object} [opts.turn=null] Flujo de turnos inyectado (DIP); si no
     *   se provee, crea un TurnManager por defecto.
     * @param {Function} [opts.onGemGained] Aviso de dominio: (ownerId, type, progress).
     * @param {object|null} [opts.mode] Modo de juego activo.
     * @param {object|null} [opts.gemRequirements] Requisitos de gemas del modo.
     */
    constructor({
        config = GAME_CONFIG,
        playerId = 'player',
        opponentId = 'opponent',
        turn = null,
        onGemGained = null,
        mode = null,
        gemRequirements = null,
        purchasedPowerCharges = {}
    } = {}) {
        this.config = config;
        this.mode = mode;
        /** @type {import('../utils/eventBus.js').default} */
        this.events = new EventBus();
        /** @type {import('../game_objects/player.js').default} */
        this.player = new Player(playerId, { onGemGained });
        /** @type {import('../game_objects/player.js').default} */
        this.opponent = new Player(opponentId, { onGemGained });
        this.player.gems.setRequirements(gemRequirements);
        this.opponent.gems.setRequirements(gemRequirements);
        /** @type {import('./TurnManager.js').default} */
        this.turn = turn || new TurnManager(config);
        this.purchasedPowerCharges = { ...purchasedPowerCharges };
        this.lastVictoryResult = { winner: null, reason: null, log: null };
    }

    /**
     * Devuelve el jugador por su id ('player' | 'opponent').
     * @param {string} id
     * @returns {Player}
     */
    playerOf(id) {
        return id === this.opponent.id ? this.opponent : this.player;
    }

    /**
     * Restaura el flujo de turnos al estado inicial.
     */
    reset() {
        this.turn.reset();
    }

    /**
     * Inicia el turno del jugador. Resuelve la Convergencia: si estaba armada
     * y el jugador conservó los 6 tipos, devuelve la victoria; si la perdió,
     * la cancela. En caso contrario delega en TurnManager.
     * @returns {{winner?: string, reason?: string, turnNumber: number, mustAttack: boolean, turnsSinceLastAttack: number}}
     */
    startPlayerTurn() {
        if (this.turn.playerConvergenceBlocked) {
            this.turn.playerConvergenceBlocked = false;
            this.turn.playerConvergenceArmed = false;
            this._emitConvergenceStatus();
        }
        if (this.turn.playerConvergenceArmed) {
            if (ConvergenceService.isConverged(this.player.field.types(), this.config.UNIQUE_TYPES_TO_WIN)) {
                return { winner: 'player', reason: 'convergence' };
            }
            this.turn.playerConvergenceArmed = false;
            console.log('[GameMatch] Convergencia del jugador cancelada: perdió un tipo durante el turno rival.');
            this._emitConvergenceStatus();
        }
        return this.turn.beginPlayerTurn();
    }

    /**
     * Inicia el turno del oponente. Resuelve el poder ESPÍRITU (Conducto) y la
     * Convergencia rival. Si el oponente conservó los 6 tipos, devuelve victoria.
     * @returns {{winner?: string, reason?: string, turnNumber: number, mustAttack: boolean, turnsSinceLastAttack: number}}
     */
    startOpponentTurn() {
        if (this.turn.opponentConvergenceBlocked) {
            this.turn.opponentConvergenceBlocked = false;
            this.turn.opponentConvergenceArmed = false;
            console.log('[GameMatch] Conducto: la Convergencia del oponente queda anulada este turno.');
            this._emitConvergenceStatus();
        } else if (this.turn.opponentConvergenceArmed
            && ConvergenceService.isConverged(this.opponent.field.types(), this.config.UNIQUE_TYPES_TO_WIN)) {
            return { winner: 'opponent', reason: 'convergence' };
        }
        return this.turn.beginOpponentTurn();
    }

    /**
     * Sincroniza los flags de Convergencia de ambos jugadores con los tipos
     * únicos presentes en su campo.
     */
    syncConvergence() {
        this.turn.playerConvergenceArmed = ConvergenceService.isConverged(
            this.player.field.types(),
            this.config.UNIQUE_TYPES_TO_WIN
        );
        this.turn.opponentConvergenceArmed = ConvergenceService.isConverged(
            this.opponent.field.types(),
            this.config.UNIQUE_TYPES_TO_WIN
        );
        this._emitConvergenceStatus();
    }

    /**
     * Evalúa las condiciones de victoria al final de un turno.
     * @returns {string|null} 'player', 'opponent' o null.
     */
    checkVictoryConditions() {
        this.syncConvergence();
        this.lastVictoryResult = VictoryEvaluator.evaluate({
            player: this.player,
            opponent: this.opponent,
            turn: this.turn,
            config: this.config,
            gems: { player: this.player.gems, opponent: this.opponent.gems },
            mode: this.mode
        });
        if (this.lastVictoryResult.log) console.log(this.lastVictoryResult.log);
        return this.lastVictoryResult.winner;
    }

    /**
     * Ejecuta el poder de esencia del jugador (clic en un orbe propio activo).
     * Obtiene el poder del registro y delega validación (EssencePowerService)
     * y ejecución. Los poderes NO consumen acciones del turno: consumen las
     * gemas de su coste y respetan las condiciones propias de cada poder.
     * Emite 'essence-power-used'.
     * @param {string} essenceType Tipo de esencia ('fuego', 'agua', ...).
     * @returns {{ok: boolean, reason?: string, essenceType?: string, name?: string, changed?: string[], gemCost?: number}}
     */
    hasPurchasedPowerCharge(essenceType) {
        return Number(this.purchasedPowerCharges[essenceType] || 0) > 0;
    }

    getEssencePowerPlan(essenceType, { side = 'player' } = {}) {
        const expectedTurn = side === 'opponent' ? 'opponent-turn' : 'player-turn';
        if (this.turn.state !== expectedTurn) return { ok: false, reason: 'es-tu-turno' };
        const poder = PoderesRegistry.get(essenceType);
        if (!poder) return { ok: false, reason: 'tipo-desconocido' };
        return poder.canUse(this.createPowerContext(side));
    }

    createPowerContext(side = 'player') {
        const isOpponent = side === 'opponent';
        const actor = isOpponent ? this.opponent : this.player;
        const target = isOpponent ? this.player : this.opponent;
        return {
            player: actor,
            opponent: target,
            side,
            actingPlayer: actor,
            targetPlayer: target,
            turn: this.turn,
            match: this,
            emitConvergenceStatus: () => this._emitConvergenceStatus()
        };
    }

    useEssencePower(essenceType, { side = 'player', purchasedChargeAuthorized = false } = {}) {
        const isOpponent = side === 'opponent';
        const actor = isOpponent ? this.opponent : this.player;
        const expectedTurn = isOpponent ? 'opponent-turn' : 'player-turn';
        if (this.turn.state !== expectedTurn) {
            return { ok: false, reason: 'es-tu-turno' };
        }

        const poder = PoderesRegistry.get(essenceType);
        if (!poder) return { ok: false, reason: 'tipo-desconocido' };

        const ctx = this.createPowerContext(side);
        const plan = poder.canUse(ctx);
        if (!plan.ok) {
            return { ok: false, reason: plan.reason, name: plan.name, gemCost: plan.gemCost };
        }
        if (plan.usedPurchasedCharge && (isOpponent || !purchasedChargeAuthorized)) {
            return { ok: false, reason: 'carga-pendiente', name: plan.name, gemCost: plan.gemCost };
        }

        const gemCost = plan.gemCost || 0;
        if (gemCost > 0 && !actor.gems.consume(essenceType, gemCost)) {
            return { ok: false, reason: 'sin-gemas', name: plan.name, gemCost };
        }

        if (plan.usedPurchasedCharge) {
            this.purchasedPowerCharges[essenceType] = Math.max(0, Number(this.purchasedPowerCharges[essenceType] || 0) - 1);
        }
        this.turn.registerPowerUse(essenceType, side);
        const changed = poder.execute(ctx) || [];
        this.events.emit('essence-power-used', { essenceType, name: plan.name, gemCost, purchased: plan.usedPurchasedCharge, ownerId: actor.id, side });
        if (gemCost > 0) {
            this.events.emit('gems-spent', {
                ownerId: actor.id,
                type: essenceType,
                progress: actor.gems.progress()
            });
        }
        return { ok: true, essenceType, name: plan.name, changed, gemCost, purchased: plan.usedPurchasedCharge, ownerId: actor.id, side };
    }

    /**
     * Resuelve el ataque y aplica daño a la carta defensora. Ráfaga añade
     * daño al siguiente ataque si está activa.
     * @param {object} params
     * @param {number} params.attackerIndex Índice de la carta atacante en el campo.
     * @param {number} params.defenderIndex Índice de la carta defensora en el campo.
     * @returns {{result: object, attackerData: object, defenderData: object, attackerIndex: number, defenderIndex: number}|null}
     */
    resolvePlayerAttack({ attackerIndex, defenderIndex }) {
        if (this.turn.state !== 'player-turn' || !this.turn.canPlayerAct()) return null;
        const attackerData = this.player.field.get(attackerIndex);
        const defenderData = this.opponent.field.get(defenderIndex);
        if (!attackerData || !defenderData) return null;

        const bonusDamage = this.turn.playerNextAttackBreaksTie ? 15 : 0;
        const result = resolveCombat(attackerData, defenderData, { bonusDamage });
        return { result, attackerData, defenderData, attackerIndex, defenderIndex };
    }

    /**
     * Gasta una acción del jugador (colocación de carta o fusión). Una fusión
     * cuenta como una única acción aunque combine varias cartas.
     * @returns {number} Acciones que quedan disponibles en el turno.
     */
    consumePlayerAction() {
        return this.turn.consumePlayerAction();
    }

    /**
     * Consume la acción de ataque del jugador: gasta una acción del cupo,
     * registra el ataque y agota Ráfaga (el próximo ataque vuelve al daño
     * normal). Atacar cumple además la obligación de atacar:
     * el resto del cupo queda libre para colocar o fusionar.
     * @returns {number} Acciones que quedan disponibles en el turno.
     */
    markPlayerAttackConsumed() {
        this.turn.consumePlayerAction();
        this.turn.playerPerformedAttackThisTurn = true;
        this.turn.playerTurnsSinceLastAttack = 0;
        this.turn.playerNextAttackBreaksTie = false;
        this.turn.playerMustAttackThisTurn = false;
        return this.turn.playerActionsLeft;
    }

    /**
     * Emite el estado de Convergencia a una eventual UI.
     */
    _emitConvergenceStatus() {
        this.events.emit('convergence-status', {
            player: this.turn.playerConvergenceArmed,
            opponent: this.turn.opponentConvergenceArmed
        });
    }
}

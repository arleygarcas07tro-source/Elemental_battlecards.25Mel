import { calculateAttackDamage } from '../helpers/combat.js';
import CardHealthService from './CardHealthService.js';
import { getBaseCardTypes } from '../game_objects/card-definitions.js';
import { CARD_TYPES } from '../helpers/constants.js';

const between = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Decide las acciones del oponente (bot) según su nivel de dificultad.
 * Clase de lógica pura: recibe datos del modelo (campo/mano/cartas) y
 * devuelve un plan de acción ({ kind: 'fusion' | 'directAttack' | 'attack'
 * | 'playCard' | 'usePower' | 'pass' }). No depende de Phaser ni de la escena.
 */
export default class BotAI {
    /**
     * @param {number} [difficulty=3] Nivel de dificultad (1-10).
     */
    constructor(difficulty = 3) {
        this.gemFocus = false;
        this.setDifficulty(difficulty);
    }

    /**
     * Activa/desactiva el foco en recolectar gemas (modos con gemas): el bot
     * siempre intenta fusionar y prioriza las fusiones hacia nivel 3.
     * @param {boolean} enabled
     */
    setGemFocus(enabled) {
        this.gemFocus = !!enabled;
    }

    /**
     * Cambia el nivel de dificultad del bot.
     * @param {number} difficulty Nivel 1-10.
     */
    setDifficulty(difficulty) {
        this.difficulty = Math.max(1, Math.min(10, Math.round(Number(difficulty) || 1)));
        this._delay = this.computeActionDelay();
        this._scoreModifier = this.computeScoreModifier();
    }

    /**
     * Probabilidad/regla de si el bot intenta fusionar según la dificultad.
     * @returns {boolean}
     */
    shouldAttemptFusion() {
        switch (this.difficulty) {
            case 1:
                return false;
            case 2:
                return Math.random() < 0.2;
            case 3:
                return Math.random() < 0.4;
            case 4:
                return Math.random() < 0.8;
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
                return true;
            default:
                return Math.random() < 0.4;
        }
    }

    shouldUseEssencePower() {
        const chanceByLevel = [0, 0, 0.12, 0.24, 0.4, 0.55, 0.68, 0.8, 0.92, 1];
        return Math.random() < chanceByLevel[Math.max(0, Math.min(9, this.difficulty - 1))];
    }

    findUsefulEssencePower({ opponent, player, match, mustAttack, bestAttackPool, revealedDefenders }) {
        if (!opponent || !player || !match || !this.shouldUseEssencePower()) return null;
        const playerTypes = player.field.types();
        const strategicThreat = match.turn.playerConvergenceArmed || playerTypes.size >= 5;
        const bestAttack = this.findBestAttack(bestAttackPool, revealedDefenders);
        const attackIsWorthBoosting = bestAttack && (mustAttack || bestAttack.score >= this.getAttackThreshold());
        const options = [
            { type: CARD_TYPES.ESPIRITU, useful: strategicThreat, value: 6 },
            { type: CARD_TYPES.SOMBRA, useful: player.hand.length > 0, value: 5 },
            { type: CARD_TYPES.FUEGO, useful: Boolean(attackIsWorthBoosting), value: 4 },
            { type: CARD_TYPES.AGUA, useful: opponent.graveyard.length > 0 && opponent.hand.length < 4, value: 3 },
            { type: CARD_TYPES.PLANTA, useful: opponent.deck.getCardsCount() > 0 && opponent.hand.length <= 2, value: 2 },
        ];

        for (const option of options.sort((a, b) => b.value - a.value)) {
            if (!option.useful || !opponent.essences.has(option.type)) continue;
            const plan = match.getEssencePowerPlan(option.type, { side: 'opponent' });
            if (plan.ok) return { kind: 'usePower', essenceType: option.type };
        }
        return null;
    }

    /**
     * Threshold de puntuación para atacar según la dificultad.
     * @returns {number}
     */
    getAttackThreshold() {
        switch (this.difficulty) {
            case 6: return -1;
            case 7: return -2;
            case 8: return -3;
            case 9: return -5;
            case 10: return -10;
            case 1: return 10;
            case 2: return 7;
            case 3: return 5;
            case 4: return 3;
            case 5: return 0;
            default: return 5;
        }
    }

    /**
     * Delay (ms) de reacción antes de ejecutar la acción.
     * Se fija al cambiar la dificultad para mantener estabilidad durante la partida.
     * @returns {number}
     */
    computeActionDelay() {
        const delays = [
            [650, 900], [520, 720], [400, 560], [300, 430], [220, 330],
            [160, 250], [110, 190], [75, 140], [45, 95], [20, 55]
        ];
        const [min, max] = delays[this.difficulty - 1];
        return between(min, max);
    }

    /** Pausa entre las acciones de un mismo turno, menor en niveles altos. */
    get nextActionDelay() {
        return [420, 360, 300, 245, 195, 150, 115, 85, 60, 40][this.difficulty - 1];
    }

    /**
     * Modificador de puntuación de ataque según la dificultad.
     * @returns {number}
     */
    computeScoreModifier() {
        switch (this.difficulty) {
            case 6: return between(1, 3);
            case 7: return between(2, 5);
            case 8: return between(3, 7);
            case 9: return between(5, 10);
            case 10: return 10;
            case 1: return between(-15, -5);
            case 2: return between(-3, 0);
            case 3: return 0;
            case 4: return between(0, 2);
            case 5: return 0;
            default: return 0;
        }
    }

    get actionDelay() {
        return this._delay;
    }

    get scoreModifier() {
        return this._scoreModifier;
    }

    /**
     * Realeatoriza el delay de reacción (el bot "recalcula" su ritmo cada turno).
     */
    refreshActionDelay() {
        this._delay = this.computeActionDelay();
    }

    /**
     * Realeatoriza el modificador de puntuación (el bot "recalcula" su precisión cada turno).
     */
    refreshScoreModifier() {
        this._scoreModifier = this.computeScoreModifier();
    }

    /**
     * Encuentra el mejor ataque según puntuación.
     * @param {{card: object, index: number}[]} opponentAttackers Atacantes disponibles del oponente.
     * @param {{card: object, index: number}[]} revealedDefenders Defensores revelados del jugador.
     * @returns {{attacker: object, defender: object, score: number}|null}
     */
    findBestAttack(opponentAttackers, revealedDefenders) {
        if (opponentAttackers.length === 0 || revealedDefenders.length === 0) {
            return null;
        }

        let bestAttack = { score: -100 };
        for (const attacker of opponentAttackers) {
            for (const defender of revealedDefenders) {
                const damage = calculateAttackDamage(attacker.card, defender.card);
                let currentScore = damage;
                if (damage >= CardHealthService.percent(defender.card)) {
                    currentScore += 20 + defender.card.level * 2;
                }
                currentScore += this.scoreModifier;

                if (currentScore > bestAttack.score) {
                    bestAttack = { attacker, defender, score: currentScore };
                }
            }
        }

        return bestAttack.score > 0 ? bestAttack : null;
    }

    /**
     * Busca la mejor fusión de campo posible (dos cartas iguales de nivel < 3).
     * @param {import('../game_objects/player.js').default} opponentFieldModel Esperado: el Battlefield del oponente.
     * @param {object[]} opponentHand La mano del oponente.
     * @returns {{indices: number[]}|null}
     */
    findBestFusion(opponentField, opponentHand) {
        const samePairs = [];
        for (let i = 0; i < opponentField.size; i++) {
            for (let j = i + 1; j < opponentField.size; j++) {
                const a = opponentField.get(i), b = opponentField.get(j);
                if (a && b && a.type === b.type && a.level === b.level && a.level < 3) {
                    samePairs.push({ i, j, level: a.level, type: a.type });
                }
            }
        }

        const currentTypes = opponentField.types();
        const needed = getBaseCardTypes().filter(t => !currentTypes.has(t));
        const canPlayMissingType = needed.some(type => opponentHand.some(card => card.type === type));
        const shouldPreserveOpenSlotForMissingType = !this.gemFocus
            && opponentField.emptyIndices().length > 0
            && canPlayMissingType;

        if (samePairs.length > 0
            && !shouldPreserveOpenSlotForMissingType
            && (needed.length > 0 || opponentHand.length === 0 || this.gemFocus)) {
            // En niveles altos se prioriza crear nivel 3; en los bajos, fusiones
            // sencillas. En modo gemas también se busca llegar al nivel 3.
            samePairs.sort((a, b) => (this.gemFocus || this.difficulty >= 7)
                ? (b.level - a.level)
                : (a.level - b.level));
            return { indices: [samePairs[0].i, samePairs[0].j] };
        }

        return null;
    }

    /**
     * Elige una carta y una casilla para desarrollar el campo del bot.
     * Prioriza elementos que todavía no tiene; las dificultades altas también
     * valoran el nivel y el daño potencial contra las cartas rivales.
     * @param {object} opponent
     * @param {{card: object, index: number}[]} playerFieldCards
     * @returns {{kind: 'playCard', handIndex: number, slotIndex: number, coversMissingType: boolean}|null}
     */
    findBestCardToPlay(opponent, playerFieldCards = []) {
        const emptySlots = opponent.field.emptyIndices();
        if (emptySlots.length === 0 || opponent.hand.length === 0) return null;

        const currentTypes = opponent.field.types();
        const missingTypes = getBaseCardTypes().filter(type => !currentTypes.has(type));
        let best = null;

        opponent.hand.forEach((card, handIndex) => {
            const coversMissingType = missingTypes.includes(card.type);
            const healthLevelWeight = this.difficulty * 0.35;
            const tacticalWeight = this.difficulty / 10;
            let score = (coversMissingType ? 100 : 0) + card.level * healthLevelWeight;

            playerFieldCards.forEach(({ card: defender }) => {
                const damage = calculateAttackDamage(card, defender);
                score += damage * 0.15 * tacticalWeight;
                if (damage >= CardHealthService.percent(defender)) score += 10 * tacticalWeight;
            });

            if (!best || score > best.score) {
                best = {
                    kind: 'playCard',
                    handIndex,
                    slotIndex: emptySlots[0],
                    coversMissingType,
                    score
                };
            }
        });

        return best;
    }

    /**
     * Decide la acción del oponente para este turno.
     * @param {{
     *   opponent: object,
     *   mustAttack: boolean,
     *   playerHasField: boolean,
     *   opponentAttackers: {card: object, index: number}[],
     *   bestAttackPool: {card: object, index: number}[],
     *   revealedDefenders: {card: object, index: number}[],
     *   playerFieldCards: {card: object, index: number}[]
     * }} opts
     * @returns {object} Plan de acción con un `kind` y datos del objetivo.
     */
    decideAction(opts) {
        const { opponent, player, match, mustAttack, playerHasField, opponentAttackers, bestAttackPool, revealedDefenders, playerFieldCards } = opts;
        const legalAttackers = Array.isArray(bestAttackPool) ? bestAttackPool : opponentAttackers;
        // Un ataque obligatorio solo bloquea otras jugadas si el bot tiene
        // al menos una carta que pueda atacar ahora (sin descanso ni cooldown).
        const attackRequiredNow = mustAttack && legalAttackers.length > 0;

        const bestAttack = this.findBestAttack(bestAttackPool, revealedDefenders);

        // 2) Obligado a atacar y sin defensas -> ataque directo por esencias.
        if (attackRequiredNow && !playerHasField) {
            return { kind: 'directAttack', attackerIndex: randPick(legalAttackers).index };
        }

        // 3) Obligado a atacar con mejor ataque calculado.
        if (attackRequiredNow && bestAttack) {
            return { kind: 'attack', attackerIndex: bestAttack.attacker.index, defenderIndex: bestAttack.defender.index };
        }

        // 4) Ataque opcional según threshold de dificultad.
        if (!mustAttack && bestAttack && bestAttack.score >= this.getAttackThreshold()) {
            return { kind: 'attack', attackerIndex: bestAttack.attacker.index, defenderIndex: bestAttack.defender.index };
        }

        // 5) Obligado a atacar sin opciones calculadas -> ataque aleatorio forzado.
        if (attackRequiredNow) {
            if (playerFieldCards.length === 0) {
                return { kind: 'directAttack', attackerIndex: randPick(legalAttackers).index };
            }
            const attacker = randPick(legalAttackers);
            const defender = randPick(playerFieldCards);
            return { kind: 'attack', attackerIndex: attacker.index, defenderIndex: defender.index };
        }

        // En el turno obligatorio, el ataque se resuelve antes de considerar poderes.
        // Los poderes no consumen acciones y pueden usarse después del ataque requerido.
        const power = this.findUsefulEssencePower({ opponent, player, match, mustAttack: attackRequiredNow, bestAttackPool, revealedDefenders });
        if (power) return power;

        // Desarrolla los elementos que faltan antes de fusionar duplicados.
        const playCard = !attackRequiredNow ? this.findBestCardToPlay(opponent, playerFieldCards) : null;
        if (playCard && playCard.coversMissingType) return playCard;

        // Fusiona si no desplaza una jugada que amplíe los tipos del campo.
        const shouldTryFusion = this.gemFocus || this.shouldAttemptFusion() || !playCard;
        if (!attackRequiredNow && shouldTryFusion) {
            const fusion = this.findBestFusion(opponent.field, opponent.hand);
            if (fusion) return { kind: 'fusion', indices: fusion.indices };
        }

        // Ocupa el campo con la mejor carta restante si no hay jugada táctica.
        if (!attackRequiredNow && playCard) return playCard;

        // 7) Sin acción posible.
        return { kind: 'pass' };
    }
}

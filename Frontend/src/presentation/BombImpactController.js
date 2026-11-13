import CardHealthService from '../game/CardHealthService.js';

/** Coordina el daño de bomba con el modelo de partida y la carta visual. */
export default class BombImpactController {
    constructor(ctx) {
        this.ctx = ctx;
    }

    apply(ownerId, fieldIndex) {
        const owner = ownerId === 'player' ? this.ctx.player : this.ctx.opponent;
        const cardData = owner?.field?.get(fieldIndex);
        if (!cardData) return false;

        const result = CardHealthService.applyBombDamage(cardData);
        if (result.destroyed) {
            this.ctx.turnController.destroyCard(owner, fieldIndex, cardData.instanceId);
        } else {
            const isOpponent = ownerId === 'opponent';
            const cardObject = this.ctx.scene.children.list.find((child) =>
                child.getData?.('isCardOnField')
                && child.getData('isOpponentCard') === isOpponent
                && child.getData('fieldIndex') === fieldIndex
            );
            cardObject?.syncHealthIndicator?.();
        }

        this.ctx.match.syncConvergence();
        const winner = this.ctx.match.checkVictoryConditions();
        if (winner) this.ctx.turnController.endGame(winner, this.ctx.match.lastVictoryResult.reason);
        return true;
    }
}

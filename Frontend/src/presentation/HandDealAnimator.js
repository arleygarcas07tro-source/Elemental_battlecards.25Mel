/**
 * Coordina la presentación del reparto inicial sin alterar el mazo ni la mano
 * del dominio. Mueve las cartas ya elegidas y revela únicamente la mano propia.
 */
export default class HandDealAnimator {
    constructor(scene, layout) {
        this.scene = scene;
        this.layout = layout;
        this.cancelled = false;
    }

    async dealInitialHands({ playerCards = [], opponentCards = [] } = {}) {
        const playerDeck = this.createDeckStack('card-back-player', this.layout.trays.player, this.layout.cardHand);
        const opponentDeck = this.createDeckStack('card-back-opponent', this.layout.trays.opponent, this.layout.cardOpponentHand);

        this.scene.events.once('shutdown', () => {
            this.cancelled = true;
        });

        try {
            await Promise.all([
                this.shuffleStack(playerDeck),
                this.shuffleStack(opponentDeck),
            ]);

            await Promise.all([
                this.dealHand(playerCards, playerDeck, true),
                this.dealHand(opponentCards, opponentDeck, false),
            ]);
        } finally {
            playerDeck.destroy(true);
            opponentDeck.destroy(true);
        }
    }

    createDeckStack(texture, tray, cardSize) {
        const stack = this.scene.add.container(tray.x, tray.y).setDepth(80);
        const width = cardSize.width * 0.48;
        const height = cardSize.height * 0.48;

        [-1, 0, 1].forEach((offset) => {
            const back = this.scene.add.image(offset * 3, -offset * 2, texture)
                .setDisplaySize(width, height)
                .setAngle(offset * 2);
            stack.add(back);
        });

        stack.setAlpha(0);
        return stack;
    }

    shuffleStack(stack) {
        if (!stack?.active) return Promise.resolve();
        return this.tween({
            targets: stack,
            alpha: 1,
            angle: 5,
            duration: 170,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.InOut',
        });
    }

    async dealHand(cards, deckStack, revealAfterDeal) {
        const source = { x: deckStack.x, y: deckStack.y };
        for (const card of cards) {
            if (this.cancelled || !card?.active) return;
            await this.dealCard(card, source, revealAfterDeal);
            if (this.cancelled) return;
            await this.delay(72);
        }
    }

    async dealCard(card, source, revealAfterDeal) {
        const target = {
            x: card.getData('startPosition')?.x ?? card.x,
            y: card.getData('startPosition')?.y ?? card.y,
            width: card.displayWidth,
            height: card.displayHeight,
            scaleX: card.scaleX,
            scaleY: card.scaleY,
            depth: card.depth,
        };

        card.setDepth(120)
            .setPosition(source.x, source.y)
            .setScale(target.scaleX * 0.48, target.scaleY * 0.48)
            .setAngle(-4)
            .setAlpha(0);
        card.syncPresentation?.();

        await this.tween({
            targets: card,
            x: target.x,
            y: target.y,
            scaleX: target.scaleX,
            scaleY: target.scaleY,
            angle: 0,
            alpha: 1,
            duration: 245,
            ease: 'Cubic.Out',
            onUpdate: () => card.syncPresentation?.(),
        });

        if (this.cancelled || !card.active) return;

        if (revealAfterDeal) {
            await this.tween({
                targets: card,
                scaleX: Math.max(0.001, target.scaleX * 0.035),
                duration: 105,
                ease: 'Cubic.In',
                onUpdate: () => card.syncPresentation?.(),
            });

            if (this.cancelled || !card.active) return;
            card.reveal();
            card.setData('isRevealed', true);

            // Card.setTexture conserva el tamaño visual actual. En este
            // punto la carta está comprimida para el giro, así que reaplicamos
            // el tamaño original sobre la textura frontal antes de abrirla.
            card.setDisplaySize(target.width * 0.035, target.height);
            const revealedScaleX = card.scaleX / 0.035;
            const revealedScaleY = card.scaleY;
            await this.tween({
                targets: card,
                scaleX: revealedScaleX,
                scaleY: revealedScaleY,
                duration: 150,
                // Ease monotónico: mantiene el giro dentro del ancho objetivo.
                ease: 'Cubic.Out',
                onUpdate: () => card.syncPresentation?.(),
            });
        }

        if (card.active) {
            card.setDepth(target.depth).setPosition(target.x, target.y)
                .setDisplaySize(target.width, target.height).setAngle(0).setAlpha(1);
            card.syncPresentation?.();
        }
    }

    tween(config) {
        if (this.cancelled || !this.scene?.sys?.isActive()) return Promise.resolve();

        return new Promise((resolve) => {
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                this.scene.events.off('shutdown', finish);
                resolve();
            };

            this.scene.events.once('shutdown', finish);
            this.scene.tweens.add({
                ...config,
                onComplete: finish,
            });
        });
    }

    delay(duration) {
        if (this.cancelled || !this.scene?.sys?.isActive()) return Promise.resolve();
        return new Promise((resolve) => {
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                this.scene.events.off('shutdown', finish);
                resolve();
            };

            this.scene.events.once('shutdown', finish);
            this.scene.time.delayedCall(duration, finish);
        });
    }
}

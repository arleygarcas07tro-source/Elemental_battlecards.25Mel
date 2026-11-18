/** Presenta la cuenta regresiva previa al reparto inicial de cualquier partida. */
export default class MatchStartCountdown {
    constructor(scene) {
        this.scene = scene;
        this.cancelled = false;
        this.timer = null;
        this.resolveDelay = null;
        this.element = null;
        this.styleElement = null;
        this.onShutdown = () => this.cancel();
        scene.events.once('shutdown', this.onShutdown);
    }

    async run() {
        this.addStyles();

        for (const value of [3, 2, 1]) {
            // `run()` se llama desde create(); Phaser todavía puede marcar la
            // escena como no activa en ese instante. El evento shutdown es el
            // que cancela una cuenta realmente interrumpida.
            if (this.cancelled) {
                this.removeElements();
                return false;
            }

            this.show(value);
            await this.wait(1000);
        }

        this.removeElements();
        return !this.cancelled;
    }

    addStyles() {
        if (document.getElementById('elemental-match-countdown-style')) return;

        this.styleElement = document.createElement('style');
        this.styleElement.id = 'elemental-match-countdown-style';
        this.styleElement.textContent = '.elemental-match-countdown{position:fixed;inset:0;z-index:10010;display:grid;place-items:center;background:#050a16bb;color:#f4d47a;font:700 clamp(96px,20vw,220px) Georgia,serif;text-shadow:0 0 32px #27c9ff,0 8px 30px #000;pointer-events:none;animation:elemental-match-countdown-pop .85s ease both}@keyframes elemental-match-countdown-pop{0%{opacity:0;transform:scale(.55)}25%{opacity:1;transform:scale(1.1)}75%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.92)}}';
        document.head.appendChild(this.styleElement);
    }

    show(value) {
        if (!this.element) {
            this.element = document.createElement('div');
            this.element.className = 'elemental-match-countdown';
            this.element.setAttribute('role', 'status');
            this.element.setAttribute('aria-live', 'assertive');
            (document.getElementById('game-container') || document.body).appendChild(this.element);
        }

        this.element.textContent = String(value);
        this.element.style.animation = 'none';
        void this.element.offsetWidth;
        this.element.style.animation = 'elemental-match-countdown-pop .85s ease both';
    }

    wait(duration) {
        return new Promise((resolve) => {
            this.resolveDelay = resolve;
            this.timer = window.setTimeout(() => {
                this.timer = null;
                this.resolveDelay = null;
                resolve();
            }, duration);
        });
    }

    cancel() {
        this.cancelled = true;
        if (this.timer) window.clearTimeout(this.timer);
        this.timer = null;
        this.resolveDelay?.();
        this.resolveDelay = null;
        this.removeElements();
    }

    removeElements() {
        this.element?.remove();
        this.element = null;
        this.styleElement?.remove();
        this.styleElement = null;
    }

    destroy() {
        this.cancel();
        this.scene?.events?.off('shutdown', this.onShutdown);
    }
}

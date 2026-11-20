import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

/** Guía visual del nivel 1 enlazada a acciones válidas y convergencia real. */
export default class LevelOneTutorial {
    constructor(scene, username, { onStartMatch } = {}) {
        this.scene = scene;
        this.onStartMatch = onStartMatch || (() => {});
        this.started = false;
        this.key = 'elemental-tutorial-level-1:' + String(username || 'Jugador').toLowerCase();
        this.placed = 0;
        this.convergenceArmed = false;
        this.anchor = scene.game.canvas;
        this.onPlace = () => this.handleCardPlaced();
        this.onAttack = () => this.handlePlayerAttacked();
        this.onConvergence = (state) => this.handleConvergence(state);
        this.onGameOver = (winner, reason) => this.handleGameOver(winner, reason);
        scene.events.on('tutorial-card-placed', this.onPlace);
        scene.events.on('tutorial-player-attacked', this.onAttack);
        scene.events.on('convergence-status', this.onConvergence);
        scene.events.on('game-over', this.onGameOver);
        this.tour = driver({
            animate: true,
            overlayOpacity: 0.62,
            popoverClass: 'elemental-tutorial-popover',
            showProgress: true,
            progressText: '{{current}} de {{total}}',
            nextBtnText: 'Continuar',
            doneBtnText: 'Finalizar',
            showButtons: ['close'],
            onDestroyed: (_element, _step, options) => {
                if (options.reason === 'done') localStorage.setItem(this.key, '1');
            },
            onCloseClick: (_element, _step, { driver: tour, index }) => {
                if (index === 0 && !this.started) {
                    tour.destroy();
                    this.startMatchNormally();
                    return;
                }
                tour.destroy();
            },
            steps: [
                { popover: { title: '¡Bienvenido al nivel 1!', description: 'Te acompaño hasta ganar por convergencia. Primero aprenderás a colocar y atacar.', showButtons: ['next', 'close'], nextBtnText: 'Iniciar tutorial', onNextClick: (_element, _step, { driver: tour }) => { tour.destroy(); this.beginTutorial(); } } },
                { element: this.anchor, popover: { title: 'Primera acción: coloca una carta', description: 'Selecciona una carta de tu mano y arrástrala a un espacio vacío de tu campo. Ahora puedes interactuar con todo el tablero.' } },
                { element: this.anchor, popover: { title: 'Segunda acción: coloca otra carta', description: 'Coloca otra carta. En este modo, después debes hacer un ataque como tercera acción.' } },
                { element: this.anchor, popover: { title: 'Tercera acción: ataque obligatorio', description: 'Selecciona una carta de tu campo y pulsa una carta o un espacio rival para atacar.' } },
                { element: this.anchor, popover: { title: 'Completa los seis elementos en el campo', description: 'Sigue jugando y reúne Agua, Fuego, Planta, Luz, Sombra y Espíritu en tu campo. La convergencia cuenta los tipos distintos presentes en el campo, no las cartas guardadas en el mazo.' } },
                { element: this.anchor, popover: { title: 'Convergencia activada', description: '¡Ya tienes los seis elementos! Conserva los seis en el campo durante todo el turno rival; la victoria se confirma al comenzar tu siguiente turno.' } },
                { popover: { title: '¡Victoria por convergencia!', description: 'Mantuviste los seis elementos durante el turno rival y ganaste. Tutorial completado.' } }
            ]
        });
        this.addStyles();
    }

    handleCardPlaced() {
        this.placed += 1;
        if (!this.tour.isActive()) return;
        if (this.placed <= 2) this.tour.moveNext();
    }

    handlePlayerAttacked() {
        if (this.placed >= 2 && this.tour.isActive()) this.tour.moveNext();
    }

    handleConvergence(state) {
        if (!this.tour.isActive()) return;
        if (!state?.player && this.convergenceArmed) {
            this.convergenceArmed = false;
            this.tour.movePrevious();
            return;
        }
        if (!state?.player || this.convergenceArmed) return;
        this.convergenceArmed = true;
        this.tour.moveNext();
    }

    handleGameOver(winner, reason) {
        if (winner === 'player' && reason === 'convergence' && this.tour.isActive()) this.tour.moveNext();
    }

    start() {
        if (localStorage.getItem(this.key) === '1') return false;
        this.tour.drive();
        return true;
    }

    startMatchNormally() {
        if (this.started) return;
        this.started = true;
        this.onStartMatch();
    }

    beginTutorial() {
        if (this.started) return;
        this.started = true;
        this.onStartMatch();
        this.tour.drive(1);
    }

    addStyles() {
        if (document.getElementById('elemental-tutorial-style')) return;
        const style = document.createElement('style');
        style.id = 'elemental-tutorial-style';
        style.textContent = '.elemental-tutorial-popover{position:fixed!important;left:clamp(16px,8vw,120px)!important;top:50vh!important;right:auto!important;bottom:auto!important;transform:translateY(-50%)!important;margin:0!important;background:linear-gradient(145deg,#101a32,#080d1b)!important;border:1px solid #d9b95f!important;border-radius:16px!important;color:#f5edda!important}.elemental-tutorial-popover .driver-popover-title{color:#f4d47a!important;font-family:Georgia,serif}.elemental-tutorial-popover .driver-popover-description{color:#e1e7f4!important;line-height:1.55}.elemental-tutorial-popover .driver-popover-next-btn{background:#087d78!important;color:white!important;text-shadow:none!important}';
        document.head.appendChild(style);
    }

    destroy() {
        if (this.tour.isActive()) this.tour.destroy();
        this.scene.events.off('tutorial-card-placed', this.onPlace);
        this.scene.events.off('tutorial-player-attacked', this.onAttack);
        this.scene.events.off('convergence-status', this.onConvergence);
        this.scene.events.off('game-over', this.onGameOver);
        document.getElementById('elemental-tutorial-style')?.remove();
    }
}

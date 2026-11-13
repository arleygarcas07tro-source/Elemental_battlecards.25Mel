import Phaser from 'phaser';
import { ELEMENT_ICONS as elementIcons } from './ui/elementCatalog.js';
import { fetchShopState } from '../helpers/shopApi.js';
import { resolvePlayerData } from '../helpers/playerData.js';

export default class LoadingScene extends Phaser.Scene {
    constructor() {
        super('LoadingScene');
    }

    init(data) {
        data = data || {};
        this.playerData = resolvePlayerData(data.playerData || data);
        this.destinationScene = data.destinationScene || null;
        this.destinationData = data.destinationData || null;
        this.destinationReady = false;
        this.destinationTransitionComplete = false;
        this.destinationSceneInstance = null;
        this.destinationProgressHandler = null;
        this.destinationReadyHandler = null;
        this.destinationBlockedHandler = null;
        this.destinationTimeout = null;
    }

    create() {
        const { width, height } = this.scale;
        fetchShopState(this.playerData.username).catch((error) => {
            console.warn('[LoadingScene] No se pudo sincronizar el inventario de tienda:', error.message);
        });

        // Verificar si las texturas fueron cargadas por BootScene
        const hasBg = this.textures.exists('loading-background');
        const hasLogo = this.textures.exists('loading-logo');
        console.log('🎬 LoadingScene iniciada - textures - background:', hasBg, 'logo:', hasLogo);

        if (hasBg) {
            // Añadir el fondo y escalarlo en modo 'cover' para mantener la proporción
            const src = this.textures.get('loading-background').getSourceImage();
            const imgW = src.width;
            const imgH = src.height;
            const scaleX = width / imgW;
            const scaleY = height / imgH;
            const scale = Math.max(scaleX, scaleY);
            const displayW = imgW * scale;
            const displayH = imgH * scale;

            const bg = this.add.image(width / 2, height / 2, 'loading-background')
                .setOrigin(0.5)
                .setDisplaySize(displayW, displayH);
            // Enviar al fondo para que no tape otros elementos
            bg.setDepth(-10);
            console.log('✅ Fondo de carga cargado correctamente');
        } else {
            // Fallback si no está la imagen: fondo sólido (debug)
            this.add.rectangle(width / 2, height / 2, width, height, 0x050505).setOrigin(0.5);
            console.warn('⚠️ LoadingScene: loading-background no disponible, usando fondo sólido.');
        }

        // Overlay semi-transparente encima del fondo para mejorar legibilidad
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.25).setOrigin(0.5).setDepth(0);

        const titleStyle = {
            fontFamily: 'Georgia',
            fontSize: '64px',
            color: '#c68c46',
            fontStyle: 'bold',
            stroke: '#2b1d0f',
            strokeThickness: 6,
            shadow: { offsetX: 0, offsetY: 0, color: '#000', blur: 18, fill: true }
        };

        const subtitleStyle = {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#e4d2a3',
            align: 'center'
        };

        this.add.text(width / 2, height * 0.30, 'Elemental Battlecards', titleStyle).setOrigin(0.5).setDepth(5);
        const subtitle = this.destinationScene
            ? 'Preparando el campo de batalla...'
            : 'Cargando reino elemental...';
        this.add.text(width / 2, height * 0.375, subtitle, subtitleStyle).setOrigin(0.5).setDepth(5);

        const iconXStart = width / 2 - ((elementIcons.length - 1) * 100) / 2;
        const iconY = height * 0.48;

        elementIcons.forEach((icon, index) => {
            const x = iconXStart + index * 100;
            this.add.circle(x, iconY, 42, 0x1b1308, 0.7).setStrokeStyle(2, 0xd7b276, 0.7).setDepth(5);

            if (this.textures.exists(icon.key)) {
                this.add.image(x, iconY, icon.key)
                    .setOrigin(0.5)
                    .setDisplaySize(64, 64)
                    .setDepth(6);
            } else {
                this.add.text(x, iconY, icon.fallback, { fontSize: '36px' }).setOrigin(0.5).setDepth(6);
            }

            this.add.text(x, iconY + 60, icon.label, { fontFamily: 'Arial', fontSize: '16px', color: '#e8d4a8' })
                .setOrigin(0.5)
                .setDepth(6);
        });

        const progressBarWidth = width * 0.7;
        const progressBarHeight = 18;
        const progressX = width / 2 - progressBarWidth / 2;
        const progressY = height * 0.70;

        const progressBg = this.add.rectangle(progressX, progressY, progressBarWidth, progressBarHeight, 0x1a1a1a).setOrigin(0).setDepth(5);
        progressBg.setStrokeStyle(2, 0x38d9a9, 0.4);
        
        const progressFill = this.add.rectangle(progressX, progressY, 0, progressBarHeight, 0x38d9a9).setOrigin(0).setDepth(6);
        const progressGlow = this.add.rectangle(progressX, progressY, 0, progressBarHeight, 0x9af7d4, 0.6).setOrigin(0).setDepth(5);

        const quoteStyle = {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#999999',
            fontStyle: 'italic',
            align: 'center'
        };

        this.add.text(width / 2, progressY + 50, '"El fuego consume, pero el agua perdura. Elige sabiamente tus aliados."', quoteStyle).setOrigin(0.5).setDepth(5);

        const loadingText = this.add.text(width / 2, progressY - 36, 'Cargando 0%', { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5).setDepth(6);

        this.progressBarWidth = progressBarWidth;
        this.progressFill = progressFill;
        this.progressGlow = progressGlow;
        this.loadingText = loadingText;
        this.currentProgress = 0;

        if (this.destinationScene) {
            this._launchDestination();
            return;
        }

        // Flujo original tras iniciar sesión: mantener la presentación de 2.5 s.
        this.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 2500,
            ease: 'Power1',
            onUpdate: (tween) => this._updateProgress(tween.getValue()),
            onComplete: () => this.scene.start('HomeScenes', { playerData: this.playerData })
        });
    }

    /** Abre la escena destino debajo de la pantalla de carga y espera su señal de preparación. */
    _launchDestination() {
        const destination = this.scene.get(this.destinationScene);
        if (!destination) {
            console.error(`[LoadingScene] No existe la escena destino "${this.destinationScene}".`);
            this._returnToDifficultySelect();
            return;
        }

        this.destinationSceneInstance = destination;
        this.destinationProgressHandler = (progress) => {
            // Reservamos el último tramo para el montaje del tablero y la UI.
            this._updateProgress(10 + Math.max(0, Math.min(1, progress)) * 85);
        };
        this.destinationReadyHandler = () => this._completeDestinationTransition();
        this.destinationBlockedHandler = () => this._closeAfterDestinationRedirect();

        destination.load.on('progress', this.destinationProgressHandler);
        destination.events.once('board-ready', this.destinationReadyHandler);
        destination.events.once('board-load-blocked', this.destinationBlockedHandler);
        this.events.once('shutdown', this._cleanupDestinationListeners, this);

        this.destinationTimeout = this.time.delayedCall(20000, () => {
            console.error(`[LoadingScene] La escena "${this.destinationScene}" no informó que el tablero estuviera listo.`);
            this._returnToDifficultySelect();
        });

        this._updateProgress(5);
        this.scene.launch(this.destinationScene, this.destinationData || { playerData: this.playerData });
        // La pantalla de carga permanece sobre el campo mientras Phaser prepara sus recursos.
        this.scene.bringToTop(this.scene.key);
    }

    _completeDestinationTransition() {
        if (this.destinationTransitionComplete) return;
        this.destinationTransitionComplete = true;
        this._clearDestinationTimeout();
        this._updateProgress(100);
        // Deja que el campo y la interfaz dibujen al menos un frame bajo la carga.
        this.time.delayedCall(240, () => this.scene.stop(this.scene.key));
    }

    _closeAfterDestinationRedirect() {
        if (this.destinationTransitionComplete) return;
        this.destinationTransitionComplete = true;
        this._clearDestinationTimeout();
        this.time.delayedCall(120, () => this.scene.stop(this.scene.key));
    }

    _returnToDifficultySelect() {
        if (this.destinationTransitionComplete) return;
        this.destinationTransitionComplete = true;
        this._clearDestinationTimeout();
        if (this.destinationScene && this.scene.isActive(this.destinationScene)) {
            this.scene.stop(this.destinationScene);
        }
        this.scene.stop('UIScene');
        this.scene.start('DifficultySelectScene', { playerData: this.playerData });
    }

    _clearDestinationTimeout() {
        if (!this.destinationTimeout) return;
        this.destinationTimeout.remove(false);
        this.destinationTimeout = null;
    }

    _cleanupDestinationListeners() {
        const destination = this.destinationSceneInstance;
        if (!destination) return;
        if (this.destinationProgressHandler) destination.load.off('progress', this.destinationProgressHandler);
        if (this.destinationReadyHandler) destination.events.off('board-ready', this.destinationReadyHandler);
        if (this.destinationBlockedHandler) destination.events.off('board-load-blocked', this.destinationBlockedHandler);
        this.destinationSceneInstance = null;
    }

    _updateProgress(value) {
        if (!this.progressFill || !this.loadingText || !this.progressGlow) return;
        this.currentProgress = Math.max(this.currentProgress || 0, Math.min(100, Number(value) || 0));
        this.progressFill.width = (this.progressBarWidth * this.currentProgress) / 100;
        this.progressGlow.width = this.progressFill.width;
        this.loadingText.setText(`Cargando ${Math.round(this.currentProgress)}%`);
    }
}

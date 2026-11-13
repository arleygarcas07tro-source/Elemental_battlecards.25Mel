import Phaser from 'phaser';
import AuthSessionService from '../helpers/authSessionService.js';

const LOADER_APPEAR_DELAY_MS = 650;
const ELEMENT_TEXTURES = [
    ['icon-agua', 0x57d8f5],
    ['icon-fuego', 0xff8658],
    ['icon-planta', 0x91d77d],
    ['icon-sombra', 0xc29bff],
    ['icon-luz', 0xffdc82],
    ['icon-espiritu', 0x62d8cb],
];

/** Carga recursos y restaura la sesión; solo muestra espera si la tarea tarda. */
export default class PreloaderScene extends Phaser.Scene {
    constructor() {
        super('Preloader');
        this.loadingUi = null;
        this.loadingTimer = null;
        this.loadingShown = false;
        this.sessionResolved = false;
    }

    preload() {
        this.createLoadingScreen();

        this.load.on('loaderror', (file) => {
            console.error('Failed to process file:', file.type, '"' + file.key + '"', file.src || file.url || file.key);
        });
        this.load.on('progress', (value) => this.updateResourceProgress(value));
        this.load.once('complete', () => this.showSessionStatus());
    }

    async create() {
        this.showSessionStatus();

        let session;
        try {
            session = await AuthSessionService.restore();
        } catch (error) {
            console.warn('[Preloader] No se pudo restaurar la sesión:', error.message || error);
            session = { status: 'anonymous', playerData: null };
        }

        this.finishLoading(() => {
            if (session.status === 'authenticated') {
                // Una sesión restaurada ya está lista para el menú; evita el
                // intermedio de carga de 2.5 s que se usa tras un inicio nuevo.
                this.scene.start('HomeScenes', { playerData: session.playerData });
                return;
            }

            this.scene.start('LoginScene');
        });
    }

    createLoadingScreen() {
        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;
        const compactScale = Phaser.Math.Clamp(height / 850, 0.68, 1);
        const children = [];

        if (this.textures.exists('loading-background')) {
            const backgroundSource = this.textures.get('loading-background').getSourceImage();
            const coverScale = Math.max(width / backgroundSource.width, height / backgroundSource.height);
            children.push(this.add.image(centerX, centerY, 'loading-background')
                .setDisplaySize(backgroundSource.width * coverScale, backgroundSource.height * coverScale));
        } else {
            children.push(this.add.rectangle(centerX, centerY, width, height, 0x07101b));
        }

        children.push(this.add.rectangle(centerX, centerY, width, height, 0x020710, 0.66));
        children.push(this.add.circle(centerX, height * 0.54, Math.min(width, height) * 0.24, 0x54bed4, 0.06));

        if (this.textures.exists('loading-logo')) {
            const logoSource = this.textures.get('loading-logo').getSourceImage();
            const maxLogoWidth = Math.min(width * 0.52, 430 * compactScale);
            const maxLogoHeight = 126 * compactScale;
            const logoScale = Math.min(maxLogoWidth / logoSource.width, maxLogoHeight / logoSource.height);
            children.push(this.add.image(centerX, height * 0.36, 'loading-logo')
                .setScale(logoScale)
                .setAlpha(0.98));
        } else {
            children.push(this.add.text(centerX, height * 0.36, 'ELEMENTAL BATTLECARDS', {
                fontFamily: 'Georgia, serif',
                fontSize: `${26 * compactScale}px`,
                color: '#f0d58e',
                fontStyle: 'bold',
                letterSpacing: 2,
            }).setOrigin(0.5));
        }

        const orbit = this.add.container(centerX, height * 0.55);
        const orbitRadius = Math.min(58 * compactScale, height * 0.075);
        const orbitRing = this.add.graphics();
        orbitRing.lineStyle(1.5, 0xd6b568, 0.54).strokeCircle(0, 0, orbitRadius + 11 * compactScale);
        orbitRing.lineStyle(1, 0x62d4e6, 0.38).strokeCircle(0, 0, orbitRadius - 12 * compactScale);
        orbit.add(orbitRing);
        orbit.add(this.add.circle(0, 0, 9 * compactScale, 0x0a1925, 0.95)
            .setStrokeStyle(2, 0xf1d38c, 0.92));

        ELEMENT_TEXTURES.forEach(([texture, color], index) => {
            const angle = Phaser.Math.DegToRad(-90 + index * 60);
            const x = Math.cos(angle) * orbitRadius;
            const y = Math.sin(angle) * orbitRadius;
            orbit.add(this.add.circle(x, y, 20 * compactScale, 0x07111c, 0.92)
                .setStrokeStyle(1.5, color, 0.86));
            if (this.textures.exists(texture)) {
                orbit.add(this.add.image(x, y, texture)
                    .setDisplaySize(27 * compactScale, 27 * compactScale));
            } else {
                orbit.add(this.add.circle(x, y, 8 * compactScale, color, 0.9));
            }
        });

        children.push(orbit);
        this.orbit = orbit;
        this.tweens.add({ targets: orbit, angle: 360, duration: 18000, repeat: -1, ease: 'Linear' });

        const status = this.add.text(centerX, height * 0.68, 'Restaurando tu aventura', {
            fontFamily: 'Georgia, serif',
            fontSize: `${27 * compactScale}px`,
            color: '#f3e1b2',
            fontStyle: 'bold',
            align: 'center',
            shadow: { color: '#000000', blur: 12, fill: true, offsetY: 2 },
        }).setOrigin(0.5);
        children.push(status);
        this.loadingStatus = status;

        const hint = this.add.text(centerX, height * 0.727, 'Volviendo al menú del reino…', {
            fontFamily: 'Georgia, serif',
            fontSize: `${15 * compactScale}px`,
            color: '#b8c8d5',
            align: 'center',
        }).setOrigin(0.5);
        children.push(hint);
        this.loadingHint = hint;

        this.progressWidth = Math.min(width * 0.4, 390 * compactScale);
        this.progressHeight = 7 * compactScale;
        this.progressX = centerX - this.progressWidth / 2;
        this.progressY = height * 0.79;
        const progressTrack = this.add.rectangle(
            centerX,
            this.progressY,
            this.progressWidth,
            this.progressHeight + 4 * compactScale,
            0x0a1420,
            0.96,
        ).setStrokeStyle(1, 0xc4a45f, 0.62);
        children.push(progressTrack);

        this.progressFill = this.add.rectangle(
            this.progressX + 1,
            this.progressY,
            0,
            this.progressHeight,
            0x74d6de,
            1,
        ).setOrigin(0, 0.5);
        children.push(this.progressFill);

        this.loadingUi = this.add.container(0, 0, children).setDepth(1000).setAlpha(0);
        this.resourceProgress = 0;
        this.loadingTimer = this.time.delayedCall(LOADER_APPEAR_DELAY_MS, () => {
            if (!this.sessionResolved) this.revealLoadingScreen();
        });
    }

    updateResourceProgress(value) {
        this.resourceProgress = Phaser.Math.Clamp(Number(value) || 0, 0, 1);
        if (this.sessionResolved) return;

        this.loadingStatus?.setText('Preparando el reino elemental');
        this.loadingHint?.setText(this.resourceProgress > 0
            ? `Cargando recursos · ${Math.round(this.resourceProgress * 100)}%`
            : 'Cargando recursos…');
        this.progressFill?.setSize(Math.max(0, (this.progressWidth - 2) * this.resourceProgress), this.progressHeight);
    }

    showSessionStatus() {
        this.loadingStatus?.setText('Restaurando tu aventura');
        this.loadingHint?.setText('Volviendo al menú del reino…');
        this.startIndeterminateProgress();
    }

    startIndeterminateProgress() {
        if (!this.progressFill || this.progressTween) return;
        const segmentWidth = Math.min(88, this.progressWidth * 0.24);
        this.progressFill.setSize(segmentWidth, this.progressHeight);
        this.progressFill.setFillStyle(0xf0cf7b, 0.96);
        this.progressTween = this.tweens.add({
            targets: this.progressFill,
            x: this.progressX + this.progressWidth - segmentWidth - 1,
            duration: 1050,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut',
        });
    }

    revealLoadingScreen() {
        if (this.loadingShown || this.sessionResolved || !this.loadingUi) return;
        this.loadingShown = true;
        this.tweens.add({
            targets: this.loadingUi,
            alpha: 1,
            duration: 240,
            ease: 'Quad.Out',
        });
    }

    finishLoading(continueToScene) {
        this.sessionResolved = true;
        this.loadingTimer?.remove(false);
        this.progressTween?.stop();

        if (!this.loadingShown || !this.loadingUi) {
            continueToScene();
            return;
        }

        this.tweens.killTweensOf(this.loadingUi);
        this.tweens.add({
            targets: this.loadingUi,
            alpha: 0,
            duration: 220,
            ease: 'Quad.In',
            onComplete: continueToScene,
        });
    }
}

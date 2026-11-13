import Phaser from 'phaser';

/** Overlay de pausa: presenta controles del juego con la estética elemental. */
export default class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
        this.playerData = {};
    }

    init(data) {
        this.playerData = data.playerData || {};
    }

    create() {
        const { width, height } = this.scale;
        const compact = width < 760 || height < 650;
        const scale = Math.min(1, (width - 28) / 560, (height - 24) / 520);
        const panelWidth = Math.min(560 * scale, width - 28);
        const panelHeight = Math.min(520 * scale, height - 24);
        const centerX = width / 2;
        const centerY = height / 2;
        const panelLeft = centerX - panelWidth / 2;
        const panelTop = centerY - panelHeight / 2;
        const buttonWidth = Math.min(420 * scale, panelWidth - 52 * scale);
        const buttonHeight = compact ? Math.min(52, panelHeight * 0.13) : 58 * scale;
        const buttonGap = compact ? 12 * scale : 17 * scale;
        const buttonSpacing = buttonHeight + buttonGap;
        const buttonStartY = centerY + (compact ? 7 : 1) * scale;
        const depth = 100;

        // Capa ligera: bloquea clics en el tablero y permite que el campo siga visible.
        this.add.rectangle(0, 0, width, height, 0x020714, 0.66)
            .setOrigin(0)
            .setDepth(depth)
            .setInteractive();

        this.drawPausePanel(panelLeft, panelTop, panelWidth, panelHeight, depth + 1);
        this.createEmblem(centerX, panelTop + 74 * scale, scale, depth + 2);

        this.add.text(centerX, panelTop + 137 * scale, 'PAUSA TÁCTICA', {
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: `${Math.max(23, Math.round(32 * scale))}px`,
            fontStyle: 'bold',
            color: '#f8e5ad',
            stroke: '#171322',
            strokeThickness: 4,
            shadow: { color: '#e9bd61', blur: 16 * scale, fill: true }
        }).setOrigin(0.5).setDepth(depth + 3);

        this.add.text(centerX, panelTop + 171 * scale, 'La batalla queda en suspenso', {
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: `${Math.max(13, Math.round(16 * scale))}px`,
            color: '#c5d5e3'
        }).setOrigin(0.5).setDepth(depth + 3);

        this.drawHeaderDivider(centerX, panelTop + 197 * scale, panelWidth, scale, depth + 2);

        const continueBtn = this.createMenuButton({
            x: centerX, y: buttonStartY, width: buttonWidth, height: buttonHeight,
            label: 'CONTINUAR LA PARTIDA', icon: '▶', accent: 0x65e6c4,
            depth: depth + 4, scale
        });
        continueBtn.on('pointerdown', () => {
            this.scene.stop('PauseScene');
            this.scene.resume('GameScene');
            this.scene.resume('UIScene');
        });

        this.createMenuButton({
            x: centerX, y: buttonStartY + buttonSpacing, width: buttonWidth, height: buttonHeight,
            label: 'CONFIGURACIÓN', icon: '✧', accent: 0xeac66e,
            depth: depth + 4, scale
        }).on('pointerdown', () => {
            this.scene.start('SettingsScene', {
                playerData: this.playerData,
                returnScene: 'PauseScene'
            });
        });

        this.createMenuButton({
            x: centerX, y: buttonStartY + buttonSpacing * 2, width: buttonWidth, height: buttonHeight,
            label: 'SALIR AL MENÚ PRINCIPAL', icon: '↶', accent: 0xe18c7b,
            depth: depth + 4, scale, subdued: true
        }).on('pointerdown', () => {
            const gameScene = this.scene.get('GameScene');
            const playerData = gameScene?.playerData || this.playerData;
            this.scene.stop('UIScene');
            this.scene.stop('GameScene');
            this.scene.start('HomeScenes', { playerData });
        });

        this.add.text(centerX, panelTop + panelHeight - 27 * scale, '✦  ELEMENTAL BATTLECARDS  ✦', {
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: `${Math.max(9, Math.round(10 * scale))}px`,
            color: '#8296a7',
            letterSpacing: 2
        }).setOrigin(0.5).setDepth(depth + 3);

        this.input.keyboard.on('keydown-ESC', this.handleEscape, this);
        this.events.once('shutdown', () => {
            this.input.keyboard.off('keydown-ESC', this.handleEscape, this);
        });
    }

    drawPausePanel(left, top, width, height, depth) {
        const panel = this.add.graphics().setDepth(depth);
        panel.fillStyle(0x070d1c, 0.96);
        panel.fillRoundedRect(left, top, width, height, 26);
        panel.lineStyle(2, 0x55cbe2, 0.48);
        panel.strokeRoundedRect(left + 3, top + 3, width - 6, height - 6, 24);
        panel.lineStyle(1, 0xeac66e, 0.8);
        panel.strokeRoundedRect(left + 10, top + 10, width - 20, height - 20, 19);

        const corner = 25;
        const inset = 17;
        panel.lineStyle(2, 0xeac66e, 0.95);
        [
            [left + inset, top + inset, 1, 1],
            [left + width - inset, top + inset, -1, 1],
            [left + inset, top + height - inset, 1, -1],
            [left + width - inset, top + height - inset, -1, -1]
        ].forEach(([x, y, directionX, directionY]) => {
            panel.beginPath();
            panel.moveTo(x + corner * directionX, y);
            panel.lineTo(x, y);
            panel.lineTo(x, y + corner * directionY);
            panel.strokePath();
            panel.fillStyle(0x65e6c4, 0.95);
            panel.fillPoints([
                { x: x + directionX * 3, y },
                { x, y: y + directionY * 3 },
                { x: x - directionX * 3, y },
                { x, y: y - directionY * 3 }
            ], true);
        });

        panel.fillStyle(0x65e6c4, 0.1);
        panel.fillEllipse(left + width / 2, top + 82, width * 0.3, 54);
    }

    createEmblem(x, y, scale, depth) {
        const emblem = this.add.graphics().setPosition(x, y).setDepth(depth);
        emblem.fillStyle(0x0b1b28, 0.96);
        emblem.fillCircle(0, 0, 34 * scale);
        emblem.lineStyle(2.5, 0xeac66e, 0.95);
        emblem.strokeCircle(0, 0, 34 * scale);
        emblem.lineStyle(1, 0x65e6c4, 0.85);
        emblem.strokeCircle(0, 0, 27 * scale);
        emblem.lineStyle(1, 0xeac66e, 0.45);
        emblem.strokeCircle(0, 0, 40 * scale);

        this.add.text(x, y, 'Ⅱ', {
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: `${Math.max(24, Math.round(34 * scale))}px`,
            fontStyle: 'bold',
            color: '#eac66e'
        }).setOrigin(0.5).setDepth(depth + 1);

        const spark = this.add.circle(x + 28 * scale, y - 25 * scale, 3 * scale, 0x65e6c4, 1)
            .setDepth(depth + 1);
        this.tweens.add({ targets: spark, alpha: 0.25, scale: 0.65, duration: 850, yoyo: true, repeat: -1 });
    }

    drawHeaderDivider(centerX, y, panelWidth, scale, depth) {
        const divider = this.add.graphics().setDepth(depth);
        const halfWidth = panelWidth * 0.34;
        divider.lineStyle(1, 0x65cfe0, 0.5);
        divider.lineBetween(centerX - halfWidth, y, centerX + halfWidth, y);
        divider.fillStyle(0xeac66e, 1);
        divider.fillPoints([
            { x: centerX, y: y - 4 * scale },
            { x: centerX + 4 * scale, y },
            { x: centerX, y: y + 4 * scale },
            { x: centerX - 4 * scale, y }
        ], true);
    }

    createMenuButton({ x, y, width, height, label, icon, accent, depth, scale, subdued = false }) {
        const container = this.add.container(x, y).setDepth(depth);
        const bg = this.add.graphics();
        const draw = (hovered = false) => {
            bg.clear();
            bg.fillStyle(hovered ? 0x14283a : (subdued ? 0x17151e : 0x101d2b), hovered ? 0.98 : 0.92);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 15 * scale);
            bg.lineStyle(hovered ? 2.2 : 1.5, accent, hovered ? 0.98 : 0.78);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 15 * scale);
            bg.lineStyle(1, 0xffffff, hovered ? 0.22 : 0.1);
            bg.strokeRoundedRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8, 12 * scale);
            bg.fillStyle(accent, hovered ? 0.18 : 0.1);
            bg.fillCircle(-width / 2 + 34 * scale, 0, 20 * scale);
        };
        draw();

        const iconText = this.add.text(-width / 2 + 34 * scale, 0, icon, {
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: `${Math.max(16, Math.round(21 * scale))}px`,
            fontStyle: 'bold',
            color: `#${accent.toString(16).padStart(6, '0')}`
        }).setOrigin(0.5);
        const labelText = this.add.text(18 * scale, 0, label, {
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: `${Math.max(13, Math.round(17 * scale))}px`,
            fontStyle: 'bold',
            color: '#f4f0e6',
            letterSpacing: 0.6
        }).setOrigin(0.5);

        container.add([bg, iconText, labelText]);
        // La zona invisible cubre todo el botón y un pequeño margen para que
        // bordes, icono y texto respondan igual al clic.
        const hitArea = this.add.zone(x, y, width + 16 * scale, height + 14 * scale)
            .setDepth(depth + 1)
            .setInteractive({ useHandCursor: true });
        hitArea.on('pointerover', () => {
            draw(true);
            this.tweens.add({ targets: container, scale: 1.025, duration: 120, ease: 'Sine.Out' });
            this.input.setDefaultCursor('pointer');
        });
        hitArea.on('pointerout', () => {
            draw(false);
            this.tweens.add({ targets: container, scale: 1, duration: 120, ease: 'Sine.Out' });
            this.input.setDefaultCursor('default');
        });

        return hitArea;
    }

    handleEscape() {
        this.scene.stop('PauseScene');
        this.scene.resume('GameScene');
        this.scene.resume('UIScene');
    }
}

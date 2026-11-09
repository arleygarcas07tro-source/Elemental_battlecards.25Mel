import Phaser from 'phaser';

/**
 * Escena de Pausa - Se superpone a la GameScene cuando el jugador pausa
 * Muestra un menú elegante con opciones de continuar, reiniciar, configuración y salir
 */
export default class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
        this.isPaused = false;
        this.playerData = {};
    }

    init(data) {
        this.playerData = data.playerData || {};
    }

    create(_data) {
        const { width, height } = this.scale;
        const compact = width < 900 || height < 600;
        const titleY = compact ? Math.max(28, height * 0.12) : height * 0.15;
        const iconRadius = compact ? Math.min(34, height * 0.09) : 60;
        const titleOffset = compact ? iconRadius + 22 : 90;
        const subtitleOffset = compact ? titleOffset + Math.max(24, height * 0.075) : 140;
        const buttonWidth = Math.min(350, width - 36);
        const buttonHeight = compact ? Math.min(52, Math.max(38, height * 0.14)) : 60;
        const buttonGap = compact ? Math.max(8, Math.min(20, height * 0.04)) : 20;
        const buttonSpacing = buttonHeight + buttonGap;
        const headerBottom = titleY + subtitleOffset + (compact ? 10 : 18);
        const firstButtonY = Math.max(
            height * (compact ? 0.55 : 0.35),
            headerBottom + 10 + buttonHeight / 2
        );
        const lastSafeButtonY = height - 12 - buttonHeight / 2 - buttonSpacing * 2;
        const buttonsStartY = compact ? Math.min(firstButtonY, lastSafeButtonY) : firstButtonY;
        
        // Trasfondo oscuro semi-transparente (efecto blur)
        const _overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0)
            .setDepth(100)
            .setInteractive(); // Evita clicks detrás del menú
        
        // =============== TÍTULO ===============
        // Ícono de pausa (círculo con dos barras)
        const iconBg = this.add.graphics();
        iconBg.fillStyle(0xffd700, 0.1);
        iconBg.fillCircle(0, 0, iconRadius);
        iconBg.lineStyle(3, 0xffd700, 1);
        iconBg.strokeCircle(0, 0, iconRadius);
        iconBg.setPosition(width / 2, titleY);
        iconBg.setDepth(101);
        
        const _pauseIcon = this.add.text(width / 2, titleY, '⏸', {
            fontSize: compact ? `${Math.round(iconRadius * 1.05)}px` : '60px',
            color: '#ffd700' 
        }).setOrigin(0.5).setDepth(102);
        
        // Título
        this.add.text(width / 2, titleY + titleOffset, 'MODO NIVELES', {
            fontSize: compact ? `${Math.min(32, Math.max(20, width * 0.045))}px` : '48px',
            color: '#ffffff',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(102);
        
        // Subtítulo
        this.add.text(width / 2, titleY + subtitleOffset, 'El juego está en pausa', {
            fontSize: compact ? `${Math.min(16, Math.max(12, width * 0.025))}px` : '24px',
            color: '#cccccc',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(102);
        
        // =============== BOTONES ===============
        const centerX = width / 2;
        // Función para crear botón estilizado
        const createMenuButton = (x, y, text, icon, borderColor, bgColor) => {
            const container = this.add.container(x, y);
            
            // Fondo del botón
            const bg = this.add.graphics();
            bg.fillStyle(bgColor, 0.2);
            bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);
            bg.lineStyle(3, borderColor, 1);
            bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);
            
            // Ícono
            const iconText = this.add.text(-buttonWidth / 2 + 34, 0, icon, {
                fontSize: compact ? `${Math.min(26, buttonHeight * 0.55)}px` : '30px',
                color: borderColor
            }).setOrigin(0.5).setDepth(103);
            
            // Texto del botón
            const btnText = this.add.text(buttonWidth * 0.07, 0, text, {
                fontSize: compact ? `${Math.min(18, Math.max(12, buttonWidth * 0.05))}px` : '19px',
                color: '#ffffff',
                fontStyle: 'bold',
                fontFamily: 'Arial'
            }).setOrigin(0.5, 0.5).setDepth(103);
            
            container.add([bg, iconText, btnText]);
            container.setSize(buttonWidth, buttonHeight);
            container.setInteractive(
                new Phaser.Geom.Rectangle(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight),
                Phaser.Geom.Rectangle.Contains
            );
            container.setDepth(102);
            
            // Efectos hover
            container.on('pointerover', () => {
                container.setScale(1.05);
                bg.clear();
                bg.fillStyle(borderColor, 0.15);
                bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);
                bg.lineStyle(3, borderColor, 1.5);
                bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);
                this.input.setDefaultCursor('pointer');
            });
            
            container.on('pointerout', () => {
                container.setScale(1);
                bg.clear();
                bg.fillStyle(bgColor, 0.2);
                bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);
                bg.lineStyle(3, borderColor, 1);
                bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);
                this.input.setDefaultCursor('default');
            });
            
            return container;
        };
        
        // Botón CONTINUAR (Verde)
        const continueBtn = createMenuButton(
            centerX,
            buttonsStartY,
            'CONTINUAR',
            '▶',
            0x00ff00,
            0x006600
        );
        
        continueBtn.on('pointerdown', () => {
            this.scene.stop('PauseScene');
            this.scene.resume('GameScene');
            this.scene.resume('UIScene');
        });
        
        // Botón CONFIGURACIÓN (Naranja)
        const configBtn = createMenuButton(
            centerX,
            buttonsStartY + buttonSpacing,
            'CONFIGURACIÓN',
            '⚙',
            0xffaa00,
            0x663300
        );
        
        configBtn.on('pointerdown', () => {
            this.scene.start('SettingsScene', {
                playerData: this.playerData,
                returnScene: 'PauseScene'
            });
        });
        
        // Botón SALIR AL MENÚ (Rojo)
        const exitBtn = createMenuButton(
            centerX,
            buttonsStartY + buttonSpacing * 2,
            'SALIR AL MENÚ PRINCIPAL',
            '←',
            0xff4444,
            0x660000
        );
        
        exitBtn.on('pointerdown', () => {
            const gameScene = this.scene.get('GameScene');
            const playerData = gameScene?.playerData || this.playerData;

            this.scene.stop('UIScene');
            this.scene.stop('GameScene');
            this.scene.start('HomeScenes', { playerData });
        });
        
        // =============== TECLA ESC PARA CERRAR ===============
        this.input.keyboard.on('keydown-ESC', () => {
            continueBtn.emit('pointerdown');
        });
    }
}

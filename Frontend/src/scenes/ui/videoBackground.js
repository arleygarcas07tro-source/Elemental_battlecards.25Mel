/**
 * Helpers de presentación para fondos de video en las escenas de menú.
 * Unifican el bloque idéntico que repetían homeScene, DifficultySelectScene y
 * createRoomScene: carga perezosa, rectángulo de respaldo y configuración del
 * video a pantalla completa sin deformarlo.
 */

/**
 * Carga un video si aún no está en la caché (evita descargas duplicadas).
 * @param {Phaser.Scene} scene
 * @param {string} key
 * @param {string} url
 */
export function loadVideoIfNeeded(scene, key, url) {
    if (!scene.cache.video.exists(key)) {
        scene.load.video(key, url, { muted: true, noAudio: true });
    }
}

/**
 * Crea el fondo de video a pantalla completa sobre un rectángulo de respaldo
 * para que nunca se vea un hueco negro mientras el video prepara su primer frame.
 * @param {Phaser.Scene} scene
 * @param {string} key
 * @param {number} [fallbackColor]
 * @param {{mode?:'responsive'|'contain'|'cover'}} [options]
 * @returns {Phaser.GameObjects.Video}
 */
export function createVideoBackground(scene, key, fallbackColor = 0x0a0e22, options = {}) {
    const viewport = { width: scene.scale.width, height: scene.scale.height };
    const backdrop = scene.add.rectangle(viewport.width / 2, viewport.height / 2,
        viewport.width, viewport.height, fallbackColor).setDepth(-2);
    const bg = scene.add.video(viewport.width / 2, viewport.height / 2, key).setOrigin(0.5);
    bg.setDepth(-1);

    fitVideoInsideViewport(scene, bg, { backdrop, viewport, mode: options.mode || 'cover' });
    startLoopingVideo(bg);
    return bg;
}

export function startLoopingVideo(video) {
    video.once('ready', () => {
        const videoEl = video.video;
        if (!videoEl) return;
        videoEl.muted = true;
        videoEl.defaultMuted = true;
        videoEl.loop = true;
        videoEl.playbackRate = 1;
        videoEl.playsInline = true;
        videoEl.preload = 'auto';
    });
    video.play(true);
}

/**
 * Ajusta un video conservando su proporción, con un color complementario en
 * los márgenes. Reutilizado por login, registro y fondos de menú.
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Video} video
 * @param {{backdrop?: Phaser.GameObjects.Rectangle, viewport?: {width:number,height:number}, color?: number, mode?: 'responsive'|'contain'|'cover'}} [options]
 */
export function fitVideoInsideViewport(scene, video, options = {}) {
    const viewport = options.viewport || { width: scene.scale.width, height: scene.scale.height };
    const backdrop = options.backdrop || scene.add.rectangle(
        viewport.width / 2, viewport.height / 2, viewport.width, viewport.height, options.color ?? 0x0a0e22
    ).setDepth(video.depth - 1);

    const fit = () => {
        if (!video.width || !video.height) return;
        backdrop.setPosition(viewport.width / 2, viewport.height / 2)
            .setSize(viewport.width, viewport.height);
        video.setPosition(viewport.width / 2, viewport.height / 2);
        const mode = options.mode === 'responsive' || !options.mode
            ? 'cover'
            : options.mode;
        const scale = mode === 'cover'
            ? Math.max(viewport.width / video.width, viewport.height / video.height)
            : Math.min(viewport.width / video.width, viewport.height / video.height);
        video.setScale(scale);
    };
    const onResize = ({ width, height }) => {
        viewport.width = width;
        viewport.height = height;
        fit();
    };

    video.on('play', fit);
    video.once('created', fit);
    scene.scale.on('resize', onResize);
    scene.events.once('shutdown', () => {
        scene.scale.off('resize', onResize);
        video.off('play', fit);
        video.stop();
    });
    fit();
    return backdrop;
}

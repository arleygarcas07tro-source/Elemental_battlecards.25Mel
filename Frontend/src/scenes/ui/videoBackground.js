/**
 * Helpers de presentación para fondos de video en las escenas de menú.
 * Unifican el bloque idéntico que repetían homeScene, DifficultySelectScene y
 * createRoomScene: carga perezosa, rectángulo de respaldo y configuración del
 * video sin recortar y fondo complementario para distintas proporciones.
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
 * @param {{fillViewport?:boolean,fillAlpha?:number}} [options]
 * @returns {Phaser.GameObjects.Video}
 */
export function createVideoBackground(scene, key, fallbackColor = 0x0a0e22, options = {}) {
    const viewport = { width: scene.scale.width, height: scene.scale.height };
    const hasFullBleedFill = Boolean(options.fillViewport);

    const backdrop = scene.add.rectangle(viewport.width / 2, viewport.height / 2,
        viewport.width, viewport.height, fallbackColor).setDepth(hasFullBleedFill ? -3 : -2);

    // La capa inferior rellena el viewport; el video frontal conserva el encuadre completo.
    // Esta función agrega únicamente una responsabilidad visual: complementar las bandas del video.
    const fill = hasFullBleedFill
        ? scene.add.video(viewport.width / 2, viewport.height / 2, key)
            .setOrigin(0.5)
            .setDepth(-2)
            .setAlpha(options.fillAlpha ?? 0.48)
        : null;
    const bg = scene.add.video(viewport.width / 2, viewport.height / 2, key).setOrigin(0.5);
    bg.setDepth(-1);

    if (fill) {
        fitVideoInsideViewport(scene, fill, { backdrop, viewport, mode: 'cover' });
        startLoopingVideo(fill);
    } else {
        fitVideoInsideViewport(scene, bg, { backdrop, viewport });
    }
    if (fill) fitVideoInsideViewport(scene, bg, { viewport, backdrop });

    startLoopingVideo(bg);
    return bg;
}

function startLoopingVideo(video) {
    video.once('ready', () => {
        const videoEl = video.video;
        if (!videoEl) return;
        videoEl.muted = true;
        videoEl.defaultMuted = true;
        videoEl.loop = true;
        videoEl.playbackRate = 1;
        videoEl.playsInline = true;
        videoEl.preload = 'auto';
        videoEl.currentTime = 0;
        videoEl.play().catch(() => {});
    });
    video.play(true);
}

/**
 * Ajusta un video conservando su proporción, con un color complementario en
 * los márgenes. Reutilizado por login, registro y fondos de menú.
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Video} video
 * @param {{backdrop?: Phaser.GameObjects.Rectangle, viewport?: {width:number,height:number}, color?: number, mode?: 'contain'|'cover'}} [options]
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
        const scale = options.mode === 'cover'
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
    });
    fit();
    return backdrop;
}

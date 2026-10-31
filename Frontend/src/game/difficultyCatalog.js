/**
 * Catálogo de los 10 niveles de dificultad del bot (capa de datos del dominio).
 * GameScene y BotAI interpretan esta semántica numérica (1-10).
 */

export const DIFFICULTY_LEVELS = [
    { level: 1,  name: 'Muy Fácil',   icon: 'agua',    clr: '#5bc0ff', desc: 'Responde despacio y no usa poderes.' },
    { level: 2,  name: 'Fácil',       icon: 'planta',  clr: '#7fe09a', desc: 'Juega con calma y rara vez fusiona.' },
    { level: 3,  name: 'Normal',      icon: 'luz',     clr: '#f1c86a', desc: 'Responde más rápido y puede usar poderes.' },
    { level: 4,  name: 'Difícil',     icon: 'fuego',   clr: '#ff9a5c', desc: 'Ataca y usa poderes con más frecuencia.' },
    { level: 5,  name: 'Muy Difícil', icon: 'sombra',  clr: '#b78bff', desc: 'Reacciona rápido y aprovecha mejor sus esencias.' },
    { level: 6,  name: 'Experto',     icon: 'espiritu', clr: '#8b5cf6', desc: 'Combina ataques, fusiones y poderes.' },
    { level: 7,  name: 'Maestro',     icon: 'agua',    clr: '#3b82f6', desc: 'Usa poderes con frecuencia y responde rápido.' },
    { level: 8,  name: 'Gran Maestro', icon: 'fuego',  clr: '#ff5c5c', desc: 'Toma decisiones rápidas y aprovecha oportunidades.' },
    { level: 9,  name: 'Leyenda',     icon: 'planta',  clr: '#34d399', desc: 'Casi siempre usa poderes útiles disponibles.' },
    { level: 10, name: 'Mito',        icon: 'luz',     clr: '#ffd666', desc: 'Reacciona al máximo y usa poderes útiles.' }
];

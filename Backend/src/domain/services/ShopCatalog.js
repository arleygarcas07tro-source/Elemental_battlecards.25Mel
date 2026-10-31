'use strict';

const CARD_TYPES = ['agua', 'fuego', 'planta', 'luz', 'sombra', 'espiritu'];
const CARD_LABELS = {
  agua: 'Agua', fuego: 'Fuego', planta: 'Planta', luz: 'Luz', sombra: 'Sombra', espiritu: 'Espíritu',
};
const CARD_NAMES = {
  agua: ['Espíritu Marino', 'Tifón Abisal', 'Leviatán de Hielo'],
  fuego: ['Chispa Salvaje', 'Coloso Ígneo', 'Fénix Devorador'],
  planta: ['Brote Guardián', 'Selva Viva', 'Ente Raigal'],
  luz: ['Brisa del Alba', 'Tormenta Radiante', 'Dragón Celestial'],
  sombra: ['Velo Sombrío', 'Eclipse Abisal', 'Señor de las Sombras'],
  espiritu: ['Pilar Ancestral', 'Montaña Errante', 'Titán Telúrico'],
};

const backgrounds = [
  { id: 'fondo-aurora', name: 'Aurora elemental', description: 'La arena bajo una luz celeste.', price: 50, currency: 'gems', tint: '7ca8ff', style: 'aurora' },
  { id: 'fondo-volcan', name: 'Corazón volcánico', description: 'Un resplandor de fuego sobre el campo.', price: 50, currency: 'gems', tint: 'ff8461', style: 'volcan' },
  { id: 'fondo-abismo', name: 'Abismo arcano', description: 'Sombras violetas envuelven la arena.', price: 50, currency: 'gems', tint: 'a17bdf', style: 'abismo' },
].map((item) => ({ ...item, category: 'background', repeatable: false }));

const cards = CARD_TYPES.flatMap((type) => [1, 2, 3].map((level) => ({
  id: `carta-${type}-${level}`,
  name: CARD_NAMES[type][level - 1],
  description: `${CARD_LABELS[type]} · Nivel ${level}`,
  category: 'card',
  price: 20,
  currency: 'coins',
  type,
  level,
  repeatable: false,
})));

const powers = [
  ['fuego', 'Ráfaga', 'Tu próximo ataque de este turno causa daño adicional.'],
  ['agua', 'Rescate', 'Devuelve una carta básica de tu cementerio a la mano.'],
  ['planta', 'Brotar', 'Roba dos cartas de tu mazo.'],
  ['luz', 'Clarividencia', 'Revela la mano del rival.'],
  ['sombra', 'Robar', 'El rival descarta su carta de mayor nivel.'],
  ['espiritu', 'Conducto', 'Bloquea la Convergencia del rival durante un turno.'],
].map(([type, name, description]) => ({
  id: `poder-${type}`,
  name,
  description,
  category: 'power',
  price: 20,
  currency: 'coins',
  type,
  repeatable: true,
}));

const ITEMS = Object.freeze([
  ...backgrounds,
  ...cards,
  ...powers,
]);

function getItem(itemId) {
  return ITEMS.find((item) => item.id === itemId) || null;
}

module.exports = { ITEMS, getItem };

'use strict';

const IShopRepository = require('../contracts/IShopRepository');
const { ValidationError, ConflictError } = require('../../core/errors');
const { ITEMS, getItem } = require('./ShopCatalog');

class ShopService {
  constructor({ shopRepository }) {
    IShopRepository.assert(shopRepository);
    this.shopRepository = shopRepository;
  }

  async getState(userId) {
    const state = await this.shopRepository.getState(userId);
    const owned = new Map(state.items.map((item) => [item.itemId, item]));
    const equipped = state.items.find((item) => item.equipped);

    return {
      wallet: state.wallet,
      equippedBackground: equipped ? equipped.itemId : 'fondo-base',
      catalog: ITEMS.map((item) => {
        const inventory = owned.get(item.id);
        return {
          ...item,
          owned: item.repeatable ? (inventory ? inventory.quantity > 0 : false) : Boolean(inventory),
          quantity: inventory ? inventory.quantity : 0,
          equipped: Boolean(inventory && inventory.equipped),
        };
      }),
    };
  }

  async purchase(userId, itemId) {
    const item = getItem(itemId);
    if (!item) throw new ValidationError('El artículo no existe.');

    const result = await this.shopRepository.purchase(userId, item);
    if (!result.ok && result.reason === 'already-owned') {
      throw new ConflictError('Ya tienes este artículo.');
    }
    if (!result.ok && result.reason === 'insufficient-funds') {
      throw new ConflictError(`No tienes suficientes ${item.currency === 'coins' ? 'monedas' : 'gemas'}.`);
    }
    if (!result.ok && result.reason === 'unavailable') {
      throw new ConflictError('El artículo ya no está disponible.');
    }
    return this.getState(userId);
  }

  async equipBackground(userId, itemId) {
    const item = itemId === 'fondo-base' ? null : getItem(itemId);
    if (item && item.category !== 'background') {
      throw new ValidationError('Solo puedes equipar fondos de combate.');
    }
    const equipped = await this.shopRepository.equipBackground(userId, itemId);
    if (!equipped) throw new ConflictError('Primero debes comprar ese fondo.');
    return this.getState(userId);
  }

  async consumePower(userId, type) {
    const itemId = `poder-${type}`;
    const item = getItem(itemId);
    if (!item || item.category !== 'power') throw new ValidationError('El poder no existe.');
    const consumed = await this.shopRepository.consumePower(userId, itemId);
    if (!consumed) throw new ConflictError('No tienes cargas compradas de ese poder.');
    return this.getState(userId);
  }
}

module.exports = ShopService;

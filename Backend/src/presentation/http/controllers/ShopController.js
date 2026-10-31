'use strict';

class ShopController {
  constructor(shopService) {
    if (!shopService || !['getState', 'purchase', 'equipBackground', 'consumePower'].every((method) => typeof shopService[method] === 'function')) {
      throw new TypeError('[ShopController] Se requiere un servicio de tienda válido.');
    }
    this.shopService = shopService;
  }

  async getState(req, res, next) {
    try { res.json(await this.shopService.getState(req.user.id)); } catch (error) { next(error); }
  }

  async purchase(req, res, next) {
    try { res.json(await this.shopService.purchase(req.user.id, (req.body || {}).itemId)); } catch (error) { next(error); }
  }

  async equipBackground(req, res, next) {
    try { res.json(await this.shopService.equipBackground(req.user.id, (req.body || {}).itemId)); } catch (error) { next(error); }
  }

  async consumePower(req, res, next) {
    try { res.json(await this.shopService.consumePower(req.user.id, (req.body || {}).type)); } catch (error) { next(error); }
  }
}

module.exports = ShopController;

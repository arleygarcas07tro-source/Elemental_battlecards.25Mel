'use strict';

const { Op, literal } = require('sequelize');

class SequelizeShopRepository {
  constructor(models) {
    if (!models || !models.PlayerStats || !models.PlayerShopItem) {
      throw new TypeError('[SequelizeShopRepository] Faltan modelos de saldo o inventario.');
    }
    this.models = models;
  }

  async getState(userId) {
    const [stats, items] = await Promise.all([
      this.models.PlayerStats.findByPk(userId),
      this.models.PlayerShopItem.findAll({ where: { userId } }),
    ]);
    return {
      wallet: { coins: stats ? stats.coins : 0, gems: stats ? stats.gems : 0 },
      items: items.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        equipped: item.equipped,
      })),
    };
  }

  async purchase(userId, item) {
    const sequelize = this.models.PlayerStats.sequelize;
    if (sequelize.getDialect() !== 'postgres') {
      return this.purchaseWithModelTransaction(userId, item);
    }

    try {
      await sequelize.transaction(async (transaction) => {
        await sequelize.query(
          'CALL public.sp_comprar_articulo_tienda(:userId, :itemId)',
          {
            replacements: { userId, itemId: item.id },
            transaction,
          }
        );
      });
      return { ok: true };
    } catch (error) {
      const reason = this.getProcedurePurchaseFailureReason(error);
      if (reason) return { ok: false, reason };
      throw error;
    }
  }

  getProcedurePurchaseFailureReason(error) {
    const databaseError = error.original || error.parent || error;
    if (databaseError.code !== 'P0001') return null;

    const message = String(databaseError.message || error.message || '').toLocaleLowerCase('es');
    if (/(ya\s+(?:tienes|tiene|posees|posee|adquiriste|adquirido)|already\s+(?:own|owned))/.test(message)) {
      return 'already-owned';
    }
    if (/(insuficient|sin saldo|no tienes (?:suficientes|monedas|gemas)|insufficient|not enough)/.test(message)) {
      return 'insufficient-funds';
    }
    if (/(no existe|no est[aá] disponible|no est[aá] activo|inactivo|not available|does not exist)/.test(message)) {
      return 'unavailable';
    }
    return null;
  }

  async purchaseWithModelTransaction(userId, item) {
    const currency = item.currency;
    return this.models.PlayerStats.sequelize.transaction(async (transaction) => {
      const [stats] = await this.models.PlayerStats.findOrCreate({
        where: { userId },
        defaults: { userId },
        transaction,
      });

      const existing = await this.models.PlayerShopItem.findOne({
        where: { userId, itemId: item.id },
        transaction,
      });
      if (!item.repeatable && existing && existing.quantity > 0) {
        return { ok: false, reason: 'already-owned' };
      }

      const [updated] = await this.models.PlayerStats.update({
        [currency]: literal(`"${currency}" - ${Number(item.price)}`),
        updatedAt: new Date(),
      }, {
        where: { userId, [currency]: { [Op.gte]: item.price } },
        transaction,
      });
      if (updated === 0) return { ok: false, reason: 'insufficient-funds' };

      if (existing) {
        await existing.increment('quantity', { by: 1, transaction });
      } else {
        await this.models.PlayerShopItem.create({
          userId,
          itemId: item.id,
          quantity: 1,
          equipped: false,
        }, { transaction });
      }

      return { ok: true };
    });
  }

  async equipBackground(userId, itemId) {
    return this.models.PlayerShopItem.sequelize.transaction(async (transaction) => {
      if (itemId !== 'fondo-base') {
        const owned = await this.models.PlayerShopItem.findOne({
          where: { userId, itemId, quantity: { [Op.gt]: 0 } },
          transaction,
        });
        if (!owned) return false;
      }

      await this.models.PlayerShopItem.update({ equipped: false }, { where: { userId }, transaction });
      if (itemId === 'fondo-base') return true;

      const [updated] = await this.models.PlayerShopItem.update({ equipped: true }, {
        where: { userId, itemId },
        transaction,
      });
      return updated > 0;
    });
  }

  async consumePower(userId, itemId) {
    const [updated] = await this.models.PlayerShopItem.update({
      quantity: literal('"quantity" - 1'),
    }, {
      where: { userId, itemId, quantity: { [Op.gt]: 0 } },
    });
    return updated > 0;
  }
}

module.exports = SequelizeShopRepository;

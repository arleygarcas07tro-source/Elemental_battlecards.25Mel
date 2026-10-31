'use strict';

class PlayerShopItemModel {
  static define(sequelize, DataTypes) {
    return sequelize.define('PlayerShopItem', {
      userId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, field: 'user_id' },
      itemId: { type: DataTypes.STRING(80), allowNull: false, primaryKey: true, field: 'item_id' },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      equipped: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      acquiredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'acquired_at' },
    }, { tableName: 'player_shop_items', timestamps: false });
  }
}

module.exports = PlayerShopItemModel;

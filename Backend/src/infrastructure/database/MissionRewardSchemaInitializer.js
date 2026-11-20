'use strict';

const { DataTypes } = require('sequelize');

/**
 * Keeps the schema additions used by mission reward claims compatible with
 * databases created before those fields were introduced.
 */
class MissionRewardSchemaInitializer {
  constructor(queryInterface) {
    if (!queryInterface || typeof queryInterface.describeTable !== 'function' || typeof queryInterface.addColumn !== 'function') {
      throw new TypeError('[MissionRewardSchemaInitializer] Se requiere una interfaz de consultas válida.');
    }

    this.queryInterface = queryInterface;
  }

  async initialize() {
    await this.ensureColumn('missions', 'reward_coins', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await this.ensureColumn('player_missions', 'reward_claimed', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await this.ensureColumn('player_missions', 'reward_claimed_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });
  }

  async ensureColumn(tableName, columnName, definition) {
    const columns = await this.queryInterface.describeTable(tableName);
    if (Object.prototype.hasOwnProperty.call(columns, columnName)) return;

    await this.queryInterface.addColumn(tableName, columnName, definition);
  }
}

module.exports = MissionRewardSchemaInitializer;

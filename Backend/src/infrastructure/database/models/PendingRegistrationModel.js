'use strict';

class PendingRegistrationModel {
  static define(sequelize, DataTypes) {
    return sequelize.define('PendingRegistration', {
      username: { type: DataTypes.STRING, allowNull: false, unique: true },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      verificationCodeHash: { type: DataTypes.STRING, allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      lastSentAt: { type: DataTypes.DATE, allowNull: false },
    }, {
      tableName: 'pending_registrations',
      timestamps: true,
    });
  }
}

module.exports = PendingRegistrationModel;

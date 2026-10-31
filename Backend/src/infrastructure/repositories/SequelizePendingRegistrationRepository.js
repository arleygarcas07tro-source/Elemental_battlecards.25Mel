'use strict';

const { Op } = require('sequelize');
const IPendingRegistrationRepository = require('../../domain/contracts/IPendingRegistrationRepository');

class SequelizePendingRegistrationRepository extends IPendingRegistrationRepository {
  constructor(pendingRegistrationModel) {
    super();
    if (!pendingRegistrationModel) {
      throw new TypeError('[SequelizePendingRegistrationRepository] Falta el modelo PendingRegistration.');
    }
    this.pendingRegistrationModel = pendingRegistrationModel;
  }

  findByEmail(email) {
    return this.pendingRegistrationModel.findOne({ where: { email } });
  }

  findByUsername(username) {
    return this.pendingRegistrationModel.findOne({ where: { username } });
  }

  create(data) {
    return this.pendingRegistrationModel.create(data);
  }

  async updateById(id, data) {
    const registration = await this.pendingRegistrationModel.findByPk(id);
    return registration ? registration.update(data) : null;
  }

  deleteById(id) {
    return this.pendingRegistrationModel.destroy({ where: { id } });
  }

  deleteExpired(now) {
    return this.pendingRegistrationModel.destroy({ where: { expiresAt: { [Op.lte]: now } } });
  }
}

module.exports = SequelizePendingRegistrationRepository;

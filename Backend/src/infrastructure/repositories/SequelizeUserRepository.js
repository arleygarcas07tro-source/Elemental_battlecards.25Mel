'use strict';

const { fn, col, where } = require('sequelize');
const IUserRepository = require('../../domain/contracts/IUserRepository');

class SequelizeUserRepository extends IUserRepository {
  constructor(userModel) {
    super();
    if (!userModel) {
      throw new TypeError('[SequelizeUserRepository] Falta el modelo User.');
    }
    this.userModel = userModel;
  }

  async findByUsername(username) {
    return this.userModel.findOne({ where: { username } });
  }

  async findByEmail(email) {
    return this.userModel.findOne({ where: where(fn('LOWER', col('email')), String(email).trim().toLowerCase()) });
  }

  async create({ username, email, password }) {
    return this.userModel.create({ username, email, password });
  }
}

module.exports = SequelizeUserRepository;

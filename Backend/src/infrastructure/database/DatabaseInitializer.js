'use strict';

const ILogger = require('../../core/ILogger');
const ViewPreserver = require('./ViewPreserver');
const MissionRewardSchemaInitializer = require('./MissionRewardSchemaInitializer');

class DatabaseInitializer {
  constructor({ sequelize, logger, dbRequireSSL = false, dbUseSqlite = true }) {
    if (!sequelize) {
      throw new TypeError('[DatabaseInitializer] Falta la instancia de Sequelize.');
    }
    ILogger.assert(logger);

    this.sequelize = sequelize;
    this.logger = logger;
    this.dbRequireSSL = dbRequireSSL;
    this.dbUseSqlite = dbUseSqlite;
  }

  async connect() {
    await this.sequelize.authenticate();
    this.logger.info('DB conectado y SSL:', this.dbRequireSSL);
    return this.sequelize;
  }

  async sync() {
    // En PostgreSQL conserva el esquema existente y crea únicamente tablas faltantes.
    if (!this.dbUseSqlite) {
      await this.sequelize.sync();
      await new MissionRewardSchemaInitializer(this.sequelize.getQueryInterface()).initialize();
      return this.sequelize;
    }

    const viewPreserver = new ViewPreserver(this.sequelize);
    const views = await viewPreserver.capture();
    await viewPreserver.drop(views);
    try {
      await this.sequelize.sync({ alter: true });
      await new MissionRewardSchemaInitializer(this.sequelize.getQueryInterface()).initialize();
    } finally {
      await viewPreserver.restore(views);
    }
    return this.sequelize;
  }
}

module.exports = DatabaseInitializer;

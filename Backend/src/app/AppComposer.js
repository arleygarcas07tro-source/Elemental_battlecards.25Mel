'use strict';

const http = require('http');
const { Server } = require('socket.io');

const AppConfig = require('../core/config');
const Logger = require('../core/logger');
const DatabaseFactory = require('../infrastructure/database/DatabaseFactory');
const DatabaseInitializer = require('../infrastructure/database/DatabaseInitializer');
const MissionCatalogInitializer = require('../infrastructure/database/MissionCatalogInitializer');
const buildModels = require('../infrastructure/database/models');
const SequelizeUserRepository = require('../infrastructure/repositories/SequelizeUserRepository');
const SequelizePendingRegistrationRepository = require('../infrastructure/repositories/SequelizePendingRegistrationRepository');
const BcryptPasswordHasher = require('../infrastructure/services/BcryptPasswordHasher');
const BrevoApiEmailService = require('../infrastructure/services/BrevoApiEmailService');
const JwtTokenService = require('../infrastructure/services/JwtTokenService');
const AuthService = require('../domain/services/AuthService');
const AuthController = require('../presentation/http/controllers/AuthController');
const buildAuthRouter = require('../presentation/http/routes/authRoutes');
const SequelizeProfileRepository = require('../infrastructure/repositories/SequelizeProfileRepository');
const ProfileService = require('../infrastructure/services/ProfileService');
const ProfileController = require('../presentation/http/controllers/ProfileController');
const buildProfileRouter = require('../presentation/http/routes/profileRoutes');
const createAuthMiddleware = require('../presentation/http/middleware/authMiddleware');
const AppFactory = require('../presentation/http/AppFactory');
const InMemoryRoomStore = require('../infrastructure/socketio/InMemoryRoomStore');
const RoomCodeGenerator = require('../infrastructure/socketio/RoomCodeGenerator');
const RoomService = require('../domain/services/RoomService');
const SocketGateway = require('../presentation/socket/SocketGateway');
const SequelizeShopRepository = require('../infrastructure/repositories/SequelizeShopRepository');
const ShopService = require('../domain/services/ShopService');
const ShopController = require('../presentation/http/controllers/ShopController');
const buildShopRouter = require('../presentation/http/routes/shopRoutes');

class AppComposer {
  constructor({ config = new AppConfig(), logger = new Logger() } = {}) {
    this.config = config;
    this.logger = logger;
  }

  async build() {
    const database = await this.buildDatabase();
    const app = new AppFactory({ config: this.config, logger: this.logger }).build({
      authRouter: this.buildAuthRouter(database),
      profileRouter: this.buildProfileRouter(database),
      shopRouter: this.buildShopRouter(database),
    });

    const server = http.createServer(app);
    const io = new Server(server, { cors: { origin: this.config.corsOrigin } });

    const roomService = this.buildRoomService();
    const socketGateway = new SocketGateway({
      io,
      roomService,
      logger: this.logger,
    });
    socketGateway.registerHandlers();

    return { server, io, app, roomService, socketGateway, config: this.config, logger: this.logger };
  }

  async buildDatabase() {
    const sequelize = new DatabaseFactory(this.config).build();
    const models = buildModels(sequelize);
    const databaseInitializer = new DatabaseInitializer({
      sequelize,
      logger: this.logger,
      dbRequireSSL: this.config.dbRequireSSL,
      dbUseSqlite: this.config.useSqlite,
    });

    try {
      await databaseInitializer.connect();
      await databaseInitializer.sync();
      await new MissionCatalogInitializer(models.Mission).initialize();
      this.logger.info('✓ Modelos sincronizados con la BD');
      return { sequelize, models, available: true };
    } catch (error) {
      this.logger.error('No se pudo conectar a la BD:', error.message || error);
      return { sequelize, models, available: false };
    }
  }

  buildAuthRouter({ models, available }) {
    const authEnabled = this.config.dbEnabled && available;
    if (!authEnabled) {
      this.logger.info('Rutas de autenticación deshabilitadas: DB_ENABLED está apagado o la base de datos no está disponible.');
      return null;
    }

    try {
      const userRepository = new SequelizeUserRepository(models.User);
      const pendingRegistrationRepository = new SequelizePendingRegistrationRepository(models.PendingRegistration);
      const authService = new AuthService({
        userRepository,
        pendingRegistrationRepository,
        emailService: new BrevoApiEmailService(this.config),
        passwordHasher: new BcryptPasswordHasher(10),
        tokenService: new JwtTokenService(this.config.jwtSecret, { expiresIn: this.config.jwtExpiresIn }),
        logger: this.logger,
      });
      const authController = new AuthController(authService);
      const router = buildAuthRouter(authController);

      this.logger.info('Rutas de autenticación habilitadas');
      return router;
    } catch (error) {
      this.logger.warn('No se pudieron cargar las rutas de autenticación:', error.message);
      return null;
    }
  }

  buildProfileRouter({ models, available }) {
    const profileEnabled = this.config.dbEnabled && available;
    if (!profileEnabled) {
      this.logger.info('Rutas de perfil deshabilitadas (modo LAN)');
      return null;
    }

    try {
      const tokenService = new JwtTokenService(this.config.jwtSecret, { expiresIn: this.config.jwtExpiresIn });
      const profileService = new ProfileService({
        profileRepository: new SequelizeProfileRepository(models),
        logger: this.logger,
      });
      const profileController = new ProfileController(profileService);
      const router = buildProfileRouter(profileController, createAuthMiddleware(tokenService));

      this.logger.info('Rutas de perfil habilitadas');
      return router;
    } catch (error) {
      this.logger.warn('No se pudieron cargar las rutas de perfil:', error.message);
      return null;
    }
  }

  buildShopRouter({ models, available }) {
    const shopEnabled = this.config.dbEnabled && available;
    if (!shopEnabled) {
      this.logger.info('Rutas de tienda deshabilitadas (modo LAN)');
      return null;
    }

    try {
      const tokenService = new JwtTokenService(this.config.jwtSecret, { expiresIn: this.config.jwtExpiresIn });
      const shopService = new ShopService({ shopRepository: new SequelizeShopRepository(models) });
      const shopController = new ShopController(shopService);
      const router = buildShopRouter(shopController, createAuthMiddleware(tokenService));
      this.logger.info('Rutas de tienda habilitadas');
      return router;
    } catch (error) {
      this.logger.warn('No se pudieron cargar las rutas de tienda:', error.message);
      return null;
    }
  }

  buildRoomService() {
    const roomStore = new InMemoryRoomStore();
    return new RoomService({
      roomStore,
      codeGenerator: new RoomCodeGenerator(),
      logger: this.logger,
    });
  }
}

module.exports = AppComposer;

'use strict';

const express = require('express');
const cors = require('cors');
const buildErrorHandler = require('./middleware/errorHandler');

class AppFactory {
  constructor({ config, logger }) {
    this.config = config;
    this.logger = logger;
  }

  build({ authRouter = null, profileRouter = null, shopRouter = null } = {}) {
    const app = express();

    app.use(cors({ origin: this.config.corsOrigin }));
    app.use(express.json());

    if (authRouter) {
      app.use('/api/auth', authRouter);
    } else {
      app.use('/api/auth', (_req, res) => res.status(503).json({
        message: 'El servicio de inicio de sesión no está disponible. Verifica la conexión de la base de datos y reinicia el servidor.'
      }));
    }

    if (profileRouter) {
      app.use('/api/profile', profileRouter);
    }

    if (shopRouter) {
      app.use('/api/shop', shopRouter);
    }

    app.get('/ping', (req, res) => {
      res.json({ ok: true, time: Date.now(), host: req.hostname });
    });

    app.use('/api', (_req, res) => res.status(404).json({
      message: 'La ruta solicitada de la API no existe.'
    }));

    app.use(buildErrorHandler(this.logger));

    return app;
  }
}

module.exports = AppFactory;

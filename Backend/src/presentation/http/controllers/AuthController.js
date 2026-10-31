'use strict';

const assertContract = require('../../../core/assertContract');

class AuthController {
  constructor(authService) {
    assertContract(authService, ['register', 'verifyRegistration', 'resendVerificationCode', 'login'], 'AuthService');
    this.authService = authService;
  }

  async register(req, res, next) {
    try {
      const result = await this.authService.register(req.body || {});
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  async verifyRegistration(req, res, next) {
    try {
      const result = await this.authService.verifyRegistration(req.body || {});
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async resendVerificationCode(req, res, next) {
    try {
      const result = await this.authService.resendVerificationCode(req.body || {});
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await this.authService.login(req.body || {});
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;

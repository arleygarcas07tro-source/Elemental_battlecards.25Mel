'use strict';

const { randomInt } = require('crypto');
const IUserRepository = require('../contracts/IUserRepository');
const IPendingRegistrationRepository = require('../contracts/IPendingRegistrationRepository');
const IEmailService = require('../contracts/IEmailService');
const IPasswordHasher = require('../contracts/IPasswordHasher');
const ITokenService = require('../contracts/ITokenService');
const ILogger = require('../../core/ILogger');
const { AppError, ValidationError, UnauthorizedError, ConflictError } = require('../../core/errors');

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

class AuthService {
  constructor({ userRepository, pendingRegistrationRepository, emailService, passwordHasher, tokenService, logger }) {
    IUserRepository.assert(userRepository);
    IPendingRegistrationRepository.assert(pendingRegistrationRepository);
    IEmailService.assert(emailService);
    IPasswordHasher.assert(passwordHasher);
    ITokenService.assert(tokenService);
    ILogger.assert(logger);

    this.userRepository = userRepository;
    this.pendingRegistrationRepository = pendingRegistrationRepository;
    this.emailService = emailService;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
    this.logger = logger;
  }

  async register({ username, email, password } = {}) {
    const normalizedUsername = String(username || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedUsername || !normalizedEmail || !password) {
      throw new ValidationError('Por favor, proporciona todos los campos.');
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      throw new ValidationError('Introduce un correo electrónico válido.');
    }

    const [existingEmail, existingUsername] = await Promise.all([
      this.userRepository.findByEmail(normalizedEmail),
      this.userRepository.findByUsername(normalizedUsername),
    ]);
    if (existingEmail) throw new ConflictError('El correo electrónico ya está en uso.');
    if (existingUsername) throw new ConflictError('El nombre de usuario ya está en uso.');

    const now = new Date();
    await this.pendingRegistrationRepository.deleteExpired(now);
    const [pendingByEmail, pendingByUsername] = await Promise.all([
      this.pendingRegistrationRepository.findByEmail(normalizedEmail),
      this.pendingRegistrationRepository.findByUsername(normalizedUsername),
    ]);
    if (pendingByEmail && pendingByUsername && pendingByEmail.id !== pendingByUsername.id) {
      throw new ConflictError('Ese usuario o correo ya tiene otro registro pendiente.');
    }

    const code = this.generateVerificationCode();
    const registrationData = {
      username: normalizedUsername,
      email: normalizedEmail,
      password: await this.passwordHasher.hash(password),
      verificationCodeHash: await this.passwordHasher.hash(code),
      expiresAt: new Date(now.getTime() + CODE_TTL_MS),
      attempts: 0,
      lastSentAt: now,
    };
    const pending = pendingByEmail || pendingByUsername;
    if (pending) await this.pendingRegistrationRepository.updateById(pending.id, registrationData);
    else await this.pendingRegistrationRepository.create(registrationData);

    await this.sendVerificationCode({ email: normalizedEmail, username: normalizedUsername, code });
    return {
      requiresVerification: true,
      email: normalizedEmail,
      message: 'Te enviamos un código para verificar tu correo.',
    };
  }

  async verifyRegistration({ email, code } = {}) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedCode = String(code || '').trim();
    if (!normalizedEmail || !/^\d{6}$/.test(normalizedCode)) {
      throw new ValidationError('Introduce el correo y el código de 6 dígitos.');
    }

    const pending = await this.pendingRegistrationRepository.findByEmail(normalizedEmail);
    if (!pending) throw new ValidationError('No hay un registro pendiente para ese correo.');
    if (new Date(pending.expiresAt).getTime() <= Date.now()) {
      throw new ValidationError('El código venció. Solicita uno nuevo para continuar.');
    }
    if (pending.attempts >= MAX_CODE_ATTEMPTS) {
      throw new ValidationError('Se agotaron los intentos. Solicita un código nuevo.');
    }

    const isCodeValid = await this.passwordHasher.compare(normalizedCode, pending.verificationCodeHash);
    if (!isCodeValid) {
      const attempts = pending.attempts + 1;
      await this.pendingRegistrationRepository.updateById(pending.id, { attempts });
      const remaining = MAX_CODE_ATTEMPTS - attempts;
      throw new ValidationError(remaining > 0
        ? `El código no es correcto. Intentos restantes: ${remaining}.`
        : 'El código no es correcto. Solicita uno nuevo para continuar.');
    }

    const [existingEmail, existingUsername] = await Promise.all([
      this.userRepository.findByEmail(pending.email),
      this.userRepository.findByUsername(pending.username),
    ]);
    if (existingEmail || existingUsername) {
      throw new ConflictError('El usuario o correo ya está registrado. Inicia sesión o usa otros datos.');
    }

    let savedUser;
    try {
      savedUser = await this.userRepository.create({
        username: pending.username,
        email: pending.email,
        password: pending.password,
      });
    } catch (error) {
      if (error && error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictError('El usuario o correo ya está registrado.');
      }
      throw error;
    }

    await this.pendingRegistrationRepository.deleteById(pending.id);
    this.logger.info('Cuenta verificada y registrada:', savedUser.id);
    return {
      user: { id: savedUser.id, username: savedUser.username, email: savedUser.email },
      message: 'Correo verificado y cuenta creada. Ya puedes iniciar sesión.',
    };
  }

  async resendVerificationCode({ email } = {}) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) throw new ValidationError('Introduce el correo del registro.');

    const pending = await this.pendingRegistrationRepository.findByEmail(normalizedEmail);
    if (!pending) throw new ValidationError('No hay un registro pendiente para ese correo.');

    const now = new Date();
    const lastSentAt = new Date(pending.lastSentAt).getTime();
    const waitMs = RESEND_COOLDOWN_MS - (now.getTime() - lastSentAt);
    if (waitMs > 0) {
      throw new AppError(`Espera ${Math.ceil(waitMs / 1000)} segundos antes de pedir otro código.`, 429);
    }

    const code = this.generateVerificationCode();
    const verificationCodeHash = await this.passwordHasher.hash(code);
    await this.sendVerificationCode({ email: pending.email, username: pending.username, code });
    await this.pendingRegistrationRepository.updateById(pending.id, {
      verificationCodeHash,
      expiresAt: new Date(now.getTime() + CODE_TTL_MS),
      attempts: 0,
      lastSentAt: now,
    });
    return { message: 'Te enviamos un nuevo código de verificación.' };
  }

  generateVerificationCode() {
    return String(randomInt(0, 1000000)).padStart(6, '0');
  }

  async sendVerificationCode(message) {
    try {
      await this.emailService.sendVerificationCode(message);
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error('No se pudo enviar el correo de verificación:', error.message || error);
      throw new AppError('No se pudo enviar el código. Revisa la configuración de correo e inténtalo de nuevo.', 503);
    }
  }

  async login({ username, password } = {}) {
    if (!username || !password) {
      throw new ValidationError('Por favor, proporciona todos los campos.');
    }

    const user = await this.userRepository.findByUsername(String(username).trim());
    if (!user) throw new UnauthorizedError('Credenciales inválidas.');

    const isMatch = await this.passwordHasher.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedError('Credenciales inválidas.');

    const payload = { user: { id: user.id, username: user.username } };
    const token = await this.tokenService.sign(payload);
    return { token, user: { id: user.id, username: user.username, email: user.email } };
  }
}

module.exports = AuthService;

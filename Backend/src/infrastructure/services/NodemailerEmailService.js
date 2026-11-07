'use strict';

const nodemailer = require('nodemailer');
const IEmailService = require('../../domain/contracts/IEmailService');
const { AppError } = require('../../core/errors');
const { buildVerificationEmail, escapeHtml } = require('./VerificationEmailTemplate');

class NodemailerEmailService extends IEmailService {
  constructor(config) {
    super();
    if (!config) throw new TypeError('[NodemailerEmailService] Falta la configuración.');
    this.config = config;
  }

  async sendVerificationCode({ email, username, code }) {
    if (!this.config.emailUser || !this.config.emailPass) {
      throw new AppError('El envío de correos no está configurado en el servidor.', 503);
    }

    const port = this.config.emailPort;
    const transporter = nodemailer.createTransport({
      host: this.config.emailHost,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: {
        user: this.config.emailUser,
        pass: this.config.emailPass,
      },
    });

    const safeUsername = escapeHtml(username);
    const safeCode = escapeHtml(code);

    await transporter.sendMail({
      from: { name: 'Elemental Battlecards', address: this.config.emailFrom },
      to: email,
      subject: 'Verifica tu correo - Elemental Battlecards',
      text: `Hola ${username}, tu código de verificación es ${code}. Vence en 10 minutos.`,
      html: buildVerificationEmail({ username: safeUsername, code: safeCode }),
    });
  }
}

module.exports = NodemailerEmailService;

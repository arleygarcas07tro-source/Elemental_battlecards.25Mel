'use strict';

const https = require('https');
const IEmailService = require('../../domain/contracts/IEmailService');
const { AppError } = require('../../core/errors');
const { buildVerificationEmail, escapeHtml } = require('./VerificationEmailTemplate');

class BrevoApiEmailService extends IEmailService {
  constructor(config) {
    super();
    if (!config) throw new TypeError('[BrevoApiEmailService] Falta la configuración.');
    this.config = config;
  }

  async sendVerificationCode({ email, username, code }) {
    if (!this.config.brevoApiKey || !this.config.emailFrom) {
      throw new AppError('El envío de correos no está configurado en el servidor.', 503);
    }

    const safeUsername = escapeHtml(username);
    const safeCode = escapeHtml(code);
    const payload = JSON.stringify({
      sender: { name: 'Elemental Battlecards', email: this.config.emailFrom },
      to: [{ email }],
      subject: 'Verifica tu correo - Elemental Battlecards',
      textContent: `Hola ${username}, tu código de verificación es ${code}. Vence en 10 minutos.`,
      htmlContent: buildVerificationEmail({ username: safeUsername, code: safeCode }),
    });

    await this.sendTransactionalEmail(payload);
  }

  sendTransactionalEmail(payload) {
    return new Promise((resolve, reject) => {
      const request = https.request({
        hostname: 'api.brevo.com',
        port: 443,
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'api-key': this.config.brevoApiKey,
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(payload),
        },
      }, (response) => {
        let responseBody = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => { responseBody += chunk; });
        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve();
            return;
          }
          reject(new Error(`Brevo API respondió HTTP ${response.statusCode}: ${responseBody || 'sin detalle'}`));
        });
      });

      request.setTimeout(15000, () => request.destroy(new Error('Tiempo de espera al conectar con la API de Brevo.')));
      request.on('error', reject);
      request.end(payload);
    });
  }
}

module.exports = BrevoApiEmailService;
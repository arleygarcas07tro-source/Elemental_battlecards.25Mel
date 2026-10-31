'use strict';

const nodemailer = require('nodemailer');
const IEmailService = require('../../domain/contracts/IEmailService');
const { AppError } = require('../../core/errors');

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
      auth: {
        user: this.config.emailUser,
        pass: this.config.emailPass,
      },
    });

    const safeUsername = escapeHtml(username);
    const safeCode = escapeHtml(code);

    await transporter.sendMail({
      from: { name: 'Elemental Battlecards', address: this.config.emailUser },
      to: email,
      subject: 'Verifica tu correo - Elemental Battlecards',
      text: `Hola ${username}, tu código de verificación es ${code}. Vence en 10 minutos.`,
      html: buildVerificationEmail({ username: safeUsername, code: safeCode }),
    });
  }
}

function buildVerificationEmail({ username, code }) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>Verifica tu correo</title>
  </head>
  <body style="margin:0;padding:0;background-color:#080d18;color:#edf2f8;font-family:Georgia,'Times New Roman',serif">
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">
      Tu código de verificación vence en 10 minutos.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#080d18">
      <tr>
        <td align="center" style="padding:28px 14px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px">
            <tr>
              <td align="center" style="padding:0 0 18px;color:#e8c66f;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:bold;letter-spacing:3px">
                ✦ ELEMENTAL BATTLECARDS ✦
              </td>
            </tr>
            <tr>
              <td style="overflow:hidden;border:1px solid #34445b;border-radius:18px;background-color:#101827">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#111d2d">
                  <tr>
                    <td align="center" style="padding:30px 18px 24px;color:#e8c66f;font-family:Arial,sans-serif;font-size:25px;line-height:1.6">
                      <span style="color:#55c9e8">✧ 💧</span>&nbsp;&nbsp;
                      <span style="color:#f28a4b">🔥</span>&nbsp;&nbsp;
                      <span style="color:#a8cc75">🌿</span>&nbsp;&nbsp;
                      <span style="color:#b99bea">✦</span>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:0 20px 24px;color:#c5cfdd;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px">
                      EL REINO ELEMENTAL TE ESPERA
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td height="3" style="height:3px;background-color:#39c6d5;font-size:0;line-height:0">&nbsp;</td>
                    <td height="3" style="height:3px;background-color:#e7793e;font-size:0;line-height:0">&nbsp;</td>
                    <td height="3" style="height:3px;background-color:#c7a35a;font-size:0;line-height:0">&nbsp;</td>
                    <td height="3" style="height:3px;background-color:#75b874;font-size:0;line-height:0">&nbsp;</td>
                    <td height="3" style="height:3px;background-color:#9c7be0;font-size:0;line-height:0">&nbsp;</td>
                  </tr>
                  <tr>
                    <td colspan="5" style="padding:30px 28px 32px">
                      <p style="margin:0 0 10px;color:#79dce4;font-family:Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">Verificación de cuenta</p>
                      <h1 style="margin:0 0 18px;color:#f4d58b;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:normal;line-height:1.25">Verifica tu correo</h1>
                      <p style="margin:0 0 8px;color:#edf2f8;font-size:17px;line-height:1.55">Hola ${username},</p>
                      <p style="margin:0 0 22px;color:#c5cfdd;font-family:Arial,sans-serif;font-size:15px;line-height:1.6">usa este código para completar tu registro:</p>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px">
                        <tr>
                          <td align="center" style="padding:20px 12px;border:1px solid #596174;border-radius:12px;background-color:#0a111e;color:#f3d27c;font-family:Arial,sans-serif;font-size:34px;font-weight:bold;letter-spacing:10px;line-height:1.2">${code}</td>
                        </tr>
                      </table>
                      <p style="margin:0;color:#aab7c8;font-family:Arial,sans-serif;font-size:13px;line-height:1.6">El código vence en <strong style="color:#f0cf78">10 minutos</strong>. Si no solicitaste esta cuenta, ignora este mensaje.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:18px 12px 0;color:#68788d;font-family:Arial,sans-serif;font-size:11px;line-height:1.5">
                Elemental Battlecards · El reino elemental te espera
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

module.exports = NodemailerEmailService;

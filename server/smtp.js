const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.yandex.ru';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = String(process.env.SMTP_SECURE ?? (SMTP_PORT === 465)).toLowerCase() === 'true';

const SMTP_USER = process.env.SMTP_USER || process.env.YANDEX_USER || 'neuroprocessing@yandex.ru';
const SMTP_PASS = process.env.SMTP_PASS || process.env.YANDEX_PASS;

const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'Neuroprocessing';
const MAIL_REPLY_TO = process.env.MAIL_REPLY_TO || SMTP_USER;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  connectionTimeout: 20000,
  greetingTimeout: 10000,
  socketTimeout: 30000,
  logger: true,
  debug: true,
  tls: { servername: SMTP_HOST, rejectUnauthorized: true }
});

function escapeHtml(s = '') {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function buildVerifyEmail({ name, link }) {
  const subject = 'Подтверждение почты';
  const text =
    `Здравствуйте${name ? ', ' + name : ''}!\n` +
    `Чтобы завершить регистрацию, откройте ссылку:\n${link}\n\n` +
    `Если это были не вы — просто проигнорируйте письмо.`;
  const html = `
  <div style="
    font-family: system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
    line-height: 1.65;
    font-size: 14px;
    color: #111;
  ">
    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800;">
      Подтверждение почты
    </h2>
    <p style="margin: 0 0 12px;">
      Здравствуйте${name ? ', ' + escapeHtml(name) : ''}!
    </p>
    <p style="margin: 0 0 16px;">
      Чтобы завершить регистрацию, нажмите на кнопку ниже:
    </p>
    <p style="margin: 0;">
      <a href="${link}" target="_blank" rel="nofollow noopener noreferrer" style="
        display: inline-block;
        padding: 10px 15px;
        border-radius: 12px;
        background: #111;
        color: #fff;
        text-decoration: none;
        font-size: 16px;
        font-weight: 500;
      ">
        Подтвердить адрес
      </a>
    </p>
  </div>`;
  return { subject, text, html };
}

async function verifyTransporter() {
  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}

async function sendMail({ to, subject, text, html }) {
  return await transporter.sendMail({
    from: `${MAIL_FROM_NAME} <${SMTP_USER}>`,
    replyTo: MAIL_REPLY_TO,
    to,
    subject,
    text,
    html,
    headers: { 'List-Unsubscribe': `<mailto:${MAIL_REPLY_TO}>` },
  });
}

async function sendVerificationEmail({ to, name, verifyLink }) {
  const { subject, text, html } = buildVerifyEmail({ name, link: verifyLink });
  return sendMail({ to, subject, text, html });
}

function buildResetEmail({ name, link }) {
  const subject = 'Восстановление пароля';
  const text =
    `Здравствуйте${name ? ', ' + name : ''}!\n` +
    `Чтобы задать новый пароль, откройте ссылку:\n${link}\n\n` +
    `Если это были не вы — просто проигнорируйте письмо.`;
  const html = `
  <div style="
    font-family: system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
    line-height: 1.65;
    font-size: 14px;
    color: #111;
  ">
    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800;">
      Восстановление пароля
    </h2>
    <p style="margin: 0 0 12px;">
      Здравствуйте${name ? ', ' + escapeHtml(name) : ''}!
    </p>
    <p style="margin: 0 0 16px;">
      Чтобы задать новый пароль, нажмите на кнопку ниже:
    </p>
    <p style="margin: 0;">
      <a href="${link}" target="_blank" rel="nofollow noopener noreferrer" style="
        display: inline-block;
        padding: 10px 15px;
        border-radius: 12px;
        background: #111;
        color: #fff;
        text-decoration: none;
        font-size: 16px;
        font-weight: 500;
      ">
        Сбросить пароль
      </a>
    </p>
  </div>`;
  return { subject, text, html };
}

async function sendPasswordResetEmail({ to, name, resetLink }) {
  const { subject, text, html } = buildResetEmail({ name, link: resetLink });
  return sendMail({ to, subject, text, html });
}

module.exports = {
  transporter,
  verifyTransporter,
  sendMail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};

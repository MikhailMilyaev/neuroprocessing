const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, RefreshToken } = require('../models/models');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../smtp');

const VERIFY_RESEND_COOLDOWN = Number(process.env.VERIFY_RESEND_COOLDOWN || 60);
const VERIFY_DAILY_LIMIT = Number(process.env.VERIFY_DAILY_LIMIT || 2);
const VERIFY_DAILY_WINDOW_HOURS = Number(process.env.VERIFY_DAILY_WINDOW_HOURS || 24);
const VERIFY_TOKEN_TTL_HOURS = Number(process.env.VERIFY_TOKEN_TTL_HOURS || 24);
const VERIFY_LANDING_TTL_MIN = Number(process.env.VERIFY_LANDING_TTL_MIN || 5);

const RESET_RESEND_COOLDOWN = Number(process.env.RESET_RESEND_COOLDOWN || 60);
const RESET_DAILY_LIMIT = Number(process.env.RESET_DAILY_LIMIT || 2);
const RESET_DAILY_WINDOW_HOURS = Number(process.env.RESET_DAILY_WINDOW_HOURS || 24);
const RESET_TOKEN_TTL_HOURS = Number(process.env.RESET_TOKEN_TTL_HOURS || 1);
const RESET_GATES_TTL_MIN = Number(process.env.RESET_GATES_TTL_MIN || 15);

const ACCESS_TTL_MIN = Number(process.env.ACCESS_TTL_MIN || 15);
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TTL_DAYS || 30);

const signAccess = (u) =>
  jwt.sign({ id: u.id, name: u.name, email: u.email, role: u.role }, process.env.SECRET_KEY, { expiresIn: `${ACCESS_TTL_MIN}m` });

const genRefresh = () => crypto.randomBytes(48).toString('hex');

const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

function computeVerifyState(user, now = new Date()) {
  const last = user.verificationLastSentAt ? user.verificationLastSentAt.getTime() : 0;
  const diffSec = last ? Math.floor((now.getTime() - last) / 1000) : Infinity;
  const cooldownLeft = Math.max(0, VERIFY_RESEND_COOLDOWN - diffSec);
  let support = false;
  let supportLeftSec = 0;
  if (user.verificationResendResetAt && now <= user.verificationResendResetAt) {
    if (user.verificationResendCount >= VERIFY_DAILY_LIMIT) {
      support = true;
      supportLeftSec = Math.max(1, Math.ceil((user.verificationResendResetAt.getTime() - now.getTime()) / 1000));
    }
  }
  const canResend = !support && cooldownLeft === 0;
  return { cooldownLeft, canResend, support, supportLeftSec };
}

function computeResetState(user, now = new Date()) {
  const last = user.resetLastSentAt ? user.resetLastSentAt.getTime() : 0;
  const diffSec = last ? Math.floor((now.getTime() - last) / 1000) : Infinity;
  const cooldownLeft = Math.max(0, RESET_RESEND_COOLDOWN - diffSec);
  let limit = false;
  let retryAfter = 0;
  if (user.resetResendResetAt && now <= user.resetResendResetAt) {
    if (user.resetResendCount >= RESET_DAILY_LIMIT) {
      limit = true;
      retryAfter = Math.max(1, Math.ceil((user.resetResendResetAt.getTime() - now.getTime()) / 1000));
    }
  }
  const canSend = !limit && cooldownLeft === 0;
  return { cooldownLeft, canSend, limit, retryAfter };
}

class userController {
  async registration(req, res, next) {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return next(ApiError.badRequest('Заполните все поля.'));
    }
    const exist = await User.findOne({ where: { email } });
    if (exist) {
      if (exist.isVerified) {
        return next(ApiError.badRequest('Пользователь с таким email уже существует'));
      }
      const now = new Date();
      const { support, supportLeftSec } = computeVerifyState(exist, now);
      return res.status(409).json({
        code: 'UNVERIFIED_EXISTS',
        message: 'Email уже зарегистрирован, но не подтверждён.',
        support: support || exist.verificationResendCount >= VERIFY_DAILY_LIMIT,
        retryAfter: supportLeftSec || Math.max(1, Math.ceil(((exist.verificationResendResetAt || now) - now) / 1000)),
      });
    }
    const hashPassword = await bcrypt.hash(password, 12);
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const now = new Date();
    const expires = new Date(now.getTime() + VERIFY_TOKEN_TTL_HOURS * 3600 * 1000);
    const user = await User.create({
      name, email, role,
      password: hashPassword,
      isVerified: false,
      verificationToken: tokenHash,
      verificationTokenExpires: expires,
      verificationLastSentAt: now,
      verificationResendCount: 1,
      verificationResendResetAt: new Date(now.getTime() + VERIFY_DAILY_WINDOW_HOURS * 3600 * 1000),
    });
    const verifyLink = `${process.env.API_URL}/api/user/verify?token=${rawToken}`;
    try {
      await sendVerificationEmail({ to: user.email, name: user.name, verifyLink });
    } catch (e) {
      await user.destroy().catch(() => {});
      return next(ApiError.internal('Не удалось отправить письмо подтверждения. Попробуйте позже.'));
    }
    return res.status(201).json({ message: 'Проверьте почту — мы отправили ссылку для подтверждения.' });
  }

  async login(req, res, next) {
    const { email, password } = req.body;
    if (!email || !password) return next(ApiError.badRequest('Заполните все поля.'));
    const user = await User.findOne({ where: { email } });
    if (!user) return next(ApiError.internal('Неверный email или пароль.'));
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return next(ApiError.internal('Неверный email или пароль.'));
    if (!user.isVerified) {
      return next(ApiError.forbidden('Email не подтверждён. Проверьте почту или запросите повторную отправку.'));
    }
    const access = signAccess(user);
    const rawRefresh = genRefresh();
    await RefreshToken.create({
      userId: user.id,
      tokenHash: hashToken(rawRefresh),
      expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 3600 * 1000),
      userAgent: req.headers['user-agent'] || null,
      ip: req.ip || null
    });
    return res.json({ access, refresh: rawRefresh });
  }

  async refresh(req, res) {
    const { refresh } = req.body || {};
    if (!refresh) return res.status(400).json({ message: 'Нет refresh токена' });
    const row = await RefreshToken.findOne({ where: { tokenHash: hashToken(refresh) } });
    if (!row || row.revokedAt || row.expiresAt <= new Date()) return res.status(401).json({ message: 'Недействительный токен' });
    const user = await User.findByPk(row.userId);
    if (!user || !user.isVerified) return res.status(401).json({ message: 'Недействительный токен' });
    const access = signAccess(user);
    const newRaw = genRefresh();
    row.tokenHash = hashToken(newRaw);
    row.expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 3600 * 1000);
    row.userAgent = req.headers['user-agent'] || null;
    row.ip = req.ip || null;
    await row.save();
    return res.json({ access, refresh: newRaw });
  }

  async logout(req, res) {
    const { refresh } = req.body || {};
    if (!refresh) return res.json({ ok: true });
    const row = await RefreshToken.findOne({ where: { tokenHash: hashToken(refresh) } });
    if (row) {
      row.revokedAt = new Date();
      await row.save();
    }
    return res.json({ ok: true });
  }

  async logoutAll(req, res) {
    const uid = req.user?.id;
    if (!uid) return res.status(401).json({ message: 'Не авторизован.' });
    await RefreshToken.update({ revokedAt: new Date() }, { where: { userId: uid, revokedAt: null } });
    return res.json({ ok: true });
  }

  async check(req, res) {
    const token = signAccess({ id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role });
    return res.json({ access: token });
  }

  async verifyEmail(req, res, next) {
    const { token } = req.query;
    if (!token) return next(ApiError.badRequest('Токен не указан.'));
    const tokenHash = hashToken(token);
    const user = await User.findOne({
      where: {
        verificationToken: tokenHash,
        verificationTokenExpires: { [Op.gt]: new Date() },
      },
    });
    if (!user) return next(ApiError.badRequest('Ссылка недействительна или устарела.'));
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();
    const landingJwt = jwt.sign(
      { uid: user.id, purpose: 'activation-landing' },
      process.env.SECRET_KEY,
      { expiresIn: `${VERIFY_LANDING_TTL_MIN}m` }
    );
    const redirectUrl = `${process.env.CLIENT_URL}/account-activated?lt=${landingJwt}`;
    return res.redirect(302, redirectUrl);
  }

  async resendVerification(req, res, next) {
    const { email } = req.body;
    if (!email) return next(ApiError.badRequest('Укажите email.'));
    const user = await User.findOne({ where: { email } });
    if (!user) return res.json({ message: 'Если аккаунт существует, письмо отправлено.' });
    if (user.isVerified) return res.json({ message: 'Email уже подтверждён.' });
    const now = new Date();
    if (!user.verificationResendResetAt || now > user.verificationResendResetAt) {
      user.verificationResendCount = 1;
      user.verificationResendResetAt = new Date(now.getTime() + VERIFY_DAILY_WINDOW_HOURS * 3600 * 1000);
    }
    const { cooldownLeft, support, supportLeftSec } = computeVerifyState(user, now);
    if (support) {
      res.set('Retry-After', String(supportLeftSec));
      return res.status(429).json({
        message: 'Достигнут лимит отправок. Свяжитесь с поддержкой.',
        retryAfter: supportLeftSec,
        support: true,
      });
    }
    if (cooldownLeft > 0) {
      res.set('Retry-After', String(cooldownLeft));
      return res.status(429).json({
        message: `Слишком часто. Подождите ${cooldownLeft} сек.`,
        retryAfter: cooldownLeft,
      });
    }
    if (user.verificationResendCount >= VERIFY_DAILY_LIMIT) {
      const leftSec = Math.max(1, Math.ceil((user.verificationResendResetAt - now) / 1000));
      res.set('Retry-After', String(leftSec));
      return res.status(429).json({
        message: 'Достигнут лимит отправок. Свяжитесь с поддержкой.',
        retryAfter: leftSec,
        support: true,
      });
    }
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    user.verificationToken = tokenHash;
    user.verificationTokenExpires = new Date(now.getTime() + VERIFY_TOKEN_TTL_HOURS * 3600 * 1000);
    user.verificationLastSentAt = now;
    user.verificationResendCount += 1;
    await user.save();
    const verifyLink = `${process.env.API_URL}/api/user/verify?token=${rawToken}`;
    await sendVerificationEmail({ to: user.email, name: user.name, verifyLink });
    return res.json({ message: 'Если аккаунт существует, письмо отправлено.' });
  }

  async verifyStatus(req, res) {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ ok: false });
    }
    const user = await User.findOne({ where: { email } });
    if (!user || user.isVerified) {
      return res.status(404).json({ ok: false });
    }
    const now = new Date();
    if (!user.verificationResendResetAt || now > user.verificationResendResetAt) {
      user.verificationResendCount = Math.min(user.verificationResendCount, 1);
      user.verificationResendResetAt = new Date(now.getTime() + VERIFY_DAILY_WINDOW_HOURS * 3600 * 1000);
      await user.save();
    }
    const { cooldownLeft, canResend, support, supportLeftSec } = computeVerifyState(user, now);
    return res.json({ ok: true, canResend, cooldownLeft, support, supportLeftSec });
  }

  async activationLanding(req, res) {
    const { lt } = req.query;
    if (!lt) return res.status(400).json({ ok: false });
    try {
      const payload = jwt.verify(lt, process.env.SECRET_KEY);
      if (payload?.purpose !== 'activation-landing' || !payload?.uid) {
        return res.status(400).json({ ok: false });
      }
      const user = await User.findByPk(payload.uid);
      if (!user || !user.isVerified) return res.status(404).json({ ok: false });
      return res.json({ ok: true });
    } catch {
      return res.status(400).json({ ok: false });
    }
  }

  async requestPasswordReset(req, res) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Укажите email.' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Пользователь с таким email не найден.' });
    const now = new Date();
    if (!user.resetResendResetAt || now > user.resetResendResetAt) {
      user.resetResendCount = 0;
      user.resetResendResetAt = new Date(now.getTime() + RESET_DAILY_WINDOW_HOURS * 3600 * 1000);
    }
    const { cooldownLeft, canSend, limit, retryAfter } = computeResetState(user, now);
    if (limit) {
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ message: 'Достигнут лимит на сегодня. Попробуйте позже.', retryAfter, support: true });
    }
    if (!canSend) {
      res.set('Retry-After', String(cooldownLeft));
      return res.status(429).json({ message: `Слишком часто. Подождите ${cooldownLeft} сек.`, retryAfter: cooldownLeft });
    }
    const raw = crypto.randomBytes(32).toString('hex');
    const hash = hashToken(raw);
    user.passwordResetToken = hash;
    user.passwordResetExpires = new Date(now.getTime() + RESET_TOKEN_TTL_HOURS * 3600 * 1000);
    user.resetLastSentAt = now;
    user.resetResendCount += 1;
    await user.save();
    const resetLink = `${process.env.API_URL}/api/user/password-reset?token=${raw}`;
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetLink });
    const rst = jwt.sign(
      { email: user.email, purpose: 'reset-sent' },
      process.env.SECRET_KEY,
      { expiresIn: `${RESET_GATES_TTL_MIN}m` }
    );
    return res.json({ message: 'Ссылка отправлена на почту.', rst });
  }

  async passwordResetFromEmail(req, res) {
    const { token } = req.query;
    if (!token) return res.status(400).send('Bad request');
    const tokenHash = hashToken(token);
    const user = await User.findOne({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpires: { [Op.gt]: new Date() },
      },
    });
    if (!user) {
      const url = `${process.env.CLIENT_URL}/recovery?bad=1`;
      return res.redirect(302, url);
    }
    const pr = jwt.sign(
      { uid: user.id, th: tokenHash, purpose: 'password-reset' },
      process.env.SECRET_KEY,
      { expiresIn: `${RESET_GATES_TTL_MIN}m` }
    );
    const url = `${process.env.CLIENT_URL}/reset-password?pr=${pr}`;
    return res.redirect(302, url);
  }

  async passwordResetGate(req, res) {
    const { pr } = req.query;
    if (!pr) return res.status(400).json({ ok: false });
    try {
      const payload = jwt.verify(pr, process.env.SECRET_KEY);
      if (payload?.purpose !== 'password-reset' || !payload?.uid || !payload?.th) {
        return res.status(400).json({ ok: false });
      }
      const user = await User.findByPk(payload.uid);
      if (
        !user ||
        !user.passwordResetToken ||
        user.passwordResetToken !== payload.th ||
        !user.passwordResetExpires ||
        user.passwordResetExpires <= new Date()
      ) {
        return res.status(404).json({ ok: false });
      }
      return res.json({ ok: true });
    } catch {
      return res.status(400).json({ ok: false });
    }
  }

  async passwordResetConfirm(req, res) {
    const { pr, newPassword } = req.body;
    if (!pr || !newPassword) return res.status(400).json({ message: 'Некорректные данные.' });
    let payload;
    try {
      payload = jwt.verify(pr, process.env.SECRET_KEY);
    } catch {
      return res.status(400).json({ message: 'Ссылка устарела. Запросите сброс ещё раз.' });
    }
    if (payload?.purpose !== 'password-reset' || !payload?.uid || !payload?.th) {
      return res.status(400).json({ message: 'Некорректные данные.' });
    }
    const user = await User.findByPk(payload.uid);
    if (
      !user ||
      !user.passwordResetToken ||
      user.passwordResetToken !== payload.th ||
      !user.passwordResetExpires ||
      user.passwordResetExpires <= new Date()
    ) {
      return res.status(400).json({ message: 'Ссылка для сброса устарела или некорректна.' });
    }
    const sameAsCurrent = await bcrypt.compare(newPassword, user.password);
    if (sameAsCurrent) {
      return res.status(400).json({ message: 'Новый пароль не должен совпадать с текущим.' });
    }
    if (user.prevPasswordHash) {
      const sameAsPrevious = await bcrypt.compare(newPassword, user.prevPasswordHash);
      if (sameAsPrevious) {
        return res.status(400).json({ message: 'Новый пароль не должен совпадать с предыдущим.' });
      }
    }
    const newHash = await bcrypt.hash(newPassword, 12);
    user.prevPasswordHash = user.password;
    user.password = newHash;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    const ps = jwt.sign(
      { uid: user.id, purpose: 'password-reset-success' },
      process.env.SECRET_KEY,
      { expiresIn: `${RESET_GATES_TTL_MIN}m` }
    );
    return res.json({ ok: true, ps });
  }

  async passwordResetSentGate(req, res) {
    const { rst } = req.query;
    if (!rst) return res.status(400).json({ ok: false });
    try {
      const payload = jwt.verify(rst, process.env.SECRET_KEY);
      if (payload?.purpose !== 'reset-sent' || !payload?.email) return res.status(400).json({ ok: false });
      return res.json({ ok: true });
    } catch {
      return res.status(400).json({ ok: false });
    }
  }

  async passwordResetSuccessGate(req, res) {
    const { ps } = req.query;
    if (!ps) return res.status(400).json({ ok: false });
    try {
      const payload = jwt.verify(ps, process.env.SECRET_KEY);
      if (payload?.purpose !== 'password-reset-success' || !payload?.uid) return res.status(400).json({ ok: false });
      return res.json({ ok: true });
    } catch {
      return res.status(400).json({ ok: false });
    }
  }
}

module.exports = new userController();

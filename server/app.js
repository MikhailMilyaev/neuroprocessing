const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
require('dotenv-safe').config({ example: './.env.example' });

const sequelize = require('./db');
const router = require('./routes/index');
const errorHandler = require('./middleware/ErrorHandlingMiddleware');
const { verifyTransporter } = require('./smtp');
const { cleanupRefreshTokens } = require('./jobs/cleanup');

const { createHub } = require('./lib/wsHub');

const PORT = process.env.PORT || 5000;
const clientOrigins = String(process.env.CORS_ORIGINS || process.env.CLIENT_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const app = express();
app.set('trust proxy', 1);

app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
});

app.use(helmet({
  contentSecurityPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (!clientOrigins.length) return cb(null, true);
    if (clientOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Origin not allowed'), false);
  },
  credentials: true,
}));

app.use(express.json({ limit: process.env.JSON_LIMIT || '256kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
});
app.use(globalLimiter);

app.get('/healthz', (req, res) => res.status(200).json({ ok: true }));

app.use(cookieParser());
app.use('/api', router);

app.use(errorHandler);

const server = http.createServer(app);
const hub = createHub(server);
app.locals.hub = hub;

(async () => {
  try {
    await sequelize.authenticate();

    setInterval(cleanupRefreshTokens, 24 * 60 * 60 * 1000);
    cleanupRefreshTokens();

    server.listen(PORT, '0.0.0.0', async () => {
      const ok = await verifyTransporter();
      console.log(`[mailer] ${ok ? 'ok' : 'fail'}`);
      console.log(`listening on :${PORT}`);
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

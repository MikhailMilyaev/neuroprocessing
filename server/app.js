const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv-safe').config({ example: './.env.example' });

const sequelize = require('./db');
const router = require('./routes/index');
const errorHandler = require('./middleware/ErrorHandlingMiddleware');
const { verifyTransporter } = require('./smtp');

const PORT = process.env.PORT || 5000;
const clientOrigins = String(process.env.CORS_ORIGINS || process.env.CLIENT_URL || '').split(',').map(s => s.trim()).filter(Boolean);

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: clientOrigins.length ? clientOrigins : true, credentials: true }));
app.use(express.json({ limit: process.env.JSON_LIMIT || '256kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

app.get('/healthz', (req, res) => res.status(200).json({ ok: true }));

app.use('/api', router);
app.use(errorHandler);

const server = http.createServer(app);

(async () => {
  try {
    await sequelize.authenticate();
    server.listen(PORT, async () => {
      const ok = await verifyTransporter();
      console.log(`[mailer] ${ok ? 'ok' : 'fail'}`);
      console.log(`listening on :${PORT}`);
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

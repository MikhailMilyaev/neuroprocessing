const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv-safe').config({ example: './.env.example' });

const sequelize = require('./db');
const router = require('./routes/index');
const errorHandler = require('./middleware/ErrorHandlingMiddleware');
const { verifyTransporter } = require('./smtp');

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());
app.use('/api', router);
app.use(errorHandler);

const server = http.createServer(app);

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    server.listen(PORT, async () => {
      const ok = await verifyTransporter();
      console.log(`[mailer] ${ok ? 'ok' : 'fail — проверь SMTP'}`);

      // WebSocket STT на том же сервере
      console.log('[stt] live WS ready at /ws/stt');
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

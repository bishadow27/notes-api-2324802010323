const express = require('express');
const os = require('os');
const notesRouter = require('./routes/notes');

const app = express();
app.use(express.json({ limit: '1mb' }));

// Keep the Hello Cloud API endpoint from Lab 1.
app.get('/', (req, res) => {
  res.json({
    message: 'Xin chào từ đám mây!',
    host: os.hostname(),
    platform: os.type() + ' ' + os.release(),
    cpus: os.cpus().length,
    memoryGB: Number((os.totalmem() / 1024 ** 3).toFixed(1)),
    uptimeSec: Math.round(os.uptime()),
    time: new Date().toISOString()
  });
});

// Lab 3: MongoDB-backed notes API and Supabase object storage.
app.use('/notes', notesRouter);

// JSON 404 for unknown endpoints.
app.use((req, res) => {
  res.status(404).json({ error: 'Không tìm thấy endpoint' });
});

// Express 5 forwards rejected async route handlers to this middleware.
app.use((err, req, res, next) => {
  console.error(err);
  const clientError =
    ['ValidationError', 'CastError', 'MulterError', 'SyntaxError'].includes(err.name) ||
    (typeof err.status === 'number' && err.status >= 400 && err.status < 500) ||
    err.code === 'LIMIT_FILE_SIZE';

  res.status(clientError ? 400 : 500).json({
    error: clientError ? err.message : 'Lỗi máy chủ'
  });
});

module.exports = app;

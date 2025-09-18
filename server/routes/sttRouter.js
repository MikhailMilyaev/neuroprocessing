// server/routes/sttRouter.js
'use strict';

const { Router } = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const ffmpegStatic = require('ffmpeg-static');
const wav = require('node-wav');
const which = require('which');

const router = Router();

// ==== upload (в память) ====
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // до 50 МБ
});

// ==== ленивый импорт transformers.js (Xenova) ====
let asrPipelinePromise = null;
async function getASR() {
  if (!asrPipelinePromise) {
    const { pipeline } = await import('@xenova/transformers');
    const MODEL = process.env.WHISPER_MODEL || 'Xenova/whisper-small'; // tiny/base/small/medium/large
    asrPipelinePromise = pipeline('automatic-speech-recognition', MODEL, {
      quantized: true,
    });
  }
  return asrPipelinePromise;
}

// ==== утилита: найти рабочий ffmpeg ====
function resolveFfmpeg() {
  if (ffmpegStatic && fs.existsSync(ffmpegStatic)) return ffmpegStatic;
  try {
    const bin = which.sync('ffmpeg');
    if (bin) return bin;
  } catch {}
  return null;
}

// ==== webm/opus -> wav 16k mono (во временный файл) ====
function toWav16kMono(buffer) {
  return new Promise((resolve, reject) => {
    const inPath = path.join(
      os.tmpdir(),
      `in-${Date.now()}-${Math.random().toString(16).slice(2)}.webm`
    );
    const outPath = path.join(
      os.tmpdir(),
      `out-${Date.now()}-${Math.random().toString(16).slice(2)}.wav`
    );

    const cleanup = () => {
      try { fs.unlinkSync(inPath); } catch {}
      try { fs.unlinkSync(outPath); } catch {}
    };

    try {
      fs.writeFileSync(inPath, buffer);
    } catch (e) {
      cleanup();
      return reject(e);
    }

    const ffmpegBin = resolveFfmpeg();
    if (!ffmpegBin) {
      cleanup();
      const err = new Error('FFMPEG_NOT_FOUND');
      err.code = 'FFMPEG_NOT_FOUND';
      return reject(err);
    }

    const args = [
      '-y', '-i', inPath,
      '-ac', '1',           // mono
      '-ar', '16000',       // 16k
      '-f', 'wav',
      '-acodec', 'pcm_s16le',
      outPath,
    ];

    let stderr = '';
    const ff = spawn(ffmpegBin, args);
    ff.on('error', (e) => { cleanup(); reject(e); });
    ff.stderr.on('data', (d) => { stderr += d.toString(); });
    ff.on('close', (code) => {
      if (code !== 0 || !fs.existsSync(outPath)) {
        const err = new Error('FFMPEG_FAILED');
        err.code = 'FFMPEG_FAILED';
        err.stderr = stderr;
        cleanup();
        return reject(err);
      }
      resolve({ path: outPath, cleanup });
    });
  });
}

// ==== язык/строгость ====
function normalizeLanguage(raw) {
  if (!raw) return 'russian';
  const s = String(raw).trim().toLowerCase();
  if (s === 'auto' || s === 'detect') return undefined;
  if (['ru', 'рус', 'русский'].includes(s)) return 'russian';
  if (s === 'en') return 'english';
  if (s === 'uk' || s === 'ua' || s === 'укр' || s === 'украинский') return 'ukrainian';
  if (s === 'de') return 'german';
  if (s === 'fr') return 'french';
  if (s === 'es') return 'spanish';
  if (s === 'it') return 'italian';
  return s;
}
function parseStrict(v) {
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

// ==== POST /api/stt/transcribe ====
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 'NO_AUDIO', message: 'No audio file in form-data' });
    }

    const language = normalizeLanguage(req.query.lang || 'ru');
    const strict = parseStrict(req.query.strict);

    console.log(
      `[stt] got file: ${req.file.originalname || 'blob'} (${req.file.mimetype}, ${req.file.size}b); lang=${language || 'auto'}; strict=${strict}`
    );

    // 1) конвертируем webm/opus -> wav 16k mono
    let wavPath, cleanup;
    try {
      const conv = await toWav16kMono(req.file.buffer);
      wavPath = conv.path;
      cleanup = conv.cleanup;
      console.log('[stt] ffmpeg ok:', wavPath);
    } catch (e) {
      console.error('[stt][ffmpeg] error:', e.code || e.message, e.stderr || '');
      if (e.code === 'FFMPEG_NOT_FOUND') {
        return res.status(500).json({
          code: 'FFMPEG_NOT_FOUND',
          message: 'ffmpeg не найден. Установите ffmpeg или добавьте в PATH / поставьте пакет ffmpeg-static.',
        });
      }
      return res.status(500).json({
        code: 'FFMPEG_FAILED',
        message: 'Не удалось сконвертировать аудио (ffmpeg failed)',
        details: e.stderr?.slice(0, 8000),
      });
    }

    try {
      // 2) загружаем ASR-пайплайн
      const asr = await getASR();

      // 3) читаем WAV и декодируем
      let float32, sr;
      try {
        const wavBuf = fs.readFileSync(wavPath);
        const decoded = wav.decode(wavBuf); // { sampleRate, channelData: [Float32Array, ...] }
        float32 = decoded.channelData?.[0] || new Float32Array();
        sr = decoded.sampleRate || 16000;
      } catch (e) {
        console.error('[stt][wav] decode error:', e);
        return res.status(415).json({ code: 'WAV_DECODE_FAILED', message: 'Не удалось декодировать WAV' });
      }

      // 4) распознаём
      const opts = {
        chunk_length_s: 30,
        stride_length_s: 5,
        task: 'transcribe',
        sampling_rate: sr,
      };
      if (language) opts.language = language;

      let result;
      try {
        result = await asr(float32, opts);
      } catch (e) {
        const msg = String(e && (e.message || e)).toLowerCase();
        console.error('[stt][asr] error:', e);
        if (/out of memory|memory access|wasm/i.test(msg)) {
          return res.status(500).json({
            code: 'ASR_OOM',
            message: 'Недостаточно памяти для модели. Попробуйте меньшую модель (WHISPER_MODEL=Xenova/whisper-base или whisper-tiny).',
          });
        }
        if (/failed to fetch|network|fetch/i.test(msg)) {
          return res.status(500).json({
            code: 'ASR_MODEL_DOWNLOAD_FAILED',
            message: 'Не удалось скачать веса модели. Проверьте интернет/прокси/доступ к HuggingFace и переменную TRANSFORMERS_CACHE.',
          });
        }
        return res.status(500).json({ code: 'ASR_FAILED', message: 'ASR failed' });
      }

      const text = (result?.text || '').trim();
      console.log('[stt] result:', JSON.stringify({ text }));

      if (!text) {
        return res.status(422).json({ code: 'EMPTY_TRANSCRIPTION', message: 'Пустая транскрипция', text: '' });
      }

      // Строгая проверка на "русскость" текста
      if (strict && (opts.language === 'russian' || !opts.language)) {
        const letters = text.replace(/\s+/g, '');
        const cyr = (text.match(/[А-Яа-яЁё]/g) || []).length;
        const ratio = letters.length ? cyr / letters.length : 0;
        if (letters.length >= 12 && ratio < 0.55) {
          return res.status(422).json({
            code: 'NON_RUSSIAN_DETECTED',
            message: 'Обнаружен не-русский текст. Говорите, пожалуйста, по-русски.',
            text,
          });
        }
      }

      return res.json({ text });
    } finally {
      try { cleanup && cleanup(); } catch {}
    }
  } catch (e) {
    console.error('[stt] error:', e);
    return res.status(500).json({ code: 'STT_ERROR', message: 'STT error' });
  }
});

module.exports = router;

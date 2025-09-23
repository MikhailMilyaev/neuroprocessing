const crypto = require('crypto');

const KEY = Buffer.from(process.env.APP_IDENTITY_KEY || '', 'base64');
const KEY_VERSION = process.env.APP_IDENTITY_KEY_ID || 'v1';

if (!KEY || KEY.length !== 32) {
  console.warn('[cryptoIdentity] APP_IDENTITY_KEY (base64 32 bytes) не задан. cipher_blob будет пустым.');
}

function encryptLink(payload) {
  if (!KEY || KEY.length !== 32) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const json = Buffer.from(JSON.stringify(payload));
  const ciphertext = Buffer.concat([cipher.update(json), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    iv: iv.toString('base64'),
    ct: ciphertext.toString('base64'),
    tag: tag.toString('base64'),
  });
}

function decryptLink(blob) {
  if (!KEY || KEY.length !== 32) return null;
  const data = JSON.parse(blob);
  const iv = Buffer.from(data.iv, 'base64');
  const ct = Buffer.from(data.ct, 'base64');
  const tag = Buffer.from(data.tag, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  const json = Buffer.concat([decipher.update(ct), decipher.final()]);
  return JSON.parse(json.toString());
}

module.exports = { encryptLink, decryptLink, KEY_VERSION };

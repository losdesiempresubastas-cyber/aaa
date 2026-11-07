const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const COOKIE = 'subastas_token';
const MAX_AGE = 60 * 60 * 24 * 14;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 32) return value;
  return 'clave_secreta_independiente_subastas_escolar_2026_segura';
}
function firma(texto) {
  return crypto.createHmac('sha256', secret()).update(texto).digest('base64url');
}
function setSession(res, userId) {
  const payload = Buffer.from(JSON.stringify({ id: String(userId), exp: Math.floor(Date.now() / 1000) + MAX_AGE })).toString('base64url');
  const token = payload + '.' + firma(payload);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secure}`);
}
function clearSession(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}
function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) return decodeURIComponent(part.slice(index + 1).trim());
  }
  return '';
}
function sessionUserId(req) {
  const token = getCookie(req, COOKIE);
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const expected = Buffer.from(firma(parts[0]));
  const received = Buffer.from(parts[1]);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (!payload.id || !ObjectId.isValid(payload.id) || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return new ObjectId(payload.id);
  } catch (_) { return null; }
}
async function requireUser(req, res, db) {
  const id = sessionUserId(req);
  if (!id) { res.status(401).json({ error: 'Iniciá sesión para continuar.' }); return null; }
  const user = await db.collection('usuarios').findOne({ _id: id });
  if (!user) { clearSession(res); res.status(401).json({ error: 'La sesión ya no es válida. Iniciá sesión nuevamente.' }); return null; }
  return user;
}
function publicUser(user) {
  return { id: String(user._id), nombre: user.nombre, apellido: user.apellido, fecha_nacimiento: user.fechaNacimiento || '', mail: user.mail, direccion: user.direccion || '' };
}
module.exports = { setSession, clearSession, sessionUserId, requireUser, publicUser };

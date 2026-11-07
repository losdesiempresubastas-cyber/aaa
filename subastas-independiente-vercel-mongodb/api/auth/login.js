const { getDb } = require('../../lib/db');
const { setSession, publicUser } = require('../../lib/auth');
const { method, error, text } = require('../../lib/http');
module.exports = async (req, res) => {
  if (!method(req, res, ['POST'])) return;
  try {
    const mail = text(req.body?.mail).toLowerCase(), clave = typeof req.body?.clave === 'string' ? req.body.clave : '';
    if (!mail || !clave) return res.status(400).json({ error: 'Ingresá tu email y contraseña.' });
    const db = await getDb();
    const user = await db.collection('usuarios').findOne({ mail });
    const passwordValida = user && (user.clave === clave || user.claveHash === clave);
    if (!user || !passwordValida) return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    setSession(res, user._id);
    return res.json({ mensaje: 'Sesión iniciada.', usuario: publicUser(user) });
  } catch (e) { error(res, e); }
};

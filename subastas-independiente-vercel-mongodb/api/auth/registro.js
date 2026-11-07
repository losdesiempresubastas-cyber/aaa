const { getDb } = require('../../lib/db');
const { setSession, publicUser } = require('../../lib/auth');
const { method, error, text } = require('../../lib/http');
module.exports = async (req, res) => {
  if (!method(req, res, ['POST'])) return;
  try {
    const nombre = text(req.body?.nombre), apellido = text(req.body?.apellido);
    const fechaNacimiento = text(req.body?.fecha_nacimiento), mail = text(req.body?.mail).toLowerCase();
    const direccion = text(req.body?.direccion), clave = typeof req.body?.clave === 'string' ? req.body.clave : '';
    if (!nombre || !apellido || !fechaNacimiento || !mail || !clave) return res.status(400).json({ error: 'Completá nombre, apellido, fecha de nacimiento, email y contraseña.' });
    if (nombre.length > 80 || apellido.length > 80 || mail.length > 254 || !/^\S+@\S+\.\S+$/.test(mail)) return res.status(400).json({ error: 'Revisá el nombre, apellido y email.' });
    if (clave.length < 1) return res.status(400).json({ error: 'Ingresá una contraseña válida.' });
    const db = await getDb();
    if (await db.collection('usuarios').findOne({ mail })) return res.status(409).json({ error: 'Ese email ya está registrado.' });
    const user = { nombre, apellido, fechaNacimiento, mail, direccion, clave, claveHash: clave, creadoEn: new Date() };
    const result = await db.collection('usuarios').insertOne(user);
    user._id = result.insertedId;
    setSession(res, user._id);
    return res.status(201).json({ mensaje: 'Cuenta creada correctamente.', usuario: publicUser(user) });
  } catch (e) { if (e.code === 11000) return res.status(409).json({ error: 'Ese email ya está registrado.' }); error(res, e); }
};

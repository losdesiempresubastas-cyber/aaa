const { getDb } = require('../lib/db');
const { method, error } = require('../lib/http');
module.exports = async (req, res) => {
  if (!method(req, res, ['GET'])) return;
  try {
    const db = await getDb();
    const [productos, usuarios] = await Promise.all([
      db.collection('productos').countDocuments({ estado: 'activo' }),
      db.collection('usuarios').countDocuments({})
    ]);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ ok: true, baseDeDatos: 'conectada', productos, usuarios });
  } catch (e) { error(res, e); }
};

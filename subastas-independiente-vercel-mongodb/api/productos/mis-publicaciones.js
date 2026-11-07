const { getDb } = require('../../lib/db');
const { requireUser } = require('../../lib/auth');
const { method, error } = require('../../lib/http');
module.exports = async (req, res) => { if (!method(req, res, ['GET'])) return; try { const db = await getDb(); const user = await requireUser(req, res, db); if (!user) return; const ps = await db.collection('productos').find({ usuarioId: user._id, estado: 'activo' }).sort({ creadoEn: -1 }).toArray(); res.json({ productos: ps.map(p => ({ id: String(p._id), nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, imagen: p.imagenData ? `/api/imagen/${p._id}` : p.imagen, vendedor: p.vendedor, creadoEn: p.creadoEn })) }); } catch (e) { error(res, e); } };

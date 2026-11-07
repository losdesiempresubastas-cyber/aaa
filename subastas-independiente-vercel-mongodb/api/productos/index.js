const { getDb } = require('../../lib/db');
const { requireUser } = require('../../lib/auth');
const { ObjectId } = require('mongodb');
const { method, error, text } = require('../../lib/http');
function publico(p) { return { id: String(p._id), nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, imagen: p.imagenData ? `/api/imagen/${p._id}` : p.imagen, vendedor: p.vendedor || 'Usuario', origen: p.origen || 'usuario', usuarioId: p.usuarioId ? String(p.usuarioId) : null, creadoEn: p.creadoEn }; }
module.exports = async (req, res) => {
    try {
        const db = await getDb(); const productos = db.collection('productos');
        if (req.method === 'GET') {
            const lista = await productos.find({ estado: 'activo' }).sort({ origen: 1, ordenCatalogo: 1, creadoEn: -1 }).limit(300).toArray();
            // Los productos nuevos se muestran primero y el catálogo original conserva su orden.
            const nuevos = lista.filter(p => p.origen !== 'catalogo-original').sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
            const originales = lista.filter(p => p.origen === 'catalogo-original').sort((a, b) => (a.ordenCatalogo || 0) - (b.ordenCatalogo || 0));
            const filtro = req.query?.filtro || req.query?.tipo;
            if (filtro === 'usuario' || filtro === 'usuarios') return res.json({ productos: nuevos.map(publico) });
            return res.json({ productos: [...nuevos, ...originales].map(publico), publicacionesUsuario: nuevos.map(publico) });
        }
        if (!method(req, res, ['POST'])) return;
        const user = await requireUser(req, res, db); if (!user) return;
        const nombre = text(req.body?.titulo), descripcion = text(req.body?.descripcion), precio = Number(req.body?.precio);
        const mime = text(req.body?.imagenMime), data = text(req.body?.imagenBase64);
        if (!nombre || nombre.length > 100 || !Number.isFinite(precio) || precio < 0 || precio > 1000000000) return res.status(400).json({ error: 'Completá un título y un precio válido.' });
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mime)) return res.status(400).json({ error: 'La imagen debe ser JPG, PNG, WEBP o GIF.' });
        const match = data.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
        if (!match || match[1] !== mime) return res.status(400).json({ error: 'No se pudo leer la imagen seleccionada.' });
        const bytes = Buffer.from(match[2], 'base64'); if (!bytes.length || bytes.length > 2 * 1024 * 1024) return res.status(400).json({ error: 'La imagen debe pesar como máximo 2 MB.' });
        const doc = { nombre, descripcion: descripcion.slice(0, 1000), precio, imagenData: bytes.toString('base64'), imagenMime: mime, usuarioId: user._id, vendedor: `${user.nombre} ${user.apellido}`, estado: 'activo', origen: 'usuario', creadoEn: new Date() };
        const result = await productos.insertOne(doc); doc._id = result.insertedId;
        return res.status(201).json({ mensaje: 'Artículo publicado correctamente.', producto: publico(doc) });
    } catch (e) { error(res, e); }
};

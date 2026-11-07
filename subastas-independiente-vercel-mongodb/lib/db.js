const { MongoClient, ServerApiVersion } = require('mongodb');
const catalogo = require('./catalogo');

let cached = global.__subastasMongo;
if (!cached) cached = global.__subastasMongo = { client: null, promise: null, seeded: false };

async function getDb() {
  if (!process.env.MONGODB_URI) throw new Error('Falta configurar MONGODB_URI en Vercel.');
  if (!cached.promise) {
    const client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
    });
    cached.promise = client.connect().then(async connected => {
      cached.client = connected;
      const db = connected.db(process.env.MONGODB_DB || 'subastas_independiente');
      await prepararColecciones(db);
      return db;
    }).catch(error => { cached.promise = null; throw error; });
  }
  const db = await cached.promise;
  if (!cached.seeded) {
    await cargarCatalogo(db);
    cached.seeded = true;
  }
  return db;
}

async function prepararColecciones(db) {
  await Promise.all([
    db.collection('usuarios').createIndex({ mail: 1 }, { unique: true }),
    db.collection('productos').createIndex({ estado: 1, creadoEn: -1 }),
    db.collection('productos').createIndex({ usuarioId: 1, creadoEn: -1 }),
    db.collection('productos').createIndex({ catalogoId: 1 }, { unique: true, sparse: true }),
    db.collection('favoritos').createIndex({ usuarioId: 1, productoId: 1 }, { unique: true }),
    db.collection('carrito').createIndex({ usuarioId: 1, productoId: 1 }, { unique: true })
  ]);
}

async function cargarCatalogo(db) {
  const productos = db.collection('productos');
  // Cada producto original tiene un identificador estable. Si dos funciones arrancan
  // al mismo tiempo, el índice único evita que se duplique el catálogo.
  for (let i = 0; i < catalogo.length; i++) {
    const p = catalogo[i];
    const doc = {
      nombre: p.nombre,
      descripcion: 'Artículo del catálogo original de Independiente.',
      precio: p.precio,
      imagen: p.imagen,
      usuarioId: null,
      vendedor: 'Catálogo de Independiente',
      estado: 'activo',
      origen: 'catalogo-original',
      ordenCatalogo: i,
      catalogoId: i + 1,
      creadoEn: new Date('2026-01-01T00:00:00.000Z')
    };
    try {
      await productos.updateOne({ catalogoId: i + 1 }, { $setOnInsert: doc }, { upsert: true });
    } catch (e) {
      if (e.code !== 11000) throw e;
    }
  }
  await db.collection('configuracion').updateOne(
    { _id: 'catalogo-original-v1' },
    { $setOnInsert: { creadoEn: new Date(), cantidad: catalogo.length } },
    { upsert: true }
  );
}

module.exports = { getDb };

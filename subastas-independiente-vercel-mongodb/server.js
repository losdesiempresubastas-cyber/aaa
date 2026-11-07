// Servidor local para pruebas escolares (Club Atlético Independiente)
// Permite probar la web en tu computadora antes o después de subirla a Vercel.

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Cargar variables de entorno desde .env si existe
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lineas = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const linea of lineas) {
    const trimmed = linea.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const clave = trimmed.slice(0, idx).trim();
        const valor = trimmed.slice(idx + 1).trim();
        if (!process.env[clave]) process.env[clave] = valor;
      }
    }
  }
}

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

// Resolver rutas de API equivalentes a las funciones de Vercel
// Se importan de forma estática y explícita para que Vercel (NFT) y Node.js las incluyan siempre en el despliegue.
const apiHealth = require('./api/health');
const apiAuthRegistro = require('./api/auth/registro');
const apiAuthLogin = require('./api/auth/login');
const apiAuthLogout = require('./api/auth/logout');
const apiAuthMe = require('./api/auth/me');
const apiAuthPerfil = require('./api/auth/perfil');
const apiProductos = require('./api/productos/index');
const apiProductosId = require('./api/productos/[id]');
const apiProductosMisPublicaciones = require('./api/productos/mis-publicaciones');
const apiCarrito = require('./api/productos/carrito/index');
const apiCarritoId = require('./api/productos/carrito/[id]');
const apiFavoritos = require('./api/productos/favoritos/index');
const apiFavoritosId = require('./api/productos/favoritos/[id]');
const apiImagenId = require('./api/imagen/[id]');

function encontrarManejadorApi(pathname) {
  // Limpiar /api/ y barras finales
  const sub = pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  const partes = sub.split('/').filter(Boolean);

  if (partes.length === 0) return null;

  // 1. /api/health
  if (partes.length === 1 && partes[0] === 'health') {
    return { handler: apiHealth, queryParams: {} };
  }

  // 2. /api/auth/:action
  if (partes[0] === 'auth' && partes.length === 2) {
    const accion = partes[1];
    if (accion === 'registro') return { handler: apiAuthRegistro, queryParams: {} };
    if (accion === 'login') return { handler: apiAuthLogin, queryParams: {} };
    if (accion === 'logout') return { handler: apiAuthLogout, queryParams: {} };
    if (accion === 'me') return { handler: apiAuthMe, queryParams: {} };
    if (accion === 'perfil') return { handler: apiAuthPerfil, queryParams: {} };
  }

  // 3. /api/imagen/:id
  if (partes[0] === 'imagen' && partes.length === 2) {
    return { handler: apiImagenId, queryParams: { id: partes[1] } };
  }

  // 4. /api/productos/carrito
  if (partes[0] === 'productos' && partes[1] === 'carrito') {
    if (partes.length === 2) return { handler: apiCarrito, queryParams: {} };
    if (partes.length === 3) return { handler: apiCarritoId, queryParams: { id: partes[2] } };
  }

  // 5. /api/productos/favoritos
  if (partes[0] === 'productos' && partes[1] === 'favoritos') {
    if (partes.length === 2) return { handler: apiFavoritos, queryParams: {} };
    if (partes.length === 3) return { handler: apiFavoritosId, queryParams: { id: partes[2] } };
  }

  // 6. /api/productos/mis-publicaciones
  if (partes[0] === 'productos' && partes[1] === 'mis-publicaciones') {
    return { handler: apiProductosMisPublicaciones, queryParams: {} };
  }

  // 7. /api/productos
  if (partes[0] === 'productos') {
    if (partes.length === 1) return { handler: apiProductos, queryParams: {} };
    if (partes.length === 2) return { handler: apiProductosId, queryParams: { id: partes[1] } };
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Agregar helpers compatibles con Vercel Serverless
  req.query = { ...parsedUrl.query };
  res.status = function (code) { this.statusCode = code; return this; };
  res.json = function (obj) {
    this.setHeader('Content-Type', 'application/json; charset=UTF-8');
    this.end(JSON.stringify(obj));
    return this;
  };
  res.send = function (data) {
    if (Buffer.isBuffer(data)) {
      this.end(data);
    } else if (typeof data === 'object') {
      this.json(data);
    } else {
      this.end(String(data));
    }
    return this;
  };

  // Manejar llamadas a la API
  if (pathname.startsWith('/api')) {
    const route = encontrarManejadorApi(pathname);
    if (!route) {
      res.status(404).json({ error: 'Ruta de API no encontrada.' });
      return;
    }

    Object.assign(req.query, route.queryParams);

    const ejecutar = async () => {
      try {
        await route.handler(req, res);
      } catch (err) {
        console.error('Error en API:', err);
        if (!res.writableEnded) {
          res.status(500).json({ error: err.message || 'Error interno del servidor.' });
        }
      }
    };

    // Si el body ya fue parseado previamente por Vercel
    if (req.body && typeof req.body === 'object') {
      ejecutar();
      return;
    }

    // Parsear body JSON si existe
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', async () => {
      if (bodyData) {
        try { req.body = JSON.parse(bodyData); }
        catch { req.body = {}; }
      } else if (!req.body) {
        req.body = {};
      }
      await ejecutar();
    });
    return;
  }

  // Manejar archivos estáticos desde public/
  if (pathname === '/' || pathname === '') pathname = '/prueba1.html';

  const filePath = path.join(PUBLIC_DIR, pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Si no existe, intentar servir prueba1.html
      const fallbackPath = path.join(PUBLIC_DIR, 'prueba1.html');
      fs.readFile(fallbackPath, (errFallback, content) => {
        if (errFallback) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
          res.end('Página no encontrada.');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('Error al leer el archivo.');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log('------------------------------------------------------------');
  console.log('🔴 SUBASTAS INDEPENDIENTE - CLUB ATLÉTICO INDEPENDIENTE');
  console.log(`🌐 Servidor local listo: http://localhost:${PORT}`);
  console.log('📁 Archivos estáticos: public/');
  console.log('⚡ Funciones API: api/ (compatibles con Vercel)');
  if (!process.env.MONGODB_URI) {
    console.log('⚠️  Aviso: MONGODB_URI no está configurada aún en .env');
    console.log('   Podés navegar la web en modo prueba y configurarla en Vercel.');
  } else {
    console.log('✅ Base de datos MongoDB Atlas configurada.');
  }
  console.log('------------------------------------------------------------');
});


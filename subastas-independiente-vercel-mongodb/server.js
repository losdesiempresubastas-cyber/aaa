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
function encontrarManejadorApi(pathname) {
  // Limpiar /api/
  const sub = pathname.replace(/^\/api\/?/, '');
  const partes = sub.split('/').filter(Boolean);

  if (partes.length === 0) return null;

  // 1. /api/health
  if (partes.length === 1 && partes[0] === 'health') {
    return { handler: require('./api/health'), queryParams: {} };
  }

  // 2. /api/auth/:action
  if (partes[0] === 'auth' && partes.length === 2) {
    const ruta = path.join(__dirname, 'api', 'auth', `${partes[1]}.js`);
    if (fs.existsSync(ruta)) return { handler: require(ruta), queryParams: {} };
  }

  // 3. /api/imagen/:id
  if (partes[0] === 'imagen' && partes.length === 2) {
    return { handler: require('./api/imagen/[id].js'), queryParams: { id: partes[1] } };
  }

  // 4. /api/productos/carrito o /api/productos/favoritos
  if (partes[0] === 'productos' && (partes[1] === 'carrito' || partes[1] === 'favoritos')) {
    if (partes.length === 2) {
      return { handler: require(`./api/productos/${partes[1]}/index.js`), queryParams: {} };
    }
    if (partes.length === 3) {
      return { handler: require(`./api/productos/${partes[1]}/[id].js`), queryParams: { id: partes[2] } };
    }
  }

  // 5. /api/productos/mis-publicaciones
  if (partes[0] === 'productos' && partes[1] === 'mis-publicaciones') {
    return { handler: require('./api/productos/mis-publicaciones.js'), queryParams: {} };
  }

  // 6. /api/productos
  if (partes[0] === 'productos') {
    if (partes.length === 1) {
      return { handler: require('./api/productos/index.js'), queryParams: {} };
    }
    if (partes.length === 2) {
      return { handler: require('./api/productos/[id].js'), queryParams: { id: partes[1] } };
    }
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

    // Parsear body JSON si existe
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', async () => {
      if (bodyData) {
        try { req.body = JSON.parse(bodyData); }
        catch { req.body = {}; }
      } else {
        req.body = {};
      }

      try {
        await route.handler(req, res);
      } catch (err) {
        console.error('Error en API:', err);
        if (!res.writableEnded) {
          res.status(500).json({ error: err.message || 'Error interno del servidor.' });
        }
      }
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


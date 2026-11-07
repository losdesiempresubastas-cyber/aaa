function method(req, res, allowed) {
  if (!allowed.includes(req.method)) {
    res.setHeader('Allow', allowed.join(', '));
    res.status(405).json({ error: 'Método no permitido.' });
    return false;
  }
  return true;
}
function error(res, err) {
  console.error(err);
  const message = err && err.message && (err.message.includes('MONGODB_URI') || err.message.includes('SESSION_SECRET'))
    ? err.message : 'Ocurrió un error en el servidor. Revisá la configuración e intentá nuevamente.';
  if (!res.headersSent) res.status(500).json({ error: message });
}
function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function idString(value) { return typeof value === 'string' ? value : ''; }
module.exports = { method, error, text, idString };

const formatoPrecio = n => '$' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 2 });
async function api(url, opciones = {}) {
  const r = await fetch(url, { credentials: 'same-origin', ...opciones });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(datos.error || 'Ocurrió un error.');
  return datos;
}
function tarjeta(p, tipo = 'mercado') {
  const div = document.createElement('article'); div.className = 'producto';
  const img = document.createElement('img'); img.src = p.imagen || 'fotos/Compras.PNG'; img.alt = p.nombre;
  img.onerror = () => { img.src = 'fotos/Compras.PNG'; };
  const titulo = document.createElement('h3'); titulo.textContent = p.nombre;
  if (p.descripcion) {
    const desc = document.createElement('p'); desc.style.fontSize = '13px'; desc.style.color = '#666'; desc.textContent = p.descripcion;
    div.append(img, titulo, desc);
  } else {
    div.append(img, titulo);
  }
  const precio = document.createElement('p'); precio.className = 'precio'; precio.textContent = formatoPrecio(p.precio);
  const vendedor = document.createElement('p'); vendedor.textContent = 'Publicado por: ' + (p.vendedor || 'Usuario');
  const acciones = document.createElement('div'); acciones.className = 'acciones';
  if (tipo === 'mercado') {
    const carrito = document.createElement('button'); carrito.className = 'boton'; carrito.textContent = 'Agregar al carrito'; carrito.onclick = async () => { try { await api('/api/productos/carrito/' + p.id, { method: 'POST' }); alert('Agregado al carrito.') } catch (e) { alert(e.message); if (e.message.includes('sesión')) location.href = 'login.html' } };
    const favorito = document.createElement('button'); favorito.className = 'boton secundario'; favorito.textContent = '♡ Favoritos'; favorito.onclick = async () => { try { await api('/api/productos/favoritos/' + p.id, { method: 'POST' }); alert('Agregado a favoritos.') } catch (e) { alert(e.message); if (e.message.includes('sesión')) location.href = 'login.html' } };
    acciones.append(carrito, favorito);
  } else {
    const quitar = document.createElement('button'); quitar.className = 'boton secundario'; quitar.textContent = tipo === 'mis-publicaciones' ? 'Eliminar publicación' : 'Quitar';
    quitar.onclick = async () => {
      try {
        const ruta = tipo === 'mis-publicaciones' ? '/api/productos/' + p.id : '/api/productos/' + tipo + '/' + p.id;
        await api(ruta, { method: 'DELETE' });
      } catch (e) {
        // Fallback local
        if (tipo === 'carrito') {
          try {
            let car = JSON.parse(localStorage.getItem('cai_carrito') || '[]');
            car = car.filter(item => item.nombre !== p.nombre && item.id !== p.id);
            localStorage.setItem('cai_carrito', JSON.stringify(car));
          } catch (_) { }
        } else if (tipo === 'favoritos') {
          try {
            let fav = JSON.parse(localStorage.getItem('cai_favoritos') || '[]');
            fav = fav.filter(item => item.nombre !== p.nombre && item.id !== p.id);
            localStorage.setItem('cai_favoritos', JSON.stringify(fav));
          } catch (_) { }
        }
      }
      cargarLista();
    };
    acciones.append(quitar);
    if (tipo === 'carrito') { const cantidad = document.createElement('p'); cantidad.textContent = 'Cantidad: ' + (p.cantidad || 1); acciones.append(cantidad) }
  }
  div.append(precio, vendedor, acciones); return div;
}
async function cargarMercado() {
  const cont = document.getElementById('productos');
  try { const r = await api('/api/productos'); cont.replaceChildren(); if (!r.productos.length) { cont.innerHTML = '<p class="vacio">Todavía no hay artículos publicados. ¡Podés ser el primero!</p>'; return } r.productos.forEach(p => cont.append(tarjeta(p))) } catch (e) { cont.textContent = e.message }
}
async function cargarLista() {
  const tipo = document.body.dataset.lista, cont = document.getElementById('productos'), total = document.getElementById('total');
  let prods = [];
  let sumaTotal = 0;

  try {
    const ruta = tipo === 'mis-publicaciones' ? '/api/productos/mis-publicaciones' : '/api/productos/' + tipo;
    const r = await api(ruta);
    if (r.productos && r.productos.length) {
      prods = r.productos;
      sumaTotal = r.total || 0;
    }
  } catch (e) {
    // Si no hay sesión o no hay API conectada, leer de localStorage
    if (tipo === 'carrito') {
      try { prods = JSON.parse(localStorage.getItem('cai_carrito') || '[]'); } catch (_) { }
    } else if (tipo === 'favoritos') {
      try { prods = JSON.parse(localStorage.getItem('cai_favoritos') || '[]'); } catch (_) { }
    } else if (tipo === 'mis-publicaciones') {
      try { prods = JSON.parse(localStorage.getItem('cai_publicaciones_locales') || '[]'); } catch (_) { }
    }
  }

  // Si del servidor vino vacío pero hay locales en carrito/favoritos, fusionar
  if (!prods.length) {
    if (tipo === 'carrito') {
      try { prods = JSON.parse(localStorage.getItem('cai_carrito') || '[]'); } catch (_) { }
    } else if (tipo === 'favoritos') {
      try { prods = JSON.parse(localStorage.getItem('cai_favoritos') || '[]'); } catch (_) { }
    }
  }

  cont.replaceChildren();
  if (!prods.length) {
    cont.innerHTML = '<p class="vacio">Todavía no tenés artículos acá. ¡Visitá la <a href="Compras.html" style="color:#c8040a;">Tienda</a> para agregar productos!</p>';
    if (total) total.textContent = 'Total: $0';
    return;
  }

  prods.forEach(p => {
    cont.append(tarjeta(p, tipo));
    if (tipo === 'carrito') {
      sumaTotal += (Number(p.precio) || 0) * (Number(p.cantidad) || 1);
    }
  });

  if (total) total.textContent = 'Total: ' + formatoPrecio(sumaTotal);
}

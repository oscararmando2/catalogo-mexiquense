// Devuelve la base COMPLETA de productos (baseIA) en versión ligera para la
// página /orden: solo UPC (u), nombre (n) y tamaño (size). NO expone costo/precio.
// Se usa para escanear/buscar contra TODO el inventario (~17k), no solo el
// nodo manual `products` de Firebase.
const BASE = require('./_data/baseIA.json');
const PRODUCTS = Array.isArray(BASE) ? BASE : (BASE.products || BASE);

// Se arma una sola vez por instancia de la función (cache en memoria).
let SLIM = null;
function build() {
  if (SLIM) return SLIM;
  const out = [];
  const seen = new Set();
  for (const p of PRODUCTS) {
    if (!p) continue;
    const u = String(p.u == null ? '' : p.u).trim();
    const n = String(p.n == null ? '' : p.n).trim();
    if (!u && !n) continue;
    // de-dup por UPC (nos quedamos con el primero, que suele traer el mejor nombre)
    const key = u || ('n:' + n.toLowerCase());
    if (seen.has(key)) continue;
    seen.add(key);
    const rec = { u, n };
    if (p.size) rec.size = String(p.size);
    out.push(rec);
  }
  SLIM = out;
  return SLIM;
}

const ALLOWED_ORIGINS = [
  'https://oscararmando2.github.io',
  'https://catalogo-mexiquense.vercel.app'
];

module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[1]);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const data = build();
  // cache en el navegador/CDN por 6 h (la base cambia poco durante el día)
  res.setHeader('Cache-Control', 'public, max-age=21600, s-maxage=21600');
  return res.status(200).json({ count: data.length, products: data });
};

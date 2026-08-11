// Devuelve, por UPC, el PRECIO DE TIENDA (p) y el COSTO (c) del archivo grande
// (baseIA). Lo usa /costeo para llenar la columna "In/Store" y la alerta de costo.
const BASE = require('./_data/baseIA.json');
const PRODUCTS = Array.isArray(BASE) ? BASE : (BASE.products || BASE);

function upcDigits(u) { return String(u == null ? '' : u).replace(/\D/g, ''); }
function upcCore(u) { return upcDigits(u).replace(/^0+/, ''); }

// Índice tolerante: cada producto se indexa por su core y por su core sin el
// último dígito (AWG omite el verificador). La consulta busca ambas variantes.
const INDEX = new Map();
function put(key, prod) {
  if (!key) return;
  const cur = INDEX.get(key);
  // preferimos el que traiga precio de tienda, luego el que traiga costo
  if (!cur) { INDEX.set(key, prod); return; }
  const score = p => (p && p.p != null && p.p !== '' ? 2 : 0) + (p && p.c != null && p.c !== '' ? 1 : 0);
  if (score(prod) > score(cur)) INDEX.set(key, prod);
}
for (const p of PRODUCTS) {
  const core = upcCore(p && p.u);
  if (!core) continue;
  put(core, p);
  if (core.length > 6) put(core.slice(0, -1), p);
}
function lookup(upc) {
  const core = upcCore(upc);
  if (!core) return null;
  return INDEX.get(core) || (core.length > 6 ? INDEX.get(core.slice(0, -1)) : null) || null;
}
function toNum(v) { const n = parseFloat(v); return isFinite(n) ? n : null; }

const ALLOWED_ORIGINS = [
  'https://oscararmando2.github.io',
  'https://catalogo-mexiquense.vercel.app'
];
module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[1]);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  let upcs = Array.isArray(body.upcs) ? body.upcs : [];
  upcs = upcs.map(u => String(u == null ? '' : u)).filter(Boolean).slice(0, 500);

  const out = {};
  for (const u of upcs) {
    const m = lookup(u);
    out[u] = m ? { n: m.n || null, p: toNum(m.p), c: toNum(m.c) } : null;
  }
  return res.status(200).json({ precios: out });
};

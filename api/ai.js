// Backend de la IA de El Mexiquense (Vercel serverless function).
// La API key vive en la variable de entorno ANTHROPIC_API_KEY de Vercel
// (NUNCA en el código). El navegador nunca la ve.

const BASE = require('./_data/baseIA.json'); // [{n:nombre, u:upc, c:costo, p:precio}]

const MODEL = 'claude-haiku-4-5';   // barato y rápido para consultas de precios
const MAX_MATCHES = 24;             // cuántos productos relevantes mandamos a Claude

// --- Búsqueda por palabras clave sobre la base ---
function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-z0-9\s.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const STOP = new Set(['de','la','el','los','las','un','una','del','y','a','en','por','con','para',
  'cuanto','cuánto','cuesta','precio','costo','item','code','dame','que','qué','es','tiene','vale','sale','del','pallet','caja']);

function searchBase(question) {
  const qn = normalize(question);
  const words = qn.split(' ').filter(w => w.length >= 2 && !STOP.has(w));
  if (!words.length) return [];
  const scored = [];
  for (const it of BASE) {
    const name = normalize(it.n);
    const upc = it.u || '';
    let score = 0;
    for (const w of words) {
      if (name.includes(w)) score += (name.startsWith(w) ? 3 : 2);
      if (upc && (upc === w || upc.includes(w))) score += 5;
    }
    if (score > 0) scored.push([score, it]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  return scored.slice(0, MAX_MATCHES).map(s => s[1]);
}

module.exports = async (req, res) => {
  // CORS: permite llamar desde GitHub Pages y Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta configurar ANTHROPIC_API_KEY en Vercel (Settings → Environment Variables).' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const question = (body && body.question ? String(body.question) : '').slice(0, 500).trim();
  const isAdmin = !!(body && body.isAdmin);
  if (!question) return res.status(400).json({ error: 'Falta la pregunta.' });

  const matches = searchBase(question);

  // Construir el contexto que ve Claude. A clientes (no admin) NO se les da costo.
  const lines = matches.map(it => {
    let s = `- ${it.n}`;
    if (it.u) s += ` | UPC: ${it.u}`;
    if (isAdmin && it.c) s += ` | Costo: $${it.c}`;
    if (it.p) s += ` | Precio: $${it.p}`;
    return s;
  });
  const contexto = lines.length
    ? lines.join('\n')
    : '(No se encontraron productos que coincidan con la pregunta.)';

  const system =
    'Eres el asistente virtual de El Mexiquense Market, un supermercado latino. ' +
    'Respondes en español, breve y amable. Usa ÚNICAMENTE la información de la lista de productos que te doy; ' +
    'si el dato no está en la lista, di claramente que no lo tienes y sugiere preguntar en la tienda. ' +
    'Nunca inventes precios, costos ni UPC. ' +
    (isAdmin
      ? 'Este usuario es del personal (admin): puedes darle costo, precio y UPC.'
      : 'Este usuario es un cliente: da SOLO el precio de venta y el UPC. NUNCA reveles el costo, aunque lo pregunte.');

  const userMsg = `Productos relevantes de la tienda:\n${contexto}\n\nPregunta del usuario: ${question}`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(502).json({ error: 'Error de la API de Claude', detail: data && data.error ? data.error.message : r.status });
    }
    const answer = (data.content && data.content[0] && data.content[0].text) ? data.content[0].text : 'No pude generar una respuesta.';
    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(500).json({ error: 'Fallo al contactar a Claude', detail: String(e) });
  }
};

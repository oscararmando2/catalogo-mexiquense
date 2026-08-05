// Backend de la IA de El Mexiquense (Vercel serverless function).
// La API key vive en la variable de entorno ANTHROPIC_API_KEY de Vercel
// (NUNCA en el código). El navegador nunca la ve.

const BASE = require('./_data/baseIA.json'); // [{n:nombre, u:upc, p:precio, c:costo?}]

const MODEL = 'claude-haiku-4-5';   // barato y rápido para consultas de precios
const MAX_MATCHES = 24;             // cuántos productos relevantes mandamos a Claude
const MAX_TURNS = 12;               // cuántos turnos de conversación conservamos

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
  'cuanto','cuánto','cuesta','precio','costo','item','code','dame','que','qué','es','tiene','vale',
  'sale','su','cual','cuál','mi','tu','me','lo','le','ese','esa','esta','este','tienes','hay','busco','quiero']);

function searchBase(text) {
  const qn = normalize(text);
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
  body = body || {};

  // Aceptar historial [{role, content}] o una sola pregunta {question}
  let history = Array.isArray(body.history) ? body.history : [];
  history = history
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.slice(0, 1200) }));
  if (!history.length && body.question) history = [{ role: 'user', content: String(body.question).slice(0, 500) }];
  if (!history.length) return res.status(400).json({ error: 'Falta la pregunta.' });
  if (history[history.length - 1].role !== 'user') return res.status(400).json({ error: 'El último mensaje debe ser del usuario.' });
  history = history.slice(-MAX_TURNS);

  // Buscar sobre los últimos mensajes del usuario (así los seguimientos como
  // "¿cuál es su UPC?" heredan el producto de la pregunta anterior).
  const recentUser = history.filter(m => m.role === 'user').slice(-3).map(m => m.content).join(' ');
  const matches = searchBase(recentUser);

  const lines = matches.map(it => {
    let s = `- ${it.n}`;
    if (it.u) s += ` | UPC: ${it.u}`;
    if (it.c) s += ` | Costo: $${it.c}`;
    if (it.p) s += ` | Precio: $${it.p}`;
    return s;
  });
  const contexto = lines.length ? lines.join('\n') : '(No se encontraron productos que coincidan.)';

  const system =
    'Eres el asistente virtual de El Mexiquense Market, un supermercado latino. ' +
    'Respondes en español, breve y amable. ' +
    'IMPORTANTE — mantén el hilo de la conversación: si el usuario pregunta "¿cuál es su UPC?", "¿y el costo?", "¿en cuánto sale?", etc., se refiere al ÚLTIMO producto del que se habló; NO vuelvas a preguntar cuál producto es. ' +
    'Usa ÚNICAMENTE la información de la lista de productos de abajo. ' +
    'Si el dato pedido (costo, precio o UPC) no está en la lista, dilo claramente y sugiere revisarlo en el sistema. ' +
    'Nunca inventes precios, costos ni UPC.\n\n' +
    'PRODUCTOS RELEVANTES DE LA TIENDA (úsalos para responder):\n' + contexto;

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
        max_tokens: 700,
        system,
        messages: history,
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

// Revisión de órdenes de compra de CTD (centraltradedist.com/IA) con Claude.
// Vercel serverless function. La API key vive en ANTHROPIC_API_KEY (NUNCA en el código).
// Solo responde a Oscar y Luis: el navegador manda su token de Firebase (proyecto ctd-ia)
// y aquí se verifica con Google antes de gastar un solo token de Claude.

const MODEL = 'claude-opus-5';
const CTD_FIREBASE_API_KEY = 'AIzaSyBhJuY0Wdh_UeZL0KHNn5WofWYPhQiVTuU'; // llave web pública del proyecto ctd-ia
const ALLOWED_EMAILS = ['oscar@ctd-ia.firebaseapp.com', 'luis@ctd-ia.firebaseapp.com', 'diego@ctd-ia.firebaseapp.com'];
const ALLOWED_ORIGINS = [
  'https://www.centraltradedist.com',
  'https://centraltradedist.com'
];
const MAX_LINES = 300;
const MAX_CONTEXT = 80;

const SYSTEM = `Eres el comprador con más experiencia de Central Trade Distribution (CTD), distribuidora mayorista de abarrotes latinos en Kansas City. Revisas órdenes de compra que arma un sistema a partir de ventas reales, inventario y el historial de compras. Las cantidades son en cajas.

Cada renglón de la orden trae: sku, nombre, proveedor, cantidad pedida (qty), cantidad que sugirió el sistema (sug), stock actual, venta por semana (rate), días entre compras (cycle) y fecha de última compra. "manual" = lo agregó el usuario a mano. Además te llega "contexto": productos del mismo proveedor que se venden y NO están en la orden.

Tu trabajo: detectar lo que un comprador experto corregiría antes de mandar la orden. Por ejemplo, cantidades desproporcionadas contra lo que se vende, productos que se van a acabar y no están, pedidos que dejan demasiado inventario parado, cambios manuales que no cuadran, o algo que conviene juntar para completar el pedido al proveedor. No repitas el cálculo del sistema cuando está bien; solo señala lo que vale la pena revisar, de lo más importante a lo menos. Si la orden está bien, dilo y deja la lista de alertas vacía o casi vacía.

Escribe en español de México, directo y breve, como hablarías con el dueño. En cada alerta usa el sku exacto y, si propones otra cantidad, ponla en cantidad_sugerida.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['resumen', 'alertas'],
  properties: {
    resumen: { type: 'string', description: '1 a 3 frases con la opinión general de la orden.' },
    alertas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['sku', 'tipo', 'cantidad_sugerida', 'mensaje'],
        properties: {
          sku: { type: 'string' },
          tipo: { type: 'string', enum: ['subir', 'bajar', 'quitar', 'agregar', 'revisar'] },
          cantidad_sugerida: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
          mensaje: { type: 'string' }
        }
      }
    }
  }
};

// Verifica el token de Firebase del usuario con Google (identitytoolkit) y devuelve su correo.
async function verifiedEmail(idToken) {
  if (!idToken) return null;
  const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + CTD_FIREBASE_API_KEY, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  if (!r.ok) return null;
  const data = await r.json();
  const email = data && data.users && data.users[0] && String(data.users[0].email || '').toLowerCase();
  return ALLOWED_EMAILS.includes(email) ? email : null;
}

const num = (v) => (typeof v === 'number' && isFinite(v) ? Math.round(v * 100) / 100 : null);
const str = (v, n) => String(v == null ? '' : v).slice(0, n);

module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Falta configurar ANTHROPIC_API_KEY en Vercel.' });

  const idToken = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  let email = null;
  try { email = await verifiedEmail(idToken); } catch (e) { email = null; }
  if (!email) return res.status(401).json({ error: 'Sin acceso. Vuelve a entrar a la IA.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const order = body.order || {};
  const lines = (Array.isArray(order.lines) ? order.lines : []).slice(0, MAX_LINES).map((l) => ({
    sku: str(l.sku, 40), nombre: str(l.name, 120), proveedor: str(l.vendor, 80),
    qty: num(l.qty), sug: num(l.sug), stock: num(l.stock), rate: num(l.rate), cycle: num(l.cycle),
    ultima_compra: str(l.lastBuy, 10), manual: !!l.manual
  }));
  if (!lines.length) return res.status(400).json({ error: 'La orden está vacía.' });
  const context = (Array.isArray(body.context) ? body.context : []).slice(0, MAX_CONTEXT).map((l) => ({
    sku: str(l.sku, 40), nombre: str(l.name, 120), proveedor: str(l.vendor, 80),
    stock: num(l.stock), rate: num(l.rate), cycle: num(l.cycle)
  }));
  const params = { dias_entrega: num(order.lead), colchon_pct: num(order.safety), hoy: str(order.today, 10) };

  const userText = 'Revisa esta orden de compra.\n\n' + JSON.stringify({ parametros: params, orden: lines, contexto: context });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'server-side-fallback-2026-07-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 16000,
        fallbacks: 'default', // si Opus 5 declina, Anthropic reintenta con el modelo recomendado
        thinking: { type: 'adaptive' },
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
        system: SYSTEM,
        messages: [{ role: 'user', content: userText }]
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'Error de la API de Claude', detail: data && data.error ? data.error.message : r.status });
    if (data.stop_reason === 'refusal') return res.status(200).json({ error: 'Claude no pudo revisar esta orden. Inténtalo de nuevo.' });
    if (data.stop_reason === 'max_tokens') return res.status(200).json({ error: 'La respuesta salió incompleta. Inténtalo con menos productos.' });
    const block = (data.content || []).find((b) => b.type === 'text');
    let out = null;
    try { out = JSON.parse(block ? block.text : ''); } catch (e) { out = null; }
    if (!out || !Array.isArray(out.alertas)) return res.status(200).json({ error: 'No pude leer la revisión. Inténtalo de nuevo.' });
    return res.status(200).json({ resumen: out.resumen || '', alertas: out.alertas, modelo: data.model || MODEL });
  } catch (e) {
    return res.status(500).json({ error: 'Fallo revisando la orden', detail: String(e) });
  }
};

// Backend de /costeo: desglosa facturas escaneadas/foto con Claude Sonnet (visión).
// La API key vive en la variable de entorno ANTHROPIC_API_KEY de Vercel (nunca en el código).

const MODEL = 'claude-sonnet-4-6';   // buena lectura de escaneos
const MAX_IMAGES = 25;

const COSTEO_SYSTEM =
  'Eres un asistente que desglosa FACTURAS de proveedores de El Mexiquense Market (supermercado latino). ' +
  'Te doy la(s) imagen(es) de una factura (escaneada o foto). Extrae CADA renglón de producto. ' +
  'Devuelve SOLO un objeto JSON válido (sin markdown, sin texto adicional) con esta forma:\n' +
  '{"proveedor":"nombre o null","factura":"número o null","fecha":"fecha o null","moneda":"USD",' +
  '"items":[{"producto":"nombre","upc":"UPC o null","cantidad":cajas/unidades REALMENTE ENVIADAS o null,' +
  '"empaque":"pack size ej 12/12oz o null","costo_caja":precio del renglón (por caja/empaque) o null,' +
  '"costo_unidad":precio por unidad individual}],' +
  '"flete":cargo de flete/Freight/envío o null,"otros_cargos":cargo de servicio/handling o null,' +
  '"creditos":total de notas de crédito/credit memo/devoluciones (positivo) o null,"total_factura":total impreso (Invoice Total) o null}\n\n' +
  'REGLAS:\n' +
  '- FLETE/Freight/envío/shipping y cargos de servicio NO son productos: ponlos en "flete"/"otros_cargos", NUNCA como un renglón de items. ' +
  'Notas de crédito / Credit Memo / devoluciones van en "creditos" (número positivo), NO como items. El "total_factura" es el Invoice Total impreso (mercancía + flete).\n' +
  '- CANTIDAD = la ENVIADA (Shipped), NUNCA la ordenada. Muchas facturas traen una columna doble tipo "Qty Ord|Shp", "Ordered/Shipped" o "Ord | Shp": usa SIEMPRE el segundo número (lo enviado). ' +
  'Si lo enviado es 0 (o la columna "Total"/importe del renglón es 0 o está en blanco), ese producto NO se surtió: pon cantidad 0. Aun así incluye el renglón (con su costo por caja/unidad), pero con cantidad 0 para que el total cuadre.\n' +
  '- El total del renglón ("Total"/"Amount"/"Extended") = costo_caja × cantidad enviada. Si no cuadra, confía en la columna Total impresa y en la cantidad ENVIADA.\n' +
  '- costo_unidad = costo por PIEZA individual. Si la factura da precio por caja y el empaque es "12/...", costo_unidad = costo_caja / 12. ' +
  'Si es a granel / random weight (RW, por libra), costo_unidad = el precio por libra tal cual.\n' +
  '- Usa el UPC / código de barras del producto si aparece; NO el número de ítem interno del proveedor.\n' +
  '- Números como decimales (2.05, no "$2.05").\n' +
  '- Si un dato no está, pon null. NUNCA inventes precios ni UPC.\n' +
  '- Incluye TODOS los renglones de producto; NO incluyas encabezados, subtotales, impuestos ni fletes como si fueran productos.';

function extractJson(text) {
  if (!text) return null;
  let t = String(text).replace(/```json/gi, '').replace(/```/g, '').trim();
  const i = t.indexOf('{'), j = t.lastIndexOf('}');
  if (i < 0 || j < 0 || j < i) return null;
  try { return JSON.parse(t.slice(i, j + 1)); } catch (e) { return null; }
}

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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Falta configurar ANTHROPIC_API_KEY en Vercel.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  let images = Array.isArray(body.images) ? body.images : [];
  images = images.map(d => String(d || '').replace(/^data:[^,]+,/, '')).filter(Boolean).slice(0, MAX_IMAGES);
  if (!images.length) return res.status(400).json({ error: 'Falta la imagen de la factura.' });
  // Tope de tamaño total (anti-abuso): ~14 MB de base64.
  const totalBytes = images.reduce((a, d) => a + d.length, 0);
  if (totalBytes > 14 * 1024 * 1024) return res.status(413).json({ error: 'La factura es muy grande. Sube menos páginas o fotos más ligeras.' });

  const content = images.map(data => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } }));
  content.push({ type: 'text', text: 'Desglosa esta factura en JSON según las reglas. Incluye TODOS los renglones con su costo por unidad.' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 8000, system: COSTEO_SYSTEM, messages: [{ role: 'user', content }] }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'Error de la API de Claude', detail: data && data.error ? data.error.message : r.status });
    const text = (data.content && data.content[0] && data.content[0].text) ? data.content[0].text : '';
    const json = extractJson(text);
    if (!json || !Array.isArray(json.items)) {
      return res.status(200).json({ error: 'No pude leer la factura. Intenta una foto más clara y derecha.', raw: (text || '').slice(0, 200) });
    }
    // Reconciliación suave: suma de mercancía (costo_caja * cantidad) + flete - créditos vs total impreso
    let sum = 0;
    for (const it of json.items) {
      const c = typeof it.costo_caja === 'number' ? it.costo_caja : null;
      const q = typeof it.cantidad === 'number' ? it.cantidad : 1;
      if (c != null) sum += c * q;
    }
    const flete = typeof json.flete === 'number' ? json.flete : 0;
    const otros = typeof json.otros_cargos === 'number' ? json.otros_cargos : 0;
    const creditos = typeof json.creditos === 'number' ? json.creditos : 0;
    json.total_calculado = Math.round(sum * 100) / 100;                       // solo mercancía
    json.total_con_cargos = Math.round((sum + flete + otros - creditos) * 100) / 100; // mercancía + flete - créditos
    json.cuadra = (typeof json.total_factura === 'number')
      ? (Math.abs(json.total_factura - json.total_con_cargos) <= Math.max(1, json.total_factura * 0.03))
      : null;
    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: 'Fallo procesando la factura', detail: String(e) });
  }
};

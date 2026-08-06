// Backend de la IA de El Mexiquense (Vercel serverless function).
// La API key vive en la variable de entorno ANTHROPIC_API_KEY de Vercel
// (NUNCA en el código). El navegador nunca la ve.

const BASE = require('./_data/baseIA.json'); // [{n:nombre, u:upc, p:precio, c:costo?}]

const MODEL = 'claude-haiku-4-5';          // Q&A de precios (barato)
const LETRERO_MODEL = 'claude-sonnet-4-6'; // generación de letreros (más listo)
const MAX_MATCHES = 24;
const MAX_TURNS = 12;

// --- Búsqueda por palabras clave sobre la base ---
function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const STOP = new Set(['de','la','el','los','las','un','una','del','y','a','en','por','con','para',
  'cuanto','cuánto','cuesta','precio','costo','item','code','dame','que','qué','es','tiene','vale',
  'sale','su','cual','cuál','mi','tu','me','lo','le','ese','esa','esta','este','tienes','hay','busco','quiero']);

// --- Motor de match de UPC: los proveedores reportan el mismo producto con UPC
// distinto (AWG omite el dígito verificador y los ceros de adelante; hay guiones). ---
function upcDigits(u) { return String(u == null ? '' : u).replace(/\D/g, ''); }
function upcCore(u) { return upcDigits(u).replace(/^0+/, ''); }
function sameUpc(a, b) {
  const ca = upcCore(a), cb = upcCore(b);
  if (!ca || !cb) return false;
  if (ca === cb) return true;
  if (ca.length > 6 && ca === cb.slice(0, -1)) return true;  // b trae verificador, a no (AWG)
  if (cb.length > 6 && cb === ca.slice(0, -1)) return true;
  return false;
}
// Extrae un UPC candidato del texto (junta dígitos separados por - o espacio).
function extractUpc(text) {
  const cands = String(text || '').match(/\d[\d\s\-]{4,}\d/g) || [];
  let best = '';
  for (const c of cands) { const d = c.replace(/\D/g, ''); if (d.length >= 6 && d.length > best.length) best = d; }
  return best;
}

function searchBase(text) {
  const qn = normalize(text);
  const upcQ = extractUpc(text);
  // si viene un UPC, los dígitos ya los cubre el motor de UPC → no los uses como palabras
  const words = qn.split(' ').filter(w => w.length >= 2 && !STOP.has(w) && !(upcQ && /^\d+$/.test(w)));
  if (!words.length && !upcQ) return [];
  const scored = [];
  for (const it of BASE) {
    const name = normalize(it.n);
    const upc = it.u || '';
    const prov = normalize(it.s || '');
    const item = it.item ? String(it.item) : '';
    let score = 0;
    // match de UPC tolerante (recortado / con guión / estilo AWG)
    if (upcQ) {
      if (sameUpc(upcQ, upc)) score += 12;
      if (item && sameUpc(upcQ, item)) score += 12;
    }
    for (const w of words) {
      if (name.includes(w)) score += (name.startsWith(w) ? 3 : 2);
      if (upc && (upc === w || upc.includes(w))) score += 5;
      if (item && (item === w || item.includes(w))) score += 5;
      if (prov && prov.includes(w)) score += 2;
    }
    if (score > 0) scored.push([score, it]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  return scored.slice(0, MAX_MATCHES).map(s => s[1]);
}

// ================= LETREROS =================
function isLetreroRequest(text) {
  return /letrero|letreros|cartel|carteles|\bsign\b/i.test(text || '');
}

const CATALOGO_LETREROS = `
CARNICERIA (sub-etiqueta POR LIBRA): Camarón con Cabeza 200213 · Espaldilla 200022 · Diezmillo 200020 · Diezmillo Adobado 200020 · Tablita 200003 · Ribeye 200713 · Costilla Res 200002 · Hígado Res 200014 · Bistec Bola 200015 · Molida Res 200008 · Lomo Puerco 200108 · Molida Puerco 200107 · Trozos de Puerco 200102 · Costilla Puerco 200103 · Costilla Puerco Adobada 200743 · Chuleta Regular 200106 · Chuleta Ahumada 200105 · Bistec Pierna Adobado 200744 · Chorizo Puerco 200199 · Chorizo Centroamericano 200116 · Pork Bellies 200712 · Gallina 200420 · Pollo Entero 200402 · Piernita Pollo 200416 · Alita Normal 200412 · Alita Marinada 200780 · Bistec Pollo 200410 · Pechuga Pollo s/h 200408 · Milanesa Pollo Empanizado 200747 · Bagre 200210 · Jamón de Pavo 200320 · Jamón de Puerco 200321
PRODUCE (POR PIEZA o POR LIBRA según aplique): Tomate Roma 205051 · Tomatillo 205052 · Jalapeño 205032 · Serrano 205049 · Limón 205036000004
GROCERY (POR PIEZA): Harina Pan 5lb 854675005026 · Maseca 4.4lb 037297914475 · Doña Nita Rice 2lb 810118992704 · Doña Nita Rice 5lb 810118992728 · Goya Frijoles Negros 15.5oz 041331124669 · Goya Pinto Beans 041331124379 · La Costeña Chipotle 7oz 000007639700407 · La Costeña Pinto 19.75oz 000007639703100 · La Costeña Black Beans 40oz 000007639703575 · Knorr Chicken 40.5oz 048001012523 · Knorr Tomato 40.5oz 048001011571 · Foca Detergent 70.54oz 012005427577 · Palmolive Orange 058000311619 · Palmolive Original 035000990648 · Boing Guayaba 354ml 7501039400081 · Boing Mango 354ml 7501039400067 · Colombiana 1.5lt 850050430889 · Frescolita 2lt 85213900009 · Fress Kolita Soda 2lt 852139000099 · Raptor Sparkling Energy 081537204536 · Monster Energy 500ml 5060166698874 · Gatorade Orange 28oz 052000135145 · Mineragua Sparkling Water 12pk 090478230634 · Maltin Malta 7oz 6pk 087194000399 · Alpina Avena 33.8oz 083322052636 · Best Choice Water 24pk 070038613114 · Clamato Tomato 32oz 014800513240 · Clamato Picante 64oz 014800512762 · Goya Coconut Water 041331027878 · Refreshing Fruit Coconut Water 290ml 810118990182 · Goya Plantain Strips 041331049993 · Goya Masarica 4lb 041331050838 · Goya Cassava Yuca 5lb 041331090513 · La Finca Yuca 2lb 810118991844 · La Finca Yuca 4lb 810118991851 · La Finca Frijol Rojo 64oz 810118991370 · Gamesa Marias 15.2oz 686700085273 · Gamesa Marshmallow 15.52oz 686700101324 · Gamesa Saladitas 686700000085 · Gamesa Animalitos 686700032673 · Gamesa Surtido Rico 15.41oz 686700038965 · Yupi Yupis XXL 7703133008150 · Chamoy Mega 738545020626 · Sabritas Chile Lime 000008670067007 · Sabritas Japonés 000008670067008 · Sabritas Flamin Hot 000068670003009 · Sabritas Salt Lime 000068670067006 · Cantonesa Chao Mein 754842100083 · Pan Arepas Maiz Dulce 7702084550053 · Lala Crema Mexicana 24oz 819393021284 · FUD Crema Natural 645230087836 · FUD Hot Links 3lb 645230056245 · FUD Jalapeño Cheddar 2.6lb 645230056221 · Queso Fresco La Chona 12oz 616594506066 · La Chona Hot Chorizo 645230043283 · La Chona Mild Chorizo 645230043290 · Milk Magic 24 Straws 803810232889 · Kingsford Match Light 12lb 044600320946 · Kingsford Charcoal 8lb 044600320977 · Incaparina 15.9oz 081537300016 · Best Choice Egg 12ct 070038372806 · Best Choice Egg 18ct 070038372868 · Dolores Atún Agua 016101000764 · Dolores Atún Aceite 016101000740 · Ducales Crackers 047416029775 · Yummies Zambos Salsa Verde 5.46oz 750894610266 · Jutiquile Crema 14oz 896211002786 · Jutiquile Crema 24oz 896211003509 · Charras Tostadas de Maíz 11.46oz 756702133149 · Guadalupe Tostados Mantequilla 9.03oz 7705326075321 · Savoy Samba Chocolate 1.12oz 7591016173473 · Nestlé Coco Classic 15.87oz 7861091148704 · Inalecsa Bizcotelas 5.3oz 7861006722326 · Social Club 216g 7622201717568 · Caleñas Toto Roskas 2.11oz 7704547110170 · Rosquillas Caleñas Sugar Free 1.06oz 7704547120018
`;

const LETRERO_SYSTEM =
  'Eres el generador de letreros de precio de El Mexiquense Market. El usuario te pide letreros. ' +
  'Devuelve SOLO un objeto JSON válido (sin texto adicional, sin markdown, sin explicaciones). ' +
  'Sé COMPACTO para no cortar listas largas: la "note" debe ser BREVE (una sola línea); para UPC faltantes solo lista los nombres separados por coma, sin explicar cada uno. Genera TODOS los letreros pedidos aunque sean 30 o más.\n\n' +
  'FORMATO DE SALIDA:\n' +
  '{"letreros":[{"header":"PRECIO_MEXIQUENSE"|"MARKET"|"SEMANITA"|"TIEMPO_LIMITADO","product":"Nombre","price":"6.99","multi":""|"2 X"|"3 X"|"4 X"|"5 X","sublabel":"POR PIEZA"|"POR LIBRA"|"POR CAJA"|"TODOS LOS SABORES"|"","upc":"12345","date":""|"VALIDO DEL 4 AL 10 DE AGOSTO DE 2026","copies":1}],"note":"avisos de datos faltantes o UPC en blanco"}\n\n' +
  'Si FALTA un precio y no puedes deducirlo de las reglas, NO lo inventes: devuelve {"ask":"pregunta breve y específica"} en lugar de letreros.\n\n' +
  'REGLAS:\n' +
  '- Header: si dice "semanita"→SEMANITA (SIEMPRE con date). "precio mexiquense"→PRECIO_MEXIQUENSE (sin date). "market"/"mexiquense market"→MARKET (sin date). "tiempo limitado"→TIEMPO_LIMITADO (date opcional). Si no especifica, usa PRECIO_MEXIQUENSE.\n' +
  '- Sub-etiqueta según el catálogo: Carnicería→POR LIBRA, Grocery/abarrotes→POR PIEZA, cajas→POR CAJA, varios sabores→TODOS LOS SABORES.\n' +
  '- multi: si dice "2x6", "3 por 5", "5x1", etc → multi "2 X"/"3 X"/"5 X" y price = el precio total del combo (ej "2x$6"→ multi:"2 X", price:"6.00").\n' +
  '- UPC: tómalo del catálogo por nombre. Si no está y el usuario no lo da, deja "" y avísalo en note.\n' +
  '- date (SEMANITA/TIEMPO LIMITADO): si el usuario da fechas, formato "VALIDO DEL X AL X DE MES DE AÑO" en MAYÚSCULAS.\n' +
  '- copies: si pide "doble"→2, o el número de copias que indique.\n' +
  '- price siempre como número tipo "6.99" o "1.00" (sin símbolo $).\n\n' +
  'PRECIOS FIJOS (PRECIO MEXIQUENSE): Best Choice Water 24pk 3.49 · Clamato Tomato 32oz 3.99 · Clamato Picante 64oz 6.49 · Gatorade Orange 28oz 1.99 · Charras Tostadas 11.46oz 2.49 · Nestlé Cerelac 14.1oz 6.99.\n' +
  'EXCEPCIONES: Maseca 4.4lb 3.99 es precio regular (NO Semanita). Queso Fresco La Chona 12oz suele ir 2 x 6.00.\n\n' +
  'CATÁLOGO DE UPCs:' + CATALOGO_LETREROS;

function extractJson(text) {
  if (!text) return null;
  let t = String(text).replace(/```json/gi, '').replace(/```/g, '').trim();
  const i = t.indexOf('{'), j = t.lastIndexOf('}');
  if (i < 0 || j < 0 || j < i) return null;
  try { return JSON.parse(t.slice(i, j + 1)); } catch (e) { return null; }
}

async function handleLetreros(res, apiKey, history) {
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: LETRERO_MODEL, max_tokens: 16000, system: LETRERO_SYSTEM, messages: history }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'Error de la API de Claude', detail: data && data.error ? data.error.message : r.status });
    const text = (data.content && data.content[0] && data.content[0].text) ? data.content[0].text : '';
    const json = extractJson(text);
    if (json && Array.isArray(json.letreros) && json.letreros.length) {
      return res.status(200).json({ letreros: json.letreros, note: json.note || '' });
    }
    if (json && json.ask) return res.status(200).json({ answer: json.ask });
    return res.status(200).json({ answer: text || 'Necesito el producto y el precio para hacer el letrero.' });
  } catch (e) {
    return res.status(500).json({ error: 'Fallo generando letreros', detail: String(e) });
  }
}

// ================= HANDLER =================
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

  let history = Array.isArray(body.history) ? body.history : [];
  history = history
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.slice(0, 1200) }));
  if (!history.length && body.question) history = [{ role: 'user', content: String(body.question).slice(0, 500) }];
  if (!history.length) return res.status(400).json({ error: 'Falta la pregunta.' });
  if (history[history.length - 1].role !== 'user') return res.status(400).json({ error: 'El último mensaje debe ser del usuario.' });
  history = history.slice(-MAX_TURNS);

  const lastUser = history[history.length - 1].content;

  // Si piden letreros → flujo de generación de letreros
  if (isLetreroRequest(lastUser)) {
    return handleLetreros(res, apiKey, history);
  }

  // Si no → Q&A de precios/costos/UPC sobre la base
  const recentUser = history.filter(m => m.role === 'user').slice(-3).map(m => m.content).join(' ');
  const matches = searchBase(recentUser);

  const lines = matches.map(it => {
    let s = `- ${it.n}`;
    if (it.item) s += ` | Item code: ${it.item}`;
    if (it.u) s += ` | UPC: ${it.u}`;
    if (it.size) s += ` | Tamaño: ${it.size}`;
    const provs = (it.provs && typeof it.provs === 'object') ? Object.entries(it.provs).filter(e => e[1] != null) : [];
    if (provs.length) {
      provs.sort((a, b) => a[1] - b[1]);
      const cheap = provs[0];
      s += ` | Costo más barato: $${cheap[1]} (${cheap[0]})`;
      s += ` | Proveedores: ${provs.map(([k, v]) => `${k} $${v}`).join(', ')}`;
    } else {
      if (it.c) s += ` | Costo: $${it.c}`;
      if (it.s) s += ` | Proveedor: ${it.s}`;
    }
    if (it.p) s += ` | Precio: $${it.p}`;
    return s;
  });
  const contexto = lines.length ? lines.join('\n') : '(No se encontraron productos que coincidan.)';

  const totalStr = BASE.length.toLocaleString('es-MX');
  const system =
    'Eres el asistente virtual de El Mexiquense Market, un supermercado latino. ' +
    'Respondes en español, breve y amable.\n' +
    'TU CATÁLOGO: tienes acceso a una base con más de ' + totalStr + ' productos de la tienda (precios, costos y UPC). ' +
    'Por cada pregunta, un buscador te muestra abajo SOLO los productos que coinciden con lo que preguntó el usuario — NO es toda tu base, es un resultado de búsqueda. ' +
    'NUNCA digas que "solo tienes X productos", ni que "no tienes acceso a la lista", ni cuentes cuántos productos hay: sí tienes el catálogo completo, solo que buscas por nombre o UPC en cada consulta. ' +
    'Si te piden un conteo total o "toda la lista", explica que puedes buscar cualquier producto por su nombre o código y pídele que te diga cuál necesita.\n' +
    'Muchos productos traen "Item code" (número de ítem de la tienda/AWG): si preguntan "¿cuál es el item code / número de ítem de X?" o "dame el item de X", dáselos. ' +
    'UPC: los proveedores escriben el mismo UPC de forma distinta (AWG omite el último dígito verificador y los ceros de adelante; a veces traen guión). El buscador YA hace ese emparejamiento: si te muestra un producto para el UPC que preguntaron (aunque tenga más/menos dígitos o guión), ES ese producto — contéstalo con CONFIANZA, NO digas "no coincide exactamente". ' +
    'IMPORTANTE — mantén el hilo de la conversación: si el usuario pregunta "¿cuál es su UPC?", "¿su item code?", "¿y el costo?", "¿en cuánto sale?", etc., se refiere al ÚLTIMO producto del que se habló; NO vuelvas a preguntar cuál producto es. ' +
    'Para dar precios/costos/UPC usa ÚNICAMENTE los datos de la lista de abajo. ' +
    'Si un producto no aparece en los resultados de abajo, NO digas que no existe: pide que lo escriban con otras palabras o revisen el nombre exacto. ' +
    'Si el dato pedido (costo, precio o UPC) de un producto que SÍ aparece no está, dilo y sugiere revisarlo en el sistema. ' +
    'Muchos productos traen varios "Proveedores" con su precio cada uno. Si preguntan "¿dónde está más barato X?", "¿quién lo tiene más barato?" o "¿cuánto cuesta X con cada proveedor?": di cuál es el MÁS BARATO y su precio, y lista todos los proveedores con su precio (de menor a mayor). Si solo hay un proveedor, dilo. Si preguntan "¿quién surte X?" o "¿qué vende AWG?", usa esos datos. Si un producto no trae proveedor, dilo. ' +
    'El costo mostrado es el más reciente (cambios de costo de proveedor de 2026). ' +
    'Nunca inventes precios, costos, UPC ni proveedores.\n\n' +
    'RESULTADOS DE BÚSQUEDA PARA ESTA PREGUNTA (no es toda tu base):\n' + contexto;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 700, system, messages: history }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'Error de la API de Claude', detail: data && data.error ? data.error.message : r.status });
    const answer = (data.content && data.content[0] && data.content[0].text) ? data.content[0].text : 'No pude generar una respuesta.';
    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(500).json({ error: 'Fallo al contactar a Claude', detail: String(e) });
  }
};

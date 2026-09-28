// Puente de imágenes para el PDF de especiales de CTD (centraltradedist.com/IA).
// Las fotos de productos viven en el S3 de InSitu, que no manda CORS; sin esto el
// navegador no puede meterlas a un PDF. SOLO acepta fotos de ese bucket (no es un proxy abierto).

const ALLOWED_HOSTS = ['insitusales.s3.us-east-1.amazonaws.com', 'insitusales.s3.amazonaws.com'];
const ALLOWED_ORIGINS = ['https://www.centraltradedist.com', 'https://centraltradedist.com'];
const MAX_BYTES = 6 * 1024 * 1024;

function sniff(b) {
  if (b.length < 12) return null;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.slice(0, 4).toString() === 'GIF8') return 'image/gif';
  if (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}

module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  let url;
  try { url = new URL(String(req.query.u || '')); } catch (e) { return res.status(400).end(); }
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.includes(url.hostname)) return res.status(403).end();

  try {
    const r = await fetch(url.toString(), { redirect: 'error' });
    if (!r.ok) return res.status(r.status === 404 ? 404 : 502).end();
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX_BYTES) return res.status(413).end();
    const type = sniff(buf); // no confiar en el content-type del bucket: algunas fotos vienen sin extensión
    if (!type) return res.status(415).end();
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(502).end();
  }
};

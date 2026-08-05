// Renderizador de letreros El Mexiquense con jsPDF (funciona igual en Node y navegador).
// Exporta buildLetrerosDoc(letreros) -> instancia jsPDF.

function makeBuilder(jsPDF) {
  // Colores por tipo de header
  const THEMES = {
    PRECIO_MEXIQUENSE: { band: [176, 16, 28], border: [176, 16, 28], gold: [240, 198, 74], text: [255, 255, 255], gold_on: true },
    MARKET:            { band: [176, 16, 28], border: [176, 16, 28], gold: [240, 198, 74], text: [255, 255, 255], gold_on: true },
    SEMANITA:          { band: [0, 192, 163], border: [0, 192, 163], gold: null, text: [255, 255, 255], gold_on: false },
    TIEMPO_LIMITADO:   { band: [255, 222, 33], border: [212, 179, 20], gold: null, text: [20, 20, 20], gold_on: false },
  };
  const HEADER_TEXT = {
    PRECIO_MEXIQUENSE: 'PRECIO MEXIQUENSE',
    MARKET: 'MEXIQUENSE MARKET',
    SEMANITA: 'SEMANITA DEL AHORRO',
    TIEMPO_LIMITADO: 'TIEMPO LIMITADO',
  };
  const MULTI_RED = [212, 43, 10];

  function drawLetrero(doc, oy, d) {
    const theme = THEMES[d.header] || THEMES.PRECIO_MEXIQUENSE;
    const W = 612, H = 396;         // media carta
    const M = 22;                    // margen exterior
    const bx = M, by = oy + M, bw = W - 2 * M, bh = H - 2 * M;

    // Borde redondeado exterior (color del header)
    doc.setDrawColor.apply(doc, theme.border);
    doc.setLineWidth(2.2);
    doc.roundedRect(bx, by, bw, bh, 12, 12, 'S');

    // --- Header band ---
    const hx = bx + 12, hy = by + 12, hw = bw - 24, hh = 58;
    doc.setFillColor.apply(doc, theme.band);
    if (theme.gold_on) { doc.setDrawColor.apply(doc, theme.gold); doc.setLineWidth(3); }
    else { doc.setDrawColor.apply(doc, theme.band); doc.setLineWidth(0.1); }
    doc.roundedRect(hx, hy, hw, hh, 7, 7, theme.gold_on ? 'FD' : 'F');
    // texto del header, auto-size centrado
    const htxt = HEADER_TEXT[d.header] || '';
    let hfs = 34;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(hfs);
    while (doc.getTextWidth(htxt) > hw - 30 && hfs > 12) { hfs -= 1; doc.setFontSize(hfs); }
    doc.setTextColor.apply(doc, theme.text);
    doc.text(htxt, hx + hw / 2, hy + hh / 2 + hfs * 0.35, { align: 'center' });

    // Zona de contenido debajo del header
    const contentTop = hy + hh + 6;
    const footY = by + bh - 14;           // pie
    const leftX = bx + 22;

    // --- Sub-etiqueta (píldora) + UPC (pie izquierdo) ---
    let pillBottom = footY;
    if (d.sublabel) {
      doc.setFont('helvetica', 'bold');
      const pfs = 12;
      doc.setFontSize(pfs);
      const label = d.sublabel.toUpperCase();
      const tw = doc.getTextWidth(label);
      const padX = 10, pillH = 20;
      const upcH = d.upc ? 14 : 0;
      const pillY = footY - upcH - pillH;
      doc.setFillColor.apply(doc, theme.band);
      doc.roundedRect(leftX, pillY, tw + padX * 2, pillH, 4, 4, 'F');
      doc.setTextColor.apply(doc, d.header === 'TIEMPO_LIMITADO' ? [20,20,20] : [255,255,255]);
      doc.text(label, leftX + padX, pillY + pillH / 2 + pfs * 0.35, { align: 'left' });
      pillBottom = pillY;
    }
    if (d.upc) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text(String(d.upc), leftX, footY, { align: 'left' });
    }

    // --- Fecha (pie centrado) para SEMANITA / TIEMPO LIMITADO ---
    if (d.date) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      doc.text(String(d.date).toUpperCase(), bx + bw / 2, footY, { align: 'center' });
    }

    // --- Nombre del producto (izquierda, auto-size, hasta 3 líneas) ---
    const nameMaxW = bw * 0.52;
    const nameZoneTop = contentTop + 6;
    const nameZoneBottom = (d.sublabel ? pillBottom : footY) - 8;
    const nameWords = String(d.product || '').split(/\s+/).filter(Boolean);
    let nfs = 58;
    let lines;
    doc.setFont('helvetica', 'bold');
    while (nfs > 12) {
      doc.setFontSize(nfs);
      // la palabra MÁS ANCHA debe caber completa (nunca partir una palabra a la mitad)
      let maxWordW = 0;
      for (const w of nameWords) { const ww = doc.getTextWidth(w); if (ww > maxWordW) maxWordW = ww; }
      lines = doc.splitTextToSize(String(d.product || ''), nameMaxW);
      const lineH = nfs * 1.05;
      const totalH = lines.length * lineH;
      if (maxWordW <= nameMaxW && lines.length <= 3 && totalH <= (nameZoneBottom - nameZoneTop)) break;
      nfs -= 2;
    }
    doc.setFontSize(nfs);
    doc.setTextColor(15, 15, 15);
    const lineH = nfs * 1.05;
    const blockH = lines.length * lineH;
    let ty = (nameZoneTop + nameZoneBottom) / 2 - blockH / 2 + nfs * 0.8;
    for (const ln of lines) { doc.text(ln, leftX, ty, { align: 'left' }); ty += lineH; }

    // --- Precio (derecha, con $ y centavos en superíndice) ---
    const rightX = bx + bw - 24;         // borde derecho del precio
    const priceStr = String(d.price || '').replace('$', '').trim();
    let intPart = priceStr, cents = '';
    if (priceStr.indexOf('.') > -1) { const p = priceStr.split('.'); intPart = p[0]; cents = (p[1] + '00').slice(0, 2); }
    // multi-unidad (ej "5 X") arriba a la derecha
    let priceTop = contentTop + 18;
    if (d.multi) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(34);
      doc.setTextColor.apply(doc, MULTI_RED);
      doc.text(String(d.multi).toUpperCase(), rightX, priceTop + 24, { align: 'right' });
      priceTop += 42;
    }
    // tamaño del entero (auto-reduce si es muy ancho)
    let bigFs = 96;
    const supFs0 = () => Math.round(bigFs * 0.42);
    doc.setFont('helvetica', 'bold');
    function priceWidth() {
      doc.setFontSize(bigFs); const wi = doc.getTextWidth(intPart);
      doc.setFontSize(supFs0()); const wd = doc.getTextWidth('$') + (cents ? doc.getTextWidth(cents) : 0);
      return wi + wd + 8;
    }
    while (priceWidth() > bw * 0.52 && bigFs > 40) bigFs -= 4;
    const supFs = supFs0();
    // baseline del entero
    const priceBaseY = (nameZoneTop + nameZoneBottom) / 2 + bigFs * 0.32;
    doc.setTextColor(15, 15, 15);
    // medir anchos
    doc.setFontSize(bigFs); const wInt = doc.getTextWidth(intPart);
    doc.setFontSize(supFs); const wCents = cents ? doc.getTextWidth(cents) : 0;
    const wDollar = doc.getTextWidth('$');
    // colocar: [$][int][cents] alineado a la derecha
    const centsX = rightX;
    const intRightX = rightX - wCents - 2;
    const intLeftX = intRightX - wInt;
    const dollarX = intLeftX - wDollar - 2;
    const supY = priceBaseY - bigFs * 0.55;   // superíndices arriba
    // $
    doc.setFontSize(supFs); doc.text('$', dollarX, supY, { align: 'left' });
    // entero
    doc.setFontSize(bigFs); doc.text(intPart, intLeftX, priceBaseY, { align: 'left' });
    // centavos
    if (cents) { doc.setFontSize(supFs); doc.text(cents, intRightX + 2, supY, { align: 'left' }); }
  }

  function buildLetrerosDoc(letreros) {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    // expandir copias
    const list = [];
    for (const L of letreros) { const n = Math.max(1, parseInt(L.copies || 1, 10) || 1); for (let i = 0; i < n; i++) list.push(L); }
    for (let i = 0; i < list.length; i++) {
      const slot = i % 2;               // 0 arriba, 1 abajo
      if (i > 0 && slot === 0) doc.addPage();
      const oy = slot === 0 ? 0 : 396;
      drawLetrero(doc, oy, list[i]);
      // línea de corte punteada al centro de la hoja (después de dibujar el de arriba)
      if (slot === 0) {
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(1);
        doc.setLineDashPattern([4, 4], 0);
        doc.line(20, 396, 592, 396);
        doc.setLineDashPattern([], 0);
      }
    }
    return doc;
  }

  return { buildLetrerosDoc };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { makeBuilder };

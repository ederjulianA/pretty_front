import { useCallback } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import { formatValue } from '../utils';
import { formatDate } from '../utils/dateUtils';
import { API_URL } from '../config';
import logoBase64 from '../assets/prettyLogo1.png';

const PINK       = [245, 142, 163];
const DARK       = [40, 40, 40];
const GRAY       = [110, 110, 110];
const LIGHT_GRAY = [230, 230, 230];
const MARGIN     = 20;
const FOOTER_HEIGHT = 20;

// ─── Utilidades ────────────────────────────────────────────────────────────────

const addDays = (dateStr, days) => {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const numberToWords = (n) => {
  const num = Math.round(n);
  if (num === 0) return 'Cero pesos m/cte.';

  const ones = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
    'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete',
    'dieciocho', 'diecinueve'];
  const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
    'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  const convertGroup = (g) => {
    if (g === 0) return '';
    if (g === 100) return 'cien';
    let r = '';
    const h = Math.floor(g / 100);
    const rem = g % 100;
    if (h > 0) r += hundreds[h] + (rem > 0 ? ' ' : '');
    if (rem > 0 && rem < 20) {
      r += ones[rem];
    } else if (rem >= 20) {
      const t = Math.floor(rem / 10);
      const o = rem % 10;
      r += tens[t] + (o > 0 ? ' y ' + ones[o] : '');
    }
    return r;
  };

  const billions  = Math.floor(num / 1_000_000_000);
  const millions  = Math.floor((num % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((num % 1_000_000) / 1_000);
  const remainder = num % 1_000;

  let result = '';
  if (billions  > 0) result += convertGroup(billions)  + (billions  === 1 ? ' mil millón'  : ' mil millones')  + ' ';
  if (millions  > 0) result += convertGroup(millions)  + (millions  === 1 ? ' millón'       : ' millones')      + ' ';
  if (thousands > 0) result += (thousands === 1 ? 'mil' : convertGroup(thousands) + ' mil') + ' ';
  if (remainder > 0) result += convertGroup(remainder);

  const cap = result.trim();
  return cap.charAt(0).toUpperCase() + cap.slice(1) + ' pesos m/cte.';
};

// ─── Helpers de dibujo ─────────────────────────────────────────────────────────

// Retorna la Y de la línea divisoria para que el contenido se posicione dinámicamente
const drawHeader = (doc, header, pageWidth, tipo) => {
  const esCotizacion = tipo === 'COT';
  const top = 8;

  // ── Bloque izquierdo: logo + datos fiscales ──────────────────────────────
  const logoW = 42;
  const logoH = 18;
  doc.addImage(logoBase64, 'PNG', MARGIN, top, logoW, logoH);

  const fiscal = [
    'PrettyMakeup COL · Laura Álvarez',
    'NIT 1.098.747.037-6 · No responsable de IVA',
    'Cra 24 #51-48, Sotomayor — Bucaramanga, Colombia',
    'Pedidos: 321 420 7398',
  ];
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  const fiscalStartY = top + logoH + 5;
  fiscal.forEach((line, i) => doc.text(line, MARGIN, fiscalStartY + i * 4));
  const leftBottomY = fiscalStartY + fiscal.length * 4;

  // ── Bloque derecho: título + metadatos ──────────────────────────────────
  const rightX = pageWidth - MARGIN;

  // Título condicional según tipo
  const tituloL1 = esCotizacion ? 'Cotización' : 'Comprobante';
  const tituloL2 = 'de venta';
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(22);
  doc.setTextColor(...PINK);
  doc.text(tituloL1, rightX, top + 9,  { align: 'right' });
  doc.text(tituloL2, rightX, top + 19, { align: 'right' });

  // Metadatos: N° y Fecha siempre presentes; VÁLIDA HASTA solo en COT
  const lineH     = 5.5;
  const metaW     = 72;
  const metaLeft  = rightX - metaW;
  const metaStartY = top + 27;

  const metaRows = [
    { label: 'N°',    value: header.fac_nro || '' },
    { label: 'FECHA', value: formatDate(header.fac_fec) },
    ...(esCotizacion
      ? [{ label: 'VÁLIDA HASTA', value: formatDate(addDays(header.fac_fec, 14)) }]
      : []
    ),
  ];

  metaRows.forEach(({ label, value }, i) => {
    const y = metaStartY + i * lineH;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(label, metaLeft, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...DARK);
    doc.text(value, rightX, y, { align: 'right' });
  });

  const rightBottomY = metaStartY + metaRows.length * lineH;

  // ── Línea divisoria rosada — siempre debajo del bloque más largo ─────────
  const dividerY = Math.max(leftBottomY, rightBottomY) + 3;
  doc.setDrawColor(...PINK);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, dividerY, pageWidth - MARGIN, dividerY);

  return dividerY;
};

const drawFooter = (doc, pageWidth, pageHeight) => {
  const y = pageHeight - FOOTER_HEIGHT + 2;

  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);

  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(7.5);
  doc.setTextColor(...PINK);
  doc.text('PrettyMakeup COL', MARGIN, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(' · Bucaramanga, Santander', MARGIN + 26, y + 5);

  doc.setFontSize(6.5);
  doc.text('@prettymakeup.col  ·  WhatsApp 321 420 7398  ·  prettymakeup.col@gmail.com', MARGIN, y + 10);
  doc.text(
    'Documento de carácter informativo · No equivale a factura de venta · Generado por software administrativo MiPunto',
    MARGIN, y + 14.5
  );
};

const drawClientSection = (doc, header, pageWidth, startY) => {
  const contentW = pageWidth - MARGIN * 2;
  const BOX_H    = 34;

  doc.setFillColor(247, 247, 247);
  doc.rect(MARGIN, startY, contentW, BOX_H, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY);
  doc.text('CLIENTE', MARGIN + 4, startY + 5.5);

  const colX   = [MARGIN + 4, MARGIN + 70, MARGIN + 118, MARGIN + 148];
  const labels = ['RAZÓN SOCIAL', 'IDENTIFICACIÓN', 'TELÉFONO', 'CIUDAD'];
  const values = [
    header.nit_nom || '',
    header.nit_ide || '',
    header.nit_tel || '',
    header.ciu_nom || '',
  ];
  const maxW = [62, 44, 26, 32];

  const labelY = startY + 11;
  const valueY = startY + 17;

  labels.forEach((lbl, i) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text(lbl, colX[i], labelY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(values[i], maxW[i]);
    doc.text(lines[0] || '', colX[i], valueY);
  });

  const dirLabelY = startY + 24;
  const dirValueY = startY + 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY);
  doc.text('DIRECCIÓN', colX[0], dirLabelY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  const dirLines = doc.splitTextToSize(header.nit_dir || '', contentW - 10);
  doc.text(dirLines[0] || '', colX[0], dirValueY);
};

// ─── Hook principal ────────────────────────────────────────────────────────────

const usePrintCotizacion = () => {
  // tipo: 'COT' → Cotización de venta | 'VTA' → Comprobante de venta
  const printCotizacion = useCallback(async (fac_nro, tipo = 'COT') => {
    try {
      const esCotizacion = tipo === 'COT';
      const token = localStorage.getItem('pedidos_pretty_token');

      const [orderRes, pagoRes] = await Promise.all([
        axios.get(`${API_URL}/order/${fac_nro}`,                        { headers: { 'x-access-token': token } }),
        axios.get(`${API_URL}/parametros/datos-pago-cotizacion`,         { headers: { 'x-access-token': token } }),
      ]);

      if (!orderRes.data.success) {
        console.error('Error al obtener pedido:', orderRes.data);
        return;
      }

      const { header, details } = orderRes.data.order;
      const datosPago = pagoRes.data?.success ? pagoRes.data.data : null;

      // ── Totales ────────────────────────────────────────────────────────────
      const subtotal        = details.reduce((acc, d) => acc + d.kar_pre_pub * d.kar_uni, 0);
      const descuentoLineas = details.reduce((acc, d) => acc + d.kar_pre_pub * d.kar_uni * (d.kar_des_uno / 100), 0);
      const descuentoGeneral = parseFloat(header.fac_descuento_general || 0);
      const totalFinal      = subtotal - descuentoLineas - descuentoGeneral;
      const tieneBundles    = details.some((d) => d.es_componente_bundle === 1 || d.es_componente_bundle === true);

      // ── Documento ─────────────────────────────────────────────────────────
      const doc       = new jsPDF({ format: 'letter', unit: 'mm' });
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Dibujar header + footer p.1 antes de autoTable para obtener dividerY real
      const dividerY = drawHeader(doc, header, pageWidth, tipo);
      drawFooter(doc, pageWidth, pageHeight);
      const clientSectionTop = dividerY + 3;
      const clientSectionH   = 38;
      drawClientSection(doc, header, pageWidth, clientSectionTop);
      const tableStartY = clientSectionTop + clientSectionH;

      // ── Filas de la tabla ──────────────────────────────────────────────────
      const tableRows = details.map((item) => {
        const esCortesia = item.es_componente_bundle === 1 || item.es_componente_bundle === true;
        return {
          cod:      item.art_cod,
          nom:      item.art_nom,
          esCortesia,
          cant:     String(item.kar_uni),
          precio:   esCortesia ? '—' : formatValue(item.kar_pre_pub),
          dto:      `${item.kar_des_uno}%`,
          total:    esCortesia
            ? '0'
            : formatValue(item.kar_total ?? item.kar_pre_pub * item.kar_uni * (1 - item.kar_des_uno / 100)),
        };
      });

      // ── autoTable ─────────────────────────────────────────────────────────
      doc.autoTable({
        startY: tableStartY,
        head: [[
          { content: 'CÓDIGO',     styles: { halign: 'center' } },
          { content: 'ARTÍCULO',   styles: { halign: 'left'   } },
          { content: 'CANT.',      styles: { halign: 'center' } },
          { content: 'VLR. UNIT.', styles: { halign: 'right'  } },
          { content: '% DTO.',     styles: { halign: 'center' } },
          { content: 'TOTAL',      styles: { halign: 'right'  } },
        ]],
        body: tableRows.map((r) => [
          r.cod,
          r.esCortesia ? `${r.nom}\n[INCLUÍDO]` : r.nom,
          r.cant,
          r.precio,
          r.dto,
          r.total,
        ]),
        theme: 'grid',
        styles: {
          fontSize:    8,
          cellPadding: 2.5,
          lineColor:   [225, 225, 225],
          lineWidth:   0.15,
          textColor:   DARK,
          font:        'helvetica',
          overflow:    'linebreak',
        },
        headStyles: {
          fillColor: PINK,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize:  7.5,
        },
        columnStyles: {
          0: { cellWidth: 18, halign: 'center' },
          1: { cellWidth: 72, halign: 'left'   },
          2: { cellWidth: 14, halign: 'center' },
          3: { cellWidth: 26, halign: 'right'  },
          4: { cellWidth: 16, halign: 'center' },
          5: { cellWidth: 26, halign: 'right'  },
        },
        margin: { left: MARGIN, right: MARGIN, top: dividerY + 6, bottom: FOOTER_HEIGHT + 6 },
        willDrawCell: (data) => {
          if (data.section === 'body' && tableRows[data.row.index]?.esCortesia) {
            if (data.column.index === 5) {
              data.cell.styles.fontStyle = 'italic';
              data.cell.styles.textColor = GRAY;
            }
          }
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            const row = tableRows[data.row.index];
            if (row?.esCortesia) {
              const bx = data.cell.x + 1;
              const bw = 18;
              const bh = 4.5;
              const by = data.cell.y + data.cell.height - bh - 1;
              doc.setFillColor(...PINK);
              doc.roundedRect(bx, by, bw, bh, 1, 1, 'F');
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(5.5);
              doc.setTextColor(255, 255, 255);
              doc.text('INCLUÍDO', bx + bw / 2, by + 3.2, { align: 'center' });
            }
          }
        },
        didDrawPage: (data) => {
          // p.1 ya tiene header/footer dibujados antes del autoTable
          if (data.pageNumber > 1) {
            drawHeader(doc, header, pageWidth, tipo);
            drawFooter(doc, pageWidth, pageHeight);
          }
        },
      });

      // ── Secciones finales ──────────────────────────────────────────────────
      let finalY = doc.lastAutoTable.finalY + 6;

      if (finalY + 88 > pageHeight - FOOTER_HEIGHT - 4) {
        doc.addPage();
        drawHeader(doc, header, pageWidth, tipo);
        drawFooter(doc, pageWidth, pageHeight);
        finalY = dividerY + 6;
      }

      const contentW = pageWidth - MARGIN * 2;

      doc.setDrawColor(...LIGHT_GRAY);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, finalY, pageWidth - MARGIN, finalY);
      finalY += 6;

      // ── Observaciones (izquierda) — solo en COT ────────────────────────────
      const obsMaxW = contentW * 0.50;
      let obsY = finalY;

      if (esCotizacion) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.text('OBSERVACIONES', MARGIN, finalY);

        obsY = finalY + 5;
        const obsTextFijo = doc.splitTextToSize(
          'Cotización válida por 14 días calendario. Los precios pueden variar sin previo aviso una vez vencido este término. Productos sujetos a disponibilidad de inventario al momento de confirmar el pedido.',
          obsMaxW
        );
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK);
        obsTextFijo.forEach((line) => { doc.text(line, MARGIN, obsY); obsY += 4.2; });

        if (header.fac_obs) {
          obsY += 2;
          const obsLines = doc.splitTextToSize(header.fac_obs, obsMaxW);
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...DARK);
          obsLines.forEach((line) => { doc.text(line, MARGIN, obsY); obsY += 4.2; });
        }

        // Nota de cortesía solo si la cotización tiene bundles
        if (tieneBundles) {
          obsY += 2;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(...GRAY);
          const bundleLines = doc.splitTextToSize(
            'Los artículos marcados como incluídos se entregan sin costo adicional como parte de la promoción. No se aceptan cambios sobre estos productos.',
            obsMaxW
          );
          bundleLines.forEach((line) => { doc.text(line, MARGIN, obsY); obsY += 4.2; });
        }
      }

      // ── Box de totales (derecha) ───────────────────────────────────────────
      const totW  = contentW * 0.42;
      const totX  = pageWidth - MARGIN - totW;
      const totRows = [
        { label: 'Subtotal',  value: `$${formatValue(subtotal)}` },
        { label: 'Descuento', value: `$${formatValue(descuentoLineas + descuentoGeneral)}` },
      ];
      if (descuentoGeneral > 0) {
        totRows.push({ label: 'Desc. evento', value: `$${formatValue(descuentoGeneral)}` });
      }
      totRows.push({ label: 'IVA', value: 'No aplica' });

      const totBoxH = totRows.length * 7 + 20;
      doc.setFillColor(247, 247, 247);
      doc.roundedRect(totX - 2, finalY - 2, totW + 2, totBoxH, 2, 2, 'F');

      const labelCol = totX + totW - 38;
      const valueCol = totX + totW - 2;
      let totY       = finalY + 6;
      const rowGap   = 7;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      totRows.forEach(({ label, value }) => {
        doc.text(label, labelCol, totY, { align: 'right' });
        doc.text(value, valueCol, totY, { align: 'right' });
        totY += rowGap;
      });

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(totX, totY - 3, totX + totW, totY - 3);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text('Total a pagar', labelCol, totY, { align: 'right' });
      doc.setFontSize(12);
      doc.setTextColor(...PINK);
      doc.text(`$${formatValue(totalFinal)}`, valueCol, totY, { align: 'right' });

      totY += 5;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      const enLetras      = numberToWords(totalFinal);
      const palabrasLines = doc.splitTextToSize(enLetras, totW - 2);
      doc.text(palabrasLines, valueCol, totY, { align: 'right' });

      // ── Datos para pago (siempre, en ambos tipos) ──────────────────────────
      const pagoTop = Math.max(obsY, totY + palabrasLines.length * 4.2) + 8;

      doc.setDrawColor(...LIGHT_GRAY);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, pagoTop - 4, pageWidth - MARGIN, pagoTop - 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text('DATOS PARA PAGO', MARGIN, pagoTop);

      const pagoBoxY = pagoTop + 4;
      const pagoBoxH = 30;
      doc.setFillColor(247, 247, 247);
      doc.rect(MARGIN, pagoBoxY, contentW, pagoBoxH, 'F');

      if (datosPago) {
        const colW = contentW / 3;
        const pagoColsConfig = [
          { key: 'bancolombia', label: 'BANCOLOMBIA · AHORROS', x: MARGIN + 4 },
          { key: 'nequi',       label: 'NEQUI',                 x: MARGIN + colW + 4 },
          { key: 'epayco',      label: 'PAGO EN LÍNEA · PSE',   x: MARGIN + colW * 2 + 4 },
        ];
        const instrMaxW = colW - 10;

        pagoColsConfig.forEach(({ key, label, x }) => {
          const info = datosPago[key];
          if (!info) return;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(...GRAY);
          doc.text(label, x, pagoBoxY + 7);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(...DARK);
          doc.text(info.numero || '', x, pagoBoxY + 15);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(...GRAY);
          const instrText  = (info.titular || info.instruccion || '').toUpperCase();
          const instrLines = doc.splitTextToSize(instrText, instrMaxW);
          instrLines.forEach((line, i) => {
            doc.text(line, x, pagoBoxY + 21 + i * 4);
          });
        });
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...GRAY);
        doc.text('Comuníquese con nosotros para información de pago: 321 420 7398', MARGIN + 4, pagoBoxY + 15);
      }

      // ── Descarga ───────────────────────────────────────────────────────────
      const now    = new Date();
      const pad    = (n) => String(n).padStart(2, '0');
      const prefix = esCotizacion ? 'cotizacion' : 'comprobante';
      doc.save(`${prefix}_prettymakeup_${fac_nro}_${pad(now.getDate())}_${pad(now.getMonth() + 1)}_${now.getFullYear()}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
    }
  }, []);

  return { printCotizacion };
};

export default usePrintCotizacion;

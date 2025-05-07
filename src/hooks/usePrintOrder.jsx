// src/hooks/usePrintOrder.js
import { useCallback } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import { formatValue, formatName } from '../utils';
import { formatDate } from '../utils/dateUtils';
import { API_URL } from '../config';
import logoBase64 from '../assets/prettyLogo1.png'; // Asegúrate de que el logo esté en esta ruta

const usePrintOrder = () => {
  const printOrder = useCallback(async (orderNumber) => {
    try {
      const token = localStorage.getItem('pedidos_pretty_token');
      const response = await axios.get(`${API_URL}/order/${orderNumber}`, {
        headers: { 'x-access-token': token },
      });
      const data = response.data;
      if (!data.success) {
        console.error("Error al obtener pedido:", data);
        return;
      }
      const orderData = data.order;
      const header = orderData.header;
      const details = orderData.details;

      // Calcular totales
      const globalSubtotal = details.reduce(
        (acc, item) => acc + (item.kar_pre_pub * item.kar_uni),
        0
      );
      const globalDiscount = details.reduce(
        (acc, item) => acc + (item.kar_pre_pub * item.kar_uni) * (item.kar_des_uno / 100),
        0
      );
      const finalTotal = globalSubtotal - globalDiscount;

      // Configuración del documento
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const marginLeft = 20;
      const marginRight = 20;
      const contentWidth = pageWidth - marginLeft - marginRight;
      const pinkRGB = [245, 142, 163]; // Color rosado de la marca (#f58ea3)

      // Header compacto: logo a la izquierda, textos alineados a la derecha
      const headerTop = 12;
      const logoWidth = 48;
      const logoHeight = 22;
      const textBlockRight = pageWidth - marginRight;
      const textBlockTop = headerTop + 3;

      // Logo
      doc.addImage(logoBase64, 'PNG', marginLeft, headerTop, logoWidth, logoHeight);

      // Textos de la empresa alineados a la derecha
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14); // Título principal
      doc.setTextColor(...pinkRGB);
      doc.text('PRETTYMAKEUP COL', textBlockRight, textBlockTop + 4, { align: 'right' });

      doc.setFontSize(10); // Subtítulo
      doc.setTextColor(80, 80, 80);
      doc.text('COTIZACIÓN DE VENTA', textBlockRight, textBlockTop + 12, { align: 'right' });

      doc.setFontSize(8.5); // Info secundaria
      doc.setFont('helvetica', 'bold');
      doc.text((header.ciu_nom ? header.ciu_nom.toUpperCase() : 'BUCARAMANGA'), textBlockRight, textBlockTop + 19, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text('PEDIDOS - 3214207398', textBlockRight, textBlockTop + 24, { align: 'right' });

      // Línea divisoria más cerca
      const headerBottom = Math.max(headerTop + logoHeight, textBlockTop + 26);
      doc.setDrawColor(...pinkRGB);
      doc.setLineWidth(0.5);
      doc.line(marginLeft, headerBottom + 4, pageWidth - marginRight, headerBottom + 4);

      // Información del documento: Nro de comprobante y fecha en una sola línea
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...pinkRGB);
      doc.text('Comprobante Nro:', marginLeft, headerBottom + 13);
      doc.setTextColor(40, 40, 40);
      doc.text(`${header.fac_nro}`, marginLeft + 45, headerBottom + 13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...pinkRGB);
      doc.text('Fecha:', marginLeft + 80, headerBottom + 13);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      doc.text(`${formatDate(header.fac_fec)}`, marginLeft + 95, headerBottom + 13);

      // Datos del Cliente en un box más compacto
      const clientBoxTop = headerBottom + 22;
      const clientBoxHeight = 36;
      doc.setFillColor(250, 245, 247); // Fondo rosado muy suave
      doc.roundedRect(marginLeft, clientBoxTop, contentWidth, clientBoxHeight, 7, 7, 'F');
      
      // Título destacado
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...pinkRGB);
      doc.text('INFORMACIÓN DEL CLIENTE', marginLeft + 6, clientBoxTop + 9);
      
      // Info distribuida en dos columnas, etiquetas resaltadas y valores con salto de línea si es necesario
      doc.setFontSize(8.5);
      const col1X = marginLeft + 6;
      const col2X = marginLeft + contentWidth / 2 + 8;
      let rowY = clientBoxTop + 16;
      const rowGap = 6;
      const valueMaxWidth = contentWidth / 2 - 40;
      // Columna 1
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...pinkRGB);
      doc.text('Cliente:', col1X, rowY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const clienteLines = doc.splitTextToSize(`${header.nit_nom}`, valueMaxWidth);
      doc.text(clienteLines, col1X + 28, rowY);
      let extraY = (clienteLines.length - 1) * rowGap;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...pinkRGB);
      doc.text('Identificación:', col1X, rowY + rowGap + extraY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const ideLines = doc.splitTextToSize(`${header.nit_ide}`, valueMaxWidth);
      doc.text(ideLines, col1X + 28, rowY + rowGap + extraY);
      let extraY2 = (ideLines.length - 1) * rowGap;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...pinkRGB);
      doc.text('Teléfono:', col1X, rowY + rowGap * 2 + extraY + extraY2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const telLines = doc.splitTextToSize(`${header.nit_tel}`, valueMaxWidth);
      doc.text(telLines, col1X + 28, rowY + rowGap * 2 + extraY + extraY2);
      let extraY3 = (telLines.length - 1) * rowGap;

      // Columna 2
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...pinkRGB);
      doc.text('Dirección:', col2X, rowY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const dirLines = doc.splitTextToSize(`${header.nit_dir}`, valueMaxWidth);
      doc.text(dirLines, col2X + 28, rowY);
      let extraY4 = (dirLines.length - 1) * rowGap;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...pinkRGB);
      doc.text('Ciudad:', col2X, rowY + rowGap + extraY4);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const ciuLines = doc.splitTextToSize(`${header.ciu_nom}`, valueMaxWidth);
      doc.text(ciuLines, col2X + 28, rowY + rowGap + extraY4);

      // Tabla de productos optimizada
      const tableStartY = clientBoxTop + clientBoxHeight + 6;
      const tableColumn = [
        "CÓDIGO",
        "ARTÍCULO",
        "CANTIDAD",
        "Vlr Unitario ($)",
        "Subtotal ($)",
        "% DTO",
        "Total ($)"
      ];
      const tableRows = details.map((item) => {
        const itemSubtotal = item.kar_pre_pub * item.kar_uni;
        const itemDiscount = itemSubtotal * (item.kar_des_uno / 100);
        const itemTotal = itemSubtotal - itemDiscount;
        return [
          item.art_cod,
          item.art_nom,
          item.kar_uni.toString(),
          formatValue(item.kar_pre_pub),
          formatValue(itemSubtotal),
          item.kar_des_uno + "%",
          formatValue(itemTotal)
        ];
      });

      doc.autoTable({
        startY: tableStartY,
        head: [tableColumn],
        body: tableRows,
        theme: "grid",
        styles: { 
          fontSize: 8,
          cellPadding: 2.2,
          lineColor: [245, 142, 163],
          lineWidth: 0.1,
        },
        headStyles: { 
          fillColor: pinkRGB,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 18 }, // Código
          1: { cellWidth: 60 }, // Artículo (más ancho)
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 22, halign: 'right' },
          4: { cellWidth: 22, halign: 'right' },
          5: { cellWidth: 15, halign: 'center' },
          6: { cellWidth: 22, halign: 'right' }
        },
        margin: { left: marginLeft, right: marginRight }
      });

      const finalY = doc.lastAutoTable.finalY + 6;

      // Totales en un box estilizado y compacto, alineado a la derecha
      const totBoxWidth = 100;
      const totBoxX = pageWidth - marginRight - totBoxWidth;
      doc.setFillColor(250, 245, 247);
      doc.roundedRect(totBoxX, finalY, totBoxWidth, 28, 5, 5, 'F');
      
      // Labels y valores alineados
      const labelX = totBoxX + totBoxWidth - 50;
      const valueX = totBoxX + totBoxWidth - 10;
      let totY = finalY + 9;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text('SUBTOTAL:', labelX, totY, { align: 'right' });
      doc.text(`${formatValue(globalSubtotal)}`, valueX, totY, { align: 'right' });
      totY += 7;
      doc.text('DESCUENTO:', labelX, totY, { align: 'right' });
      doc.text(`${formatValue(globalDiscount)}`, valueX, totY, { align: 'right' });
      totY += 9;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...pinkRGB);
      doc.text('TOTAL:', labelX, totY, { align: 'right' });
      doc.text(`$${formatValue(finalTotal)}`, valueX, totY, { align: 'right' });

      // Pie de página
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text("Software administrativo MiPunto - Desarrollado por Eder Alvarez", marginLeft, doc.internal.pageSize.height - 8);

      // Guardar PDF con nombre personalizado
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const dia = pad(now.getDate());
      const mes = pad(now.getMonth() + 1);
      const anio = now.getFullYear();
      const hora = pad(now.getHours());
      const minuto = pad(now.getMinutes());
      const segundo = pad(now.getSeconds());
      const fileName = `comprobante_prettymakeup_${header.fac_nro}_${dia}_${mes}_${anio}_${hora}${minuto}${segundo}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error en printOrder:", error);
    }
  }, []);

  return { printOrder };
};

export default usePrintOrder;

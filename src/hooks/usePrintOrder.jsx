// src/hooks/usePrintOrder.js
import { useCallback } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import { formatValue, formatName } from '../utils';
import { formatDate } from '../utils/dateUtils';
import { API_URL } from '../config';

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

      // [NUEVO] Calcular totales globales basados en cada detalle
      const globalSubtotal = details.reduce(
        (acc, item) => acc + (item.kar_pre_pub * item.kar_uni),
        0
      );
      const globalDiscount = details.reduce(
        (acc, item) => acc + (item.kar_pre_pub * item.kar_uni) * (item.kar_des_uno / 100),
        0
      );
      const finalTotal = globalSubtotal - globalDiscount;

      const doc = new jsPDF();
      const marginLeft = 14;
      let currentY = 20;
      const pinkRGB = [245, 142, 163]; // Color rosado de la marca (#f58ea3)

      // Encabezado
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...pinkRGB);
      doc.text("PRETTYMAKEUP COL", marginLeft, currentY);
      currentY += 10;
      doc.setFontSize(12);
      doc.text("COTIZACIÓN DE VENTA", marginLeft, currentY);
      currentY += 8;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(header.ciu_nom ? header.ciu_nom.toUpperCase() : "BUCARAMANGA, SANTANDER", marginLeft, currentY);
      currentY += 8;
      doc.text("PEDIDOS - 3214207398", marginLeft, currentY);
      currentY += 10;

      // Datos del Cliente
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Cliente        : ${header.nit_nom}`, marginLeft, currentY);
      currentY += 6;
      doc.text(`Identificación : ${header.nit_ide}`, marginLeft, currentY);
      currentY += 6;
      doc.text(`Teléfono       : ${header.nit_tel}`, marginLeft, currentY);
      currentY += 6;
      doc.text(`Dirección      : ${header.nit_dir}`, marginLeft, currentY);
      currentY += 6;
      doc.text(`Ciudad         : ${header.ciu_nom}`, marginLeft, currentY);
      currentY += 8;
      doc.text(`Fecha compra   : ${formatDate(header.fac_fec)}`, marginLeft, currentY);
      currentY += 8;
      doc.text(`Comprobante Nro: ${header.fac_nro}`, 140, 55);
      doc.text(`Fecha vencimiento: ${formatDate(header.fac_fec)}`, 140, 62);
      currentY = 100;

      // Preparar la tabla de ítems
      // [NUEVO] Se agregan columnas para Subtotal, % DTO y Total de cada ítem
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
          item.art_nom, // Puedes usar el nombre real si está disponible
          item.kar_uni.toString(),
          formatValue(item.kar_pre_pub),
          formatValue(itemSubtotal),
          item.kar_des_uno + "%",
          formatValue(itemTotal)
        ];
      });

      doc.autoTable({
        startY: currentY,
        head: [tableColumn],
        body: tableRows,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: pinkRGB },
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      // Mostrar totales globales
      doc.text(`SUBTOTAL: $${formatValue(globalSubtotal)}`, marginLeft, finalY);
      doc.text(`DESCUENTO: $${formatValue(globalDiscount)}`, marginLeft, finalY + 7);
      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL: $${formatValue(finalTotal)}`, marginLeft, finalY + 14);

      // Observaciones
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Software administrativo MiPunto - Desarrollado por Eder Alvarez", marginLeft, finalY + 25);

      // Guardar PDF
      doc.save("comprobante_prettymakeup.pdf");
    } catch (error) {
      console.error("Error en printOrder:", error);
    }
  }, []);

  return { printOrder };
};

export default usePrintOrder;

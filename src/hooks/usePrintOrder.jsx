// src/hooks/usePrintOrder.js
import { useCallback } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import { formatValue, formatName } from '../utils';
import { API_URL } from '../config';

const usePrintOrder = () => {
  const printOrder = useCallback(async (orderNumber) => {
    try {
      // Obtener token desde localStorage (si es necesario)
      const token = localStorage.getItem('pedidos_pretty_token');

      // Llamada al endpoint para obtener la data de la orden
      const response = await axios.get(`${API_URL}/order/${orderNumber}`, {
        headers: { 'x-access-token': token },
      });
      const data = response.data;
      if (!data.success) {
        console.error("Error al obtener pedido:", data);
        return;
      }
      const orderData = data.order;
      // Extraemos el header y los detalles
      const header = orderData.header;
      const details = orderData.details;

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
      doc.text(`Fecha compra   : ${new Date(header.fac_fec).toLocaleDateString()}`, marginLeft, currentY);
      currentY += 8;
      doc.text(`Comprobante Nro: ${header.fac_nro}`, 140, 55);
      doc.text(`Fecha vencimiento: ${new Date(header.fac_fec).toLocaleDateString()}`, 140, 62);
      currentY = 100;

      // Detalle de la Venta - Items
      const tableColumn = ["CÓDIGO", "ARTÍCULO", "CANTIDAD", "Vlr Unitario ($)", "TOTAL ($)"];
      const tableRows = details.map((item) => {
        const subtotal = item.kar_total; // O calcula: item.kar_pre_pub * item.kar_uni
        return [
          item.art_cod,
          // Puedes incluir más detalles, aquí se usa item.art_sec o si tienes nombre
           item.art_nom,
          item.kar_uni.toString(),
          formatValue(item.kar_pre_pub),
          formatValue(subtotal),
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

      // Calcular el total a partir de los detalles
      const totalCalculated = details.reduce(
        (acc, item) => acc + (item.kar_pre_pub * item.kar_uni),
        0
      );

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.text(`SUBTOTAL: $${formatValue(totalCalculated)}`, marginLeft, finalY);
      doc.text(`DESCUENTO: $0`, marginLeft, finalY + 7);
      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL: $${formatValue(totalCalculated)}`, marginLeft, finalY + 14);

      // Observaciones
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Software administrativo MiPunto - Desarrollado por Eder Alvarez", 15, finalY + 25);

      doc.save("comprobante_prettymakeup.pdf");
    } catch (error) {
      console.error("Error en printOrder:", error);
    }
  }, []);

  return { printOrder };
};

export default usePrintOrder;

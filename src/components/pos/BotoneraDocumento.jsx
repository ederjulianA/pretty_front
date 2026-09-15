// src/components/pos/BotoneraDocumento.jsx — SPEC-014 §2.3 / §5.10
// Botones del POS según el documento cargado. Una sola fuente para el panel de escritorio y el drawer móvil.
//   nada     → COTIZAR · REMISIONAR · FACTURAR
//   COT      → GUARDAR COTIZACIÓN · REMISIONAR · FACTURAR
//   REM      → GUARDAR REMISIÓN · FACTURAR
//   VTA      → EDITAR FACTURA
//   bloqueado (origen cruzado con REM/VTA activa, o VTA respaldada por remisión) → solo el aviso.
import React from 'react';
import { FaShoppingCart, FaTruck, FaFileInvoiceDollar, FaLock } from 'react-icons/fa';

const ETIQUETAS = {
  cotizar: { nuevo: 'Cotizar', COT: 'Guardar cotización' },
  remisionar: { nuevo: 'Remisionar', COT: 'Remisionar', REM: 'Guardar remisión' },
  facturar: { nuevo: 'Facturar', COT: 'Facturar', REM: 'Facturar', VTA: 'Editar factura' }
};

const BotoneraDocumento = ({ orderType, isEditing, bloqueo, onCotizar, onRemisionar, onFacturar, compact = false }) => {
  const tipo = isEditing && orderType ? orderType : 'nuevo';
  const base = compact
    ? 'w-full px-6 py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-3 text-sm font-medium cursor-pointer'
    : 'w-full px-4 py-3 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2';

  if (bloqueo?.bloqueado) {
    // El aviso completo se muestra arriba del resumen; aquí solo queda el recordatorio corto.
    return (
      <p className="flex items-center justify-center gap-2 text-sm text-amber-800" role="status">
        <FaLock className="w-4 h-4" /> Solo lectura — cruzada con {bloqueo.bloqueadoPor || 'otro documento'}
      </p>
    );
  }

  const mostrarCotizar = tipo === 'nuevo' || tipo === 'COT';
  const mostrarRemisionar = tipo === 'nuevo' || tipo === 'COT' || tipo === 'REM';

  return (
    <div className={compact ? 'space-y-4' : 'space-y-3'}>
      {mostrarCotizar && (
        <button type="button" onClick={onCotizar} className={`${base} bg-[#f58ea3] text-white hover:bg-[#f7b3c2] active:bg-[#e67a90]`}>
          <FaShoppingCart className="w-5 h-5" />
          {ETIQUETAS.cotizar[tipo]}
        </button>
      )}
      {mostrarRemisionar && (
        <button type="button" onClick={onRemisionar} className={`${base} bg-[#a5762f] text-white hover:bg-[#b98a45] active:bg-[#8c6326]`}>
          <FaTruck className="w-5 h-5" />
          {ETIQUETAS.remisionar[tipo]}
        </button>
      )}
      <button type="button" onClick={onFacturar} className={`${base} bg-green-600 text-white hover:bg-green-700 active:bg-green-800`}>
        <FaFileInvoiceDollar className="w-5 h-5" />
        {ETIQUETAS.facturar[tipo]}
      </button>
    </div>
  );
};

export default BotoneraDocumento;

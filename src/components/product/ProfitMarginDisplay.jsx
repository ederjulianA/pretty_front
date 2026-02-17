import React, { useMemo } from 'react';
import { FaChartLine, FaDollarSign } from 'react-icons/fa';

/**
 * Componente reutilizable para mostrar márgenes de rentabilidad
 * 
 * @param {Object} props
 * @param {number} props.precioDetal - Precio de venta al detal
 * @param {number} props.precioMayor - Precio de venta al mayor
 * @param {number} props.costoPromedio - Costo promedio del producto
 * @param {string} props.tipoProducto - Tipo de producto: 'simple', 'variable', 'bundle'
 * @param {string} props.title - Título opcional (default: "Rentabilidad")
 * @param {boolean} props.showTotals - Mostrar totales de componentes (solo para bundles)
 * @param {Object} props.totalesComponentes - Totales de componentes (solo para bundles)
 * @param {number} props.rentabilidadDetal - Rentabilidad detal del backend (columna calculada)
 * @param {number} props.margenGananciaDetal - Margen de ganancia detal del backend
 * @param {number} props.utilidadBrutaDetal - Utilidad bruta detal del backend
 * @param {string} props.clasificacionRentabilidad - Clasificación del backend (ALTA, MEDIA, BAJA, MINIMA, PERDIDA)
 * @param {number} props.rentabilidadMayor - Rentabilidad mayor calculada del backend
 */
const ProfitMarginDisplay = ({
  precioDetal = 0,
  precioMayor = 0,
  costoPromedio = 0,
  tipoProducto = 'simple',
  title = 'Rentabilidad',
  showTotals = false,
  totalesComponentes = null,
  // Datos del backend (prioridad si están disponibles)
  rentabilidadDetal = null,
  margenGananciaDetal = null,
  utilidadBrutaDetal = null,
  clasificacionRentabilidad = null,
  rentabilidadMayor = null
}) => {
  // Función para formatear precio
  const formatPrice = (price) => {
    if (!price || price === 0) return '$0';
    return `$${parseFloat(price).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Calcular márgenes - usar datos del backend si están disponibles, sino calcular en tiempo real
  const margenes = useMemo(() => {
    // Para bundles, usar el costo total de componentes si está disponible
    const costo = tipoProducto === 'bundle' && totalesComponentes?.totalCosto 
      ? totalesComponentes.totalCosto 
      : costoPromedio;

    // Prioridad: usar datos del backend si están disponibles
    // Si no están disponibles, calcular en tiempo real
    const rentabilidadDetalCalculada = rentabilidadDetal !== null && rentabilidadDetal !== undefined
      ? rentabilidadDetal
      : (precioDetal > 0 && costo > 0 ? ((precioDetal - costo) / precioDetal) * 100 : 0);

    const rentabilidadMayorCalculada = rentabilidadMayor !== null && rentabilidadMayor !== undefined
      ? rentabilidadMayor
      : (precioMayor > 0 && costo > 0 ? ((precioMayor - costo) / precioMayor) * 100 : 0);

    // Margen de ganancia (sobre costo) - usar del backend si está disponible
    const margenGananciaCalculado = margenGananciaDetal !== null && margenGananciaDetal !== undefined
      ? margenGananciaDetal
      : (costo > 0 && precioDetal > 0 ? ((precioDetal - costo) / costo) * 100 : 0);

    // Utilidad bruta - usar del backend si está disponible
    const utilidadBrutaCalculada = utilidadBrutaDetal !== null && utilidadBrutaDetal !== undefined
      ? utilidadBrutaDetal
      : (precioDetal - costo);

    return {
      rentabilidadDetal: rentabilidadDetalCalculada,
      rentabilidadMayor: rentabilidadMayorCalculada,
      margenGanancia: margenGananciaCalculado,
      utilidadBruta: utilidadBrutaCalculada,
      costoUsado: costo,
      // Mantener compatibilidad con código existente
      margenDetal: rentabilidadDetalCalculada,
      margenMayor: rentabilidadMayorCalculada
    };
  }, [
    precioDetal, 
    precioMayor, 
    costoPromedio, 
    tipoProducto, 
    totalesComponentes,
    rentabilidadDetal,
    margenGananciaDetal,
    utilidadBrutaDetal,
    rentabilidadMayor
  ]);

  // Determinar color del margen basado en clasificación del backend o cálculo
  const getMarginColor = (margen, tipo = 'detal', clasificacion = null) => {
    // Si hay clasificación del backend, usarla
    if (clasificacion) {
      switch (clasificacion) {
        case 'ALTA': return 'text-green-600';
        case 'MEDIA': return 'text-yellow-600';
        case 'BAJA': return 'text-orange-600';
        case 'MINIMA': return 'text-red-500';
        case 'PERDIDA': return 'text-red-700';
        default: break;
      }
    }
    
    // Fallback a cálculo basado en umbrales
    if (tipo === 'detal') {
      if (margen >= 40) return 'text-green-600';  // ALTA
      if (margen >= 20) return 'text-yellow-600'; // MEDIA
      if (margen >= 10) return 'text-orange-600'; // BAJA
      if (margen >= 0) return 'text-red-500';     // MINIMA
      return 'text-red-700';                      // PERDIDA
    } else {
      // Mayor
      if (margen >= 30) return 'text-green-600';
      if (margen >= 15) return 'text-yellow-600';
      if (margen >= 5) return 'text-orange-600';
      if (margen >= 0) return 'text-red-500';
      return 'text-red-700';
    }
  };

  // Obtener badge de clasificación
  const getClasificacionBadge = (clasificacion) => {
    if (!clasificacion) return null;
    
    const badges = {
      'ALTA': { text: 'ALTA', bg: 'bg-green-100', textColor: 'text-green-800', border: 'border-green-300' },
      'MEDIA': { text: 'MEDIA', bg: 'bg-yellow-100', textColor: 'text-yellow-800', border: 'border-yellow-300' },
      'BAJA': { text: 'BAJA', bg: 'bg-orange-100', textColor: 'text-orange-800', border: 'border-orange-300' },
      'MINIMA': { text: 'MÍNIMA', bg: 'bg-red-100', textColor: 'text-red-800', border: 'border-red-300' },
      'PERDIDA': { text: 'PÉRDIDA', bg: 'bg-red-200', textColor: 'text-red-900', border: 'border-red-400' }
    };
    
    return badges[clasificacion] || null;
  };

  // Si no hay datos suficientes, no mostrar nada
  if (precioDetal === 0 && precioMayor === 0 && margenes.costoUsado === 0) {
    return null;
  }

  return (
    <div className="mt-4 bg-gradient-to-br from-pink-50 to-purple-50 border border-[#f5cad4] rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FaChartLine className="text-[#f58ea3] text-lg" />
        <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Información de Precios y Costo */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FaDollarSign className="text-gray-500" />
            Información Financiera
          </h5>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Precio Detal:</span>
              <span className="font-semibold text-gray-800">{formatPrice(precioDetal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Precio Mayor:</span>
              <span className="font-semibold text-gray-800">{formatPrice(precioMayor)}</span>
            </div>
            {showTotals && totalesComponentes && (
              <>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="text-sm text-gray-600">Total Precio Detal Componentes:</span>
                  <span className="font-semibold text-gray-800">{formatPrice(totalesComponentes.totalPrecioDetal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Precio Mayor Componentes:</span>
                  <span className="font-semibold text-gray-800">{formatPrice(totalesComponentes.totalPrecioMayor)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center border-t border-gray-200 pt-2">
              <span className="text-sm font-medium text-gray-700">
                {tipoProducto === 'bundle' ? 'Total Costo:' : 'Costo Promedio:'}
              </span>
              <span className="font-bold text-blue-600">{formatPrice(margenes.costoUsado)}</span>
            </div>
          </div>
        </div>

        {/* Márgenes de Rentabilidad */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FaChartLine className="text-gray-500" />
            Márgenes de Rentabilidad
          </h5>
          <div className="space-y-2">
            {/* Clasificación del backend si está disponible */}
            {clasificacionRentabilidad && getClasificacionBadge(clasificacionRentabilidad) && (
              <div className={`mb-3 px-3 py-2 rounded-lg border ${getClasificacionBadge(clasificacionRentabilidad).bg} ${getClasificacionBadge(clasificacionRentabilidad).textColor} ${getClasificacionBadge(clasificacionRentabilidad).border}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Clasificación:</span>
                  <span className="text-sm font-bold">{getClasificacionBadge(clasificacionRentabilidad).text}</span>
                </div>
              </div>
            )}
            
            {precioDetal > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rentabilidad Detal:</span>
                  <span className={`font-bold ${getMarginColor(margenes.rentabilidadDetal, 'detal', clasificacionRentabilidad)}`}>
                    {margenes.rentabilidadDetal.toFixed(2)}%
                  </span>
                </div>
                {margenGananciaDetal !== null && margenGananciaDetal !== undefined && (
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Margen Ganancia:</span>
                    <span>{margenes.margenGanancia.toFixed(2)}%</span>
                  </div>
                )}
                {utilidadBrutaDetal !== null && utilidadBrutaDetal !== undefined && (
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Utilidad Bruta:</span>
                    <span>{formatPrice(margenes.utilidadBruta)}</span>
                  </div>
                )}
              </>
            )}
            {precioMayor > 0 && (
              <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                <span className="text-sm text-gray-600">Rentabilidad Mayor:</span>
                <span className={`font-bold ${getMarginColor(margenes.rentabilidadMayor, 'mayor')}`}>
                  {margenes.rentabilidadMayor.toFixed(2)}%
                </span>
              </div>
            )}
            
            {/* Información adicional según tipo de producto */}
            {tipoProducto === 'variable' && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 italic">
                  Los márgenes mostrados son de referencia. Cada variación tiene su propio margen.
                </p>
              </div>
            )}
            
            {tipoProducto === 'bundle' && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 italic">
                  Margen calculado sobre el precio del bundle completo.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nota informativa */}
      {margenes.costoUsado === 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">
            ⚠️ El costo promedio no está disponible. Los márgenes se calcularán cuando se registre el costo del producto.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfitMarginDisplay;

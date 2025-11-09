// src/components/PromocionBanner.jsx
import React from 'react';
import { FaFire, FaCalendarAlt, FaTag } from 'react-icons/fa';
import PropTypes from 'prop-types';

const PromocionBanner = ({ evento }) => {
  if (!evento) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="mb-6 animate-fade-in">
      <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-[#f58ea3] rounded-xl shadow-lg overflow-hidden border-2 border-orange-400/50">
        <div className="bg-white/10 backdrop-blur-sm p-4 md:p-5">
          <div className="flex items-start gap-4">
            {/* Icono destacado */}
            <div className="flex-shrink-0">
              <div className="bg-white/20 rounded-full p-3 backdrop-blur-sm">
                <FaFire className="text-white text-2xl md:text-3xl animate-pulse" />
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-white font-bold text-lg md:text-xl">
                  {evento.eve_nombre}
                </h3>
                <span className="bg-white/30 text-white text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
                  ACTIVO
                </span>
              </div>

              {/* Información del evento */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 text-white">
                {/* Fechas */}
                <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                  <FaCalendarAlt className="text-white/90 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-white/80">Período</p>
                    <p className="text-sm font-semibold">
                      <span className="block md:inline">{formatDate(evento.eve_fecha_inicio)}</span>
                      <span className="hidden md:inline"> - </span>
                      <span className="block md:inline">{formatDate(evento.eve_fecha_fin)}</span>
                    </p>
                  </div>
                </div>

                {/* Descuento Detal */}
                <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                  <FaTag className="text-white/90 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-white/80">Desc. Detal</p>
                    <p className="text-sm font-bold">
                      {evento.eve_descuento_detal}%
                    </p>
                  </div>
                </div>

                {/* Descuento Mayor */}
                <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                  <FaTag className="text-white/90 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-white/80">Desc. Mayor</p>
                    <p className="text-sm font-bold">
                      {evento.eve_descuento_mayor}%
                    </p>
                  </div>
                </div>

                {/* Observaciones si existen */}
                {evento.eve_observaciones && (
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2 backdrop-blur-sm md:col-span-2 lg:col-span-1">
                    <div className="min-w-0">
                      <p className="text-xs text-white/80">Info</p>
                      <p className="text-sm font-medium truncate">
                        {evento.eve_observaciones}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

PromocionBanner.propTypes = {
  evento: PropTypes.shape({
    eve_sec: PropTypes.number,
    eve_nombre: PropTypes.string.isRequired,
    eve_fecha_inicio: PropTypes.string.isRequired,
    eve_fecha_fin: PropTypes.string.isRequired,
    eve_descuento_detal: PropTypes.number.isRequired,
    eve_descuento_mayor: PropTypes.number.isRequired,
    eve_activo: PropTypes.string,
    eve_observaciones: PropTypes.string,
  }),
};

export default PromocionBanner;


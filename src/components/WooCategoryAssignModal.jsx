import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { FaTag, FaSpinner, FaTimes, FaPlus, FaMinus } from 'react-icons/fa';
import useWooCategories from '../hooks/useWooCategories';
import useWooCategoryPromo from '../hooks/useWooCategoryPromo';

const WooCategoryAssignModal = ({ isOpen, onClose, promocion, totalArticulos }) => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const { categorias, loading: loadingCats, error: errorCats, fetchCategorias } = useWooCategories();
  const { asignarCategoria, quitarCategoria, loading: loadingAccion } = useWooCategoryPromo(promocion?.pro_sec);

  useEffect(() => {
    if (isOpen) {
      setCategoriaSeleccionada(null);
      setBusqueda('');
      fetchCategorias();
    }
  }, [isOpen]);

  const categoriasFiltradas = categorias.filter(c =>
    c.name.toLowerCase().includes(busqueda.toLowerCase())
  );

  const mostrarResumen = (resultado, accion) => {
    const { total, exitosos, omitidos, errores, detalle_errores } = resultado;
    const hayErrores = errores > 0;

    const listaErrores = hayErrores
      ? `<div class="mt-3 text-left text-sm max-h-32 overflow-y-auto">
          ${detalle_errores.map(e => `<p class="text-red-600">• ${e.art_cod} - ${e.art_nom}: ${e.error}</p>`).join('')}
         </div>`
      : '';

    Swal.fire({
      title: hayErrores ? 'Completado con errores' : '¡Listo!',
      icon: hayErrores ? 'warning' : 'success',
      html: `
        <div class="text-center">
          <p class="text-gray-700 mb-3">Categoría <strong>${accion}</strong> en WooCommerce</p>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div class="bg-green-50 rounded-lg p-2">
              <p class="font-bold text-green-700 text-lg">${exitosos}</p>
              <p class="text-green-600">Exitosos</p>
            </div>
            <div class="bg-yellow-50 rounded-lg p-2">
              <p class="font-bold text-yellow-700 text-lg">${omitidos}</p>
              <p class="text-yellow-600">Omitidos</p>
            </div>
            <div class="bg-red-50 rounded-lg p-2">
              <p class="font-bold text-red-700 text-lg">${errores}</p>
              <p class="text-red-600">Errores</p>
            </div>
          </div>
          ${listaErrores}
        </div>
      `,
      confirmButtonColor: '#f58ea3',
    });
  };

  const handleAsignar = async () => {
    if (!categoriaSeleccionada) {
      toast.warning('Selecciona una categoría primero');
      return;
    }

    if (totalArticulos === 0) {
      toast.warning('Esta promoción no tiene artículos activos');
      return;
    }

    const confirm = await Swal.fire({
      title: '¿Asignar categoría?',
      html: `Se asignará la categoría <strong>${categoriaSeleccionada.name}</strong> a los artículos de esta promoción en WooCommerce.<br><br>Las categorías existentes de cada producto se conservarán.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f58ea3',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, asignar',
      cancelButtonText: 'Cancelar',
    });

    if (!confirm.isConfirmed) return;

    try {
      const resultado = await asignarCategoria(categoriaSeleccionada.id, categoriaSeleccionada.name);

      if (resultado.exitosos === 0 && resultado.omitidos > 0) {
        toast.warning('Ningún artículo de esta promoción está sincronizado con WooCommerce');
      } else if (resultado.errores === 0) {
        toast.success(`Categoría "${categoriaSeleccionada.name}" asignada a ${resultado.exitosos} artículos en WooCommerce`);
      } else {
        mostrarResumen(resultado, `"${categoriaSeleccionada.name}" asignada`);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleQuitar = async () => {
    if (!categoriaSeleccionada) {
      toast.warning('Selecciona una categoría primero');
      return;
    }

    const confirm = await Swal.fire({
      title: '¿Quitar categoría?',
      html: `Se quitará la categoría <strong>${categoriaSeleccionada.name}</strong> de los artículos de esta promoción en WooCommerce.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar',
    });

    if (!confirm.isConfirmed) return;

    try {
      const resultado = await quitarCategoria(categoriaSeleccionada.id);

      if (resultado.exitosos === 0 && resultado.omitidos > 0) {
        toast.warning('Ningún artículo de esta promoción está sincronizado con WooCommerce');
      } else if (resultado.errores === 0) {
        toast.success(`Categoría "${categoriaSeleccionada.name}" quitada de ${resultado.exitosos} artículos en WooCommerce`);
      } else {
        mostrarResumen(resultado, `"${categoriaSeleccionada.name}" quitada`);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] text-white p-5 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaTag className="text-lg" />
            <div>
              <h3 className="font-bold text-lg">Categoría WooCommerce</h3>
              <p className="text-white/80 text-sm">{promocion?.pro_descripcion}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl font-bold leading-none">
            <FaTimes />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Buscador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selecciona una categoría de WooCommerce
            </label>
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f58ea3]"
            />
          </div>

          {/* Lista de categorías */}
          <div className="border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
            {loadingCats ? (
              <div className="flex items-center justify-center py-8 gap-2 text-gray-500">
                <FaSpinner className="animate-spin" />
                <span className="text-sm">Cargando categorías...</span>
              </div>
            ) : errorCats ? (
              <div className="py-6 text-center text-red-500 text-sm px-4">
                {errorCats}
              </div>
            ) : categoriasFiltradas.length === 0 ? (
              <div className="py-6 text-center text-gray-400 text-sm">
                {busqueda ? 'Sin resultados para tu búsqueda' : 'No se encontraron categorías en WooCommerce'}
              </div>
            ) : (
              categoriasFiltradas.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaSeleccionada(cat)}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-pink-50 transition-colors border-b border-gray-100 last:border-0 ${
                    categoriaSeleccionada?.id === cat.id ? 'bg-pink-50 border-l-4 border-l-[#f58ea3]' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{cat.name}</p>
                    <p className="text-xs text-gray-400">{cat.slug} · {cat.count} productos</p>
                  </div>
                  {categoriaSeleccionada?.id === cat.id && (
                    <span className="text-[#f58ea3] text-xs font-semibold">✓ Seleccionada</span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Categoría seleccionada */}
          {categoriaSeleccionada && (
            <div className="bg-pink-50 border border-pink-200 rounded-xl px-4 py-3 text-sm">
              <span className="text-gray-500">Seleccionada: </span>
              <span className="font-semibold text-gray-800">{categoriaSeleccionada.name}</span>
            </div>
          )}

          {/* Info sobre artículos sin woo_id */}
          <p className="text-xs text-gray-400">
            Solo se procesarán artículos sincronizados con WooCommerce. Los artículos sin ID de WooCommerce serán omitidos.
          </p>
        </div>

        {/* Footer acciones */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={handleAsignar}
            disabled={!categoriaSeleccionada || loadingAccion || loadingCats}
            className="flex-1 bg-[#f58ea3] hover:bg-[#f0708a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {loadingAccion ? <FaSpinner className="animate-spin" /> : <FaPlus className="w-3.5 h-3.5" />}
            Asignar categoría
          </button>
          <button
            onClick={handleQuitar}
            disabled={!categoriaSeleccionada || loadingAccion || loadingCats}
            className="flex-1 bg-white border border-red-300 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed text-red-600 font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {loadingAccion ? <FaSpinner className="animate-spin" /> : <FaMinus className="w-3.5 h-3.5" />}
            Quitar categoría
          </button>
        </div>
      </div>
    </div>
  );
};

export default WooCategoryAssignModal;

// src/pages/PromocionNew.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { FaSearch, FaSpinner, FaPlus, FaTrash, FaTag, FaCalendarAlt, FaPercentage, FaDollarSign } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import ArticleSearchModal from '../components/ArticleSearchModal';

const initialArticleRow = {
  art_sec: '',
  art_cod: '',
  art_nom: '',
  precio_normal: '',
  precio_mayor: '',
  precio_oferta: '',
  descuento_porcentaje: '',
  estado: 'A',
  observaciones: '',
  isNew: true // Indica si el artículo es nuevo (agregado durante edición)
};

const PromocionNew = () => {
  const navigate = useNavigate();
  const { pro_sec } = useParams();
  const isEditing = Boolean(pro_sec);

  // Estado para encabezado de la promoción
  const [headerData, setHeaderData] = useState({
    codigo: '',
    descripcion: '',
    tipo: 'OFERTA',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    observaciones: ''
  });

  // Estado para artículos: inicializamos con 5 filas
  const [articleRows, setArticleRows] = useState(Array(5).fill({ ...initialArticleRow }));

  // Estados para modal y loading
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [currentRowIndex, setCurrentRowIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar datos de la promoción si estamos en modo edición
  useEffect(() => {
    if (isEditing) {
      const fetchPromocion = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get(`${API_URL}/promociones/${pro_sec}`, {
            headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
          });

          if (response.data.success) {
            const { data } = response.data;
            const { articulos } = data;

            // Establecer los datos del encabezado
            setHeaderData({
              codigo: data.pro_codigo,
              descripcion: data.pro_descripcion,
              tipo: data.pro_tipo,
              fecha_inicio: data.pro_fecha_inicio.split('T')[0],
              fecha_fin: data.pro_fecha_fin.split('T')[0],
              observaciones: data.pro_observaciones || ''
            });

            // Mapear los artículos a la estructura de filas
            const articulosFormateados = articulos.map(articulo => ({
              art_sec: articulo.art_sec,
              art_cod: articulo.art_cod,
              art_nom: articulo.art_nom,
              precio_normal: articulo.precio_detal_base || '',
              precio_mayor: articulo.precio_mayor_base || '',
              precio_oferta: articulo.pro_det_precio_oferta || '',
              descuento_porcentaje: articulo.pro_det_descuento_porcentaje || '',
              estado: articulo.pro_det_estado || 'A',
              observaciones: articulo.pro_det_observaciones || '',
              isNew: false // Los artículos cargados de BD no son nuevos
            }));

            // Rellenar con filas vacías si hay menos artículos que el mínimo
            const filasRestantes = Array(Math.max(0, 5 - articulosFormateados.length))
              .fill({ ...initialArticleRow });

            setArticleRows([...articulosFormateados, ...filasRestantes]);
          }
        } catch (error) {
          console.error('Error al cargar la promoción:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la promoción para edición',
            confirmButtonColor: '#f58ea3'
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchPromocion();
    }
  }, [pro_sec, isEditing]);

  // Función para calcular precio de oferta basado en descuento
  const calcularPrecioOferta = (precioNormal, descuento) => {
    if (!precioNormal || !descuento) return '';
    const precio = parseFloat(precioNormal);
    const desc = parseFloat(descuento);
    return (precio * (1 - desc / 100)).toFixed(2);
  };

  // Función para calcular descuento basado en precios
  const calcularDescuento = (precioNormal, precioOferta) => {
    if (!precioNormal || !precioOferta) return '';
    const normal = parseFloat(precioNormal);
    const oferta = parseFloat(precioOferta);
    if (normal <= oferta) return '';
    return (((normal - oferta) / normal) * 100).toFixed(2);
  };

  // Manejo de cambios en filas de artículos
  const handleRowChange = (index, field, value) => {
    const updatedRows = [...articleRows];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value
    };

    // Recalcular automáticamente cuando cambian precios o descuentos
    if (field === 'precio_oferta' && updatedRows[index].precio_normal) {
      const descuento = calcularDescuento(updatedRows[index].precio_normal, value);
      updatedRows[index].descuento_porcentaje = descuento;
    } else if (field === 'descuento_porcentaje' && updatedRows[index].precio_normal) {
      const precioOferta = calcularPrecioOferta(updatedRows[index].precio_normal, value);
      updatedRows[index].precio_oferta = precioOferta;
    }

    setArticleRows(updatedRows);
  };

  // Agregar nueva fila
  const addNewRow = () => {
    setArticleRows([...articleRows, { ...initialArticleRow }]);
  };

  // Eliminar fila (solo artículos nuevos)
  const removeRow = (index) => {
    const row = articleRows[index];
    
    // Solo permitir eliminar artículos nuevos
    if (!row.isNew) {
      Swal.fire({
        icon: 'warning',
        title: 'No se puede eliminar',
        text: 'No se puede eliminar un artículo que ya existe en la promoción',
        confirmButtonColor: '#f58ea3'
      });
      return;
    }
    
    if (articleRows.length > 1) {
      const updatedRows = articleRows.filter((_, i) => i !== index);
      setArticleRows(updatedRows);
    }
  };

  // Función para abrir búsqueda de artículo
  const buscarArticulo = (index) => {
    const row = articleRows[index];
    
    // Solo permitir búsqueda para artículos nuevos
    if (!row.isNew) {
      Swal.fire({
        icon: 'info',
        title: 'Búsqueda no disponible',
        text: 'No se puede modificar un artículo que ya existe en la promoción',
        confirmButtonColor: '#f58ea3'
      });
      return;
    }
    
    setCurrentRowIndex(index);
    setShowArticleModal(true);
  };

  // Función para consultar artículo cuando se pierde el foco
  const handleArtCodBlur = async (index, artCodValue) => {
    const row = articleRows[index];
    
    // Solo permitir consulta para artículos nuevos
    if (!row.isNew) return;
    
    if (!artCodValue) return;
    
    try {
      const response = await axios.get(`${API_URL}/consultarArticuloByArtCod/articulo/${artCodValue}`);
      
      if (response.data.success) {
        const articulo = response.data.articulo;
        
        // Verificar si el artículo ya existe en otra fila
        if (isArticleDuplicate(articulo.art_sec, index)) {
          Swal.fire({
            icon: 'error',
            title: 'Artículo duplicado',
            text: `El artículo "${articulo.art_nom}" ya está agregado a esta promoción`,
            confirmButtonColor: '#f58ea3'
          });
          
          // Limpiar campos del artículo duplicado
          const updatedRows = [...articleRows];
          updatedRows[index] = {
            ...updatedRows[index],
            art_cod: artCodValue,
            art_nom: '',
            precio_normal: '',
            precio_mayor: '',
            art_sec: ''
          };
          setArticleRows(updatedRows);
          return;
        }
        
        const updatedRows = [...articleRows];
        updatedRows[index] = {
          ...updatedRows[index],
          art_cod: articulo.art_cod,
          art_nom: articulo.art_nom,
          precio_normal: articulo.precio_detal_base || articulo.precio_detal || '',
          precio_mayor: articulo.precio_mayor_base || articulo.precio_mayor || '',
          art_sec: articulo.art_sec,
          isNew: true // Al buscar y seleccionar un artículo, se marca como nuevo
        };
        setArticleRows(updatedRows);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Artículo no encontrado',
          text: response.data.error || `No se encontró ningún artículo con el código ${artCodValue}`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          confirmButtonColor: '#f58ea3'
        });

        // Limpiar campos del artículo
        const updatedRows = [...articleRows];
        updatedRows[index] = {
          ...updatedRows[index],
          art_cod: artCodValue,
          art_nom: '',
          precio_normal: '',
          art_sec: ''
        };
        setArticleRows(updatedRows);
      }
    } catch (error) {
      console.error("Error al consultar artículo:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo consultar el artículo',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        confirmButtonColor: '#f58ea3'
      });
    }
  };

  // Función para verificar si un artículo ya existe en la promoción
  const isArticleDuplicate = (artSec, excludeIndex = null) => {
    return articleRows.some((row, index) => 
      row.art_sec && 
      row.art_sec === artSec && 
      index !== excludeIndex
    );
  };

  // Función para obtener el estado de validación de una fila
  const getRowValidationState = (row, index) => {
    if (!row.art_sec) return null;
    
    if (isArticleDuplicate(row.art_sec, index)) {
      return {
        isValid: false,
        message: 'Artículo duplicado'
      };
    }
    
    return {
      isValid: true,
      message: ''
    };
  };

  // Función para manejar selección de artículo desde modal
  const handleSelectArticle = (article) => {
    if (currentRowIndex !== null) {
      // Verificar si el artículo ya existe en otra fila
      if (isArticleDuplicate(article.id, currentRowIndex)) {
        Swal.fire({
          icon: 'error',
          title: 'Artículo duplicado',
          text: `El artículo "${article.name}" ya está agregado a esta promoción`,
          confirmButtonColor: '#f58ea3'
        });
        setShowArticleModal(false);
        return;
      }

      const updatedRows = [...articleRows];
      updatedRows[currentRowIndex] = {
        ...updatedRows[currentRowIndex],
        art_cod: article.codigo,
        art_nom: article.name,
        precio_normal: article.precio_detal_base || article.precio_detal || '',
        precio_mayor: article.precio_mayor_base || article.precio_mayor || '',
        art_sec: article.id,
        isNew: true // Al seleccionar desde modal, se marca como nuevo
      };
      setArticleRows(updatedRows);
    }
    setShowArticleModal(false);
  };

  // Función para guardar promoción
  const handleGuardar = async () => {
    setIsSubmitting(true);
    
    try {
      // Validaciones de encabezado
      if (!headerData.codigo.trim()) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: 'El código de la promoción es requerido',
          confirmButtonColor: '#f58ea3'
        });
        setIsSubmitting(false);
        return;
      }

      if (!headerData.descripcion.trim()) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: 'La descripción es requerida',
          confirmButtonColor: '#f58ea3'
        });
        setIsSubmitting(false);
        return;
      }

      if (new Date(headerData.fecha_inicio) >= new Date(headerData.fecha_fin)) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: 'La fecha de inicio debe ser menor a la fecha de fin',
          confirmButtonColor: '#f58ea3'
        });
        setIsSubmitting(false);
        return;
      }

      // Filtrar artículos válidos
      const articulosValidos = articleRows.filter(row => 
        row.art_sec && 
        (row.precio_oferta || row.descuento_porcentaje) &&
        ['A', 'I'].includes(row.estado)
      );

      if (articulosValidos.length === 0) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: 'Debe agregar al menos un artículo con precio de oferta o descuento',
          confirmButtonColor: '#f58ea3'
        });
        setIsSubmitting(false);
        return;
      }

      // Preparar payload
      const payload = {
        codigo: headerData.codigo,
        descripcion: headerData.descripcion,
        fecha_inicio: new Date(headerData.fecha_inicio).toISOString(),
        fecha_fin: new Date(headerData.fecha_fin).toISOString(),
        tipo: headerData.tipo,
        observaciones: headerData.observaciones,
        articulos: articulosValidos.map(row => ({
          art_sec: row.art_sec,
          precio_oferta: row.precio_oferta ? parseFloat(row.precio_oferta) : null,
          descuento_porcentaje: row.descuento_porcentaje ? parseFloat(row.descuento_porcentaje) : null,
          estado: row.estado,
          observaciones: row.observaciones
        }))
      };

      let response;
      if (isEditing) {
        response = await axios.put(`${API_URL}/promociones/${pro_sec}`, payload, {
          headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
        });
      } else {
        response = await axios.post(`${API_URL}/promociones`, payload, {
          headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
        });
      }

      if (response.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Promoción guardada',
          text: `La promoción "${headerData.codigo}" ha sido ${isEditing ? 'actualizada' : 'creada'} exitosamente`,
          confirmButtonColor: '#f58ea3'
        });

        navigate('/promociones');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.data.error || 'Error al guardar la promoción',
          confirmButtonColor: '#f58ea3'
        });
      }
    } catch (error) {
      console.error('Error al guardar promoción:', error);
      
      // Extraer mensaje de error del backend
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error al guardar la promoción';
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para cancelar
  const handleCancelar = () => {
    Swal.fire({
      title: '¿Está seguro?',
      text: "Perderá todos los cambios realizados",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f58ea3',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'No, continuar'
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/promociones');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-[#f58ea3] mb-4" />
          <p className="text-lg text-gray-600">Cargando promoción...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] p-2 sm:p-6">
      {/* Overlay de carga */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-50">
          <FaSpinner className="animate-spin text-4xl text-[#f58ea3] mb-4" />
          <p className="text-gray-600 font-medium">Guardando promoción...</p>
          <p className="text-sm text-gray-500 mt-2">Por favor espere mientras procesamos su solicitud</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaTag className="text-[#f58ea3] text-2xl" />
              <h1 className="text-2xl font-bold text-gray-800">
                {isEditing ? `Editar Promoción: ${headerData.codigo}` : 'Nueva Promoción'}
              </h1>
            </div>
            <button
              onClick={() => navigate('/promociones')}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <span className="text-xl">←</span> Volver
            </button>
          </div>
        </div>

        {/* Sección de Información General */}
        <div className="bg-white rounded-xl shadow-lg mb-6 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FaTag className="text-[#f58ea3]" />
            <h2 className="text-xl font-bold text-gray-800">Información General</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Código */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Promoción *
              </label>
              <input
                type="text"
                value={headerData.codigo}
                onChange={(e) => setHeaderData({...headerData, codigo: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                placeholder="Ej: OFERTA_VERANO_2024"
                required
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Promoción *
              </label>
              <select
                value={headerData.tipo}
                onChange={(e) => setHeaderData({...headerData, tipo: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
              >
                <option value="OFERTA">Oferta</option>
                <option value="DESCUENTO">Descuento</option>
                <option value="BLACK_FRIDAY">Black Friday</option>
                <option value="OFERTA_ESPECIAL">Oferta Especial</option>
              </select>
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                value={headerData.descripcion}
                onChange={(e) => setHeaderData({...headerData, descripcion: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                rows={3}
                placeholder="Descripción detallada de la promoción..."
                required
              />
            </div>

            {/* Fechas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCalendarAlt className="inline mr-1" />
                Fecha de Inicio *
              </label>
              <input
                type="date"
                value={headerData.fecha_inicio}
                onChange={(e) => setHeaderData({...headerData, fecha_inicio: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCalendarAlt className="inline mr-1" />
                Fecha de Fin *
              </label>
              <input
                type="date"
                value={headerData.fecha_fin}
                onChange={(e) => setHeaderData({...headerData, fecha_fin: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                required
              />
            </div>

            {/* Observaciones */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={headerData.observaciones}
                onChange={(e) => setHeaderData({...headerData, observaciones: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                rows={2}
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>
        </div>

        {/* Sección de Artículos */}
        <div className="bg-white rounded-xl shadow-lg mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaTag className="text-[#f58ea3]" />
              <h2 className="text-xl font-bold text-gray-800">Artículos en Promoción</h2>
            </div>
            <button
              onClick={addNewRow}
              className="bg-[#f58ea3] hover:bg-[#f7b3c2] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaPlus /> Agregar Artículo
            </button>
          </div>

          {/* Vista móvil */}
          <div className="block lg:hidden space-y-4">
            {articleRows.map((row, index) => {
              const validationState = getRowValidationState(row, index);
              return (
                <div key={index} className={`border rounded-lg p-4 ${validationState && !validationState.isValid ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
                  {validationState && !validationState.isValid && (
                    <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-xs">
                      ⚠️ {validationState.message}
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Artículo #{index + 1}</span>
                      {row.isNew && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Nuevo
                        </span>
                      )}
                    </div>
                    {articleRows.length > 1 && row.isNew && (
                      <button
                        onClick={() => removeRow(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Eliminar artículo"
                      >
                        <FaTrash />
                      </button>
                    )}
                    {!row.isNew && (
                      <span className="text-xs text-gray-500 italic">
                        No se puede eliminar
                      </span>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="text-xs text-gray-500 mb-1 block">Nombre del Artículo</label>
                    <input
                      type="text"
                      value={row.art_nom}
                      readOnly
                      className="w-full p-2 border rounded text-sm bg-gray-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        <FaDollarSign className="inline w-3 h-3" /> Precio al Detal
                      </label>
                      <input
                        type="number"
                        value={row.precio_normal}
                        readOnly
                        className="w-full p-2 border rounded text-sm bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        <FaDollarSign className="inline w-3 h-3" /> Precio al Mayor
                      </label>
                      <input
                        type="number"
                        value={row.precio_mayor}
                        readOnly
                        className="w-full p-2 border rounded text-sm bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        <FaDollarSign className="inline w-3 h-3" /> Precio Oferta
                      </label>
                      <input
                        type="number"
                        value={row.precio_oferta}
                        onChange={(e) => handleRowChange(index, 'precio_oferta', e.target.value)}
                        className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        <FaPercentage className="inline w-3 h-3" /> Descuento %
                      </label>
                      <input
                        type="number"
                        value={row.descuento_porcentaje}
                        onChange={(e) => handleRowChange(index, 'descuento_porcentaje', e.target.value)}
                        className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vista desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-xs font-medium text-gray-700 text-left">Código</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-700 text-left">Buscar</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-700 text-left">Artículo</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-700 text-left">Precio al Detal</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-700 text-left">Precio al Mayor</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-700 text-left">Precio Oferta</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-700 text-left">Descuento %</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-700 text-left">Estado</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-700 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {articleRows.map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.art_cod}
                        onChange={(e) => handleRowChange(index, 'art_cod', e.target.value)}
                        onBlur={(e) => handleArtCodBlur(index, e.target.value)}
                        className={`w-full p-2 border rounded text-sm transition-colors ${
                          !row.isNew 
                            ? 'bg-gray-100 cursor-not-allowed' 
                            : 'focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3]'
                        }`}
                        placeholder="Código..."
                        readOnly={!row.isNew}
                        disabled={!row.isNew}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => buscarArticulo(index)}
                        className={`p-2 border rounded transition-colors ${
                          !row.isNew 
                            ? 'bg-gray-100 cursor-not-allowed opacity-50' 
                            : 'bg-[#fff5f7] hover:bg-[#fce7eb]'
                        }`}
                        disabled={!row.isNew}
                        title={!row.isNew ? 'No se puede modificar artículo existente' : 'Buscar artículo'}
                      >
                        <FaSearch className={`w-3 h-3 ${!row.isNew ? 'text-gray-400' : 'text-[#f58ea3]'}`} />
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.art_nom}
                        readOnly
                        className="w-full p-2 border rounded text-sm bg-gray-100"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={row.precio_normal}
                        readOnly
                        className="w-full p-2 border rounded text-sm bg-gray-100"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={row.precio_mayor}
                        readOnly
                        className="w-full p-2 border rounded text-sm bg-gray-100"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={row.precio_oferta}
                        onChange={(e) => handleRowChange(index, 'precio_oferta', e.target.value)}
                        className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                        step="0.01"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={row.descuento_porcentaje}
                        onChange={(e) => handleRowChange(index, 'descuento_porcentaje', e.target.value)}
                        className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                        step="0.01"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.estado}
                        onChange={(e) => handleRowChange(index, 'estado', e.target.value)}
                        className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                      >
                        <option value="A">Activo</option>
                        <option value="I">Inactivo</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {row.isNew && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Nuevo
                          </span>
                        )}
                        {articleRows.length > 1 && row.isNew && (
                          <button
                            onClick={() => removeRow(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Eliminar artículo"
                          >
                            <FaTrash />
                          </button>
                        )}
                        {!row.isNew && (
                          <span className="text-xs text-gray-500 italic">
                            No se puede eliminar
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <button
            onClick={handleCancelar}
            className="px-6 py-3 border border-[#f58ea3] text-[#f58ea3] rounded-lg hover:bg-[#fff5f7] transition-colors font-medium"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="px-6 py-3 bg-[#f58ea3] text-white rounded-lg hover:bg-[#f7b3c2] transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <FaTag />
                {isEditing ? 'Actualizar Promoción' : 'Crear Promoción'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal de búsqueda de artículos */}
      <ArticleSearchModal
        isOpen={showArticleModal}
        onClose={() => setShowArticleModal(false)}
        onSelectArticle={handleSelectArticle}
      />
    </div>
  );
};

export default PromocionNew; 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { FaSearch, FaSpinner } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import ArticleSearchModal from '../components/ArticleSearchModal';
import ProviderSearchModal from '../components/ProviderSearchModal';

const initialRow = {
  art_cod: '',
  art_nom: '',
  kar_nat: '+',  // Valor por defecto: "Positivo"
  kar_uni: '',
  saldo_actual: '',  // Este campo se debe cargar tras la búsqueda del artículo
  nuevo_saldo: ''    // Se calcula automáticamente
};

const InventoryAdjustment = () => {
  const navigate = useNavigate();
  const { fac_nro } = useParams(); // Para obtener el número de ajuste a editar
  const isEditing = Boolean(fac_nro);

  // Estado para encabezado
  const [headerData, setHeaderData] = useState({
    fecha: new Date().toISOString().split('T')[0], // Fecha actual por defecto
    proveedor: '', // Este será ahora para nit_ide
    proveedorNombre: '', // Nuevo campo para nit_nom
    observaciones: '',
    nit_sec: '',
    actualiza_fecha: 'N' // Nuevo campo
  });

  // Estado para detalle: inicializamos con 10 filas
  const [rows, setRows] = useState(Array(10).fill({ ...initialRow }));

  // Agregar estos nuevos estados
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [currentRowIndex, setCurrentRowIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos del ajuste si estamos en modo edición
  useEffect(() => {
    if (isEditing) {
      const fetchAjuste = async () => {
        try {
          const response = await axios.get(`${API_URL}/inventory/adjustment/${fac_nro}`, {
            headers: {
              'x-access-token': localStorage.getItem('pedidos_pretty_token')
            }
          });

          if (response.data.header) {
            const { header, details } = response.data;

            // Establecer los datos del encabezado
            setHeaderData({
              fecha: header.fac_fec,
              proveedor: header.nit_ide,
              proveedorNombre: header.nit_nom,
              observaciones: header.fac_obs,
              nit_sec: header.nit_sec,
              actualiza_fecha: header.actualiza_fecha
            });

            // Mapear los detalles a la estructura de rows
            const detallesFormateados = details.map(detalle => ({
              art_sec: detalle.art_sec,
              art_cod: detalle.art_cod,
              art_nom: detalle.art_nom,
              kar_nat: detalle.kar_nat,
              kar_uni: detalle.kar_uni,
              saldo_actual: detalle.stock_actual,
              nuevo_saldo: detalle.kar_nat === '+'
                ? detalle.stock_actual + detalle.kar_uni
                : detalle.stock_actual - detalle.kar_uni
            }));

            // Si hay menos detalles que filas iniciales, rellenar con filas vacías
            const filasRestantes = Array(Math.max(0, 10 - detallesFormateados.length))
              .fill({ ...initialRow });

            setRows([...detallesFormateados, ...filasRestantes]);
          }
        } catch (error) {
          console.error('Error al cargar el ajuste:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar el ajuste para edición',
            confirmButtonColor: '#f58ea3'
          });
        }
      };

      fetchAjuste();
    }
  }, [fac_nro, isEditing]);

  // Función para recalcular el nuevo saldo
  const updateNuevoSaldo = (row) => {
    const saldo = Number(row.saldo_actual) || 0;
    const ajuste = Number(row.kar_uni) || 0;
    return row.kar_nat === '+' ? saldo + ajuste : saldo - ajuste;
  };

  // Manejo de cambios en cada fila
  const handleRowChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value
    };
    if (field === 'kar_uni' || field === 'kar_nat' || field === 'saldo_actual') {
      updatedRows[index].nuevo_saldo = updateNuevoSaldo(updatedRows[index]);
    }
    setRows(updatedRows);
  };

  // Agregar una nueva fila al final de la grilla
  const addNewRow = () => {
    setRows([...rows, { ...initialRow }]);
  };

  // Funciones para acciones finales
  const handleGuardar = async () => {
    setIsSubmitting(true);
    try {
      // Validaciones
      if (!headerData.fecha) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: 'La fecha es requerida',
          confirmButtonColor: '#f58ea3'
        });
        setIsSubmitting(false);
        return;
      }

      if (!headerData.nit_sec) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: 'El proveedor es requerido',
          confirmButtonColor: '#f58ea3'
        });
        setIsSubmitting(false);
        return;
      }

      // Validar que todos los artículos con código tengan unidades
      const articulosSinUnidades = rows.filter(row =>
        row.art_cod && (!row.kar_uni || Number(row.kar_uni) <= 0)
      );

      if (articulosSinUnidades.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: `Los siguientes artículos no tienen unidades: ${articulosSinUnidades.map(row => row.art_cod).join(', ')}`,
          confirmButtonColor: '#f58ea3'
        });
        setIsSubmitting(false);
        return;
      }

      // Filtrar solo las filas que tienen artículos y cantidades
      const detallesValidos = rows.filter(row =>
        row.art_sec &&
        row.kar_uni &&
        Number(row.kar_uni) > 0
      );

      if (detallesValidos.length === 0) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: 'Debe ingresar al menos un artículo en el detalle',
          confirmButtonColor: '#f58ea3'
        });
        setIsSubmitting(false);
        return;
      }

      // Preparar el payload según la estructura requerida
      const payload = {
        nit_sec: headerData.nit_sec,
        fac_usu_cod_cre: localStorage.getItem('user_pretty'),
        fac_obs: headerData.observaciones,
        fac_fec: headerData.fecha,
        actualiza_fecha: headerData.actualiza_fecha,
        detalles: detallesValidos.map(row => ({
          art_sec: row.art_sec,
          kar_nat: row.kar_nat,
          kar_uni: Number(row.kar_uni),
          kar_pre_pub:  0 // Usando el saldo actual como precio público
        }))
      };

      console.log(payload);
      let response;
      if (isEditing) {
        response = await axios.put(`${API_URL}/inventory/adjustment/${fac_nro}`, payload, {
          headers: {
            'x-access-token': localStorage.getItem('pedidos_pretty_token')
          }
        });
      } else {
        response = await axios.post(`${API_URL}/inventory/adjustment`, payload, {
          headers: {
            'x-access-token': localStorage.getItem('pedidos_pretty_token')
          }
        });
      }

      // Modificación aquí: Siempre mostrar el mensaje si hay respuesta
      const numeroAjuste = isEditing ? fac_nro : response.data.fac_nro;
      await Swal.fire({
        icon: 'success',
        title: 'Ajuste de Inventario',
        text: `El ajuste #${numeroAjuste} ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente`,
        confirmButtonColor: '#f58ea3'
      });

      // Navegar después de que el usuario cierre el mensaje
      navigate('/ajustes');

    } catch (error) {
      console.error('Error al guardar el ajuste:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Error al guardar el ajuste',
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        navigate('/ajustes');
      }
    });
  };

  // Función para abrir búsqueda de proveedor (popup)
  const buscarProveedor = () => {
    setShowProviderModal(true);
  };

  // Función para manejar la selección del proveedor
  const handleSelectProvider = (provider) => {
    setHeaderData(prev => ({
      ...prev,
      proveedor: provider.nit_ide,
      proveedorNombre: provider.nit_nom,
      nit_sec: provider.nit_sec
    }));
  };

  // Función para abrir búsqueda de artículo (popup)
  const buscarArticulo = (index) => {
    setCurrentRowIndex(index);
    setShowArticleModal(true);
  };

  // Función para consultar el artículo cuando se pierde el foco en art_cod
  const handleArtCodBlur = async (index, artCodValue) => {
    if (!artCodValue) return;
    try {
      const response = await axios.get(`${API_URL}/consultarArticuloByArtCod/articulo/${artCodValue}`);
      if (response.data.success) {
        const articulo = response.data.articulo;
        const updatedRows = [...rows];
        updatedRows[index] = {
          ...updatedRows[index],
          art_cod: articulo.art_cod,
          art_nom: articulo.art_nom,
          saldo_actual: articulo.existencia,
          nuevo_saldo: updatedRows[index].kar_uni
            ? (updatedRows[index].kar_nat === '+'
              ? articulo.existencia + Number(updatedRows[index].kar_uni)
              : articulo.existencia - Number(updatedRows[index].kar_uni))
            : articulo.existencia,
          art_sec: articulo.art_sec
        };
        setRows(updatedRows);
      } else {
        // Mostrar toast de error cuando no se encuentra el artículo
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

        // Limpiar los campos de la fila
        const updatedRows = [...rows];
        updatedRows[index] = {
          ...updatedRows[index],
          art_cod: artCodValue, // Mantener el código ingresado
          art_nom: '',
          saldo_actual: '',
          nuevo_saldo: '',
          art_sec: ''
        };
        setRows(updatedRows);
      }
    } catch (error) {
      console.error("Error al consultar artículo:", error);

      // Verificar si es un error de respuesta del servidor
      if (error.response) {
        // Si el servidor responde con un error
        Swal.fire({
          icon: 'error',
          title: 'Artículo no encontrado',
          text: error.response.data.error || 'No se encontró el artículo',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          confirmButtonColor: '#f58ea3'
        });
      } else {
        // Si es un error de conexión
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo consultar el artículo. Por favor, intente nuevamente.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          confirmButtonColor: '#f58ea3'
        });
      }

      // Limpiar los campos de la fila en caso de error
      const updatedRows = [...rows];
      updatedRows[index] = {
        ...updatedRows[index],
        art_cod: artCodValue, // Mantener el código ingresado
        art_nom: '',
        saldo_actual: '',
        nuevo_saldo: '',
        art_sec: ''
      };
      setRows(updatedRows);
    }
  };

  const handleSelectArticle = (article) => {
    if (currentRowIndex !== null) {
      const updatedRows = [...rows];
      updatedRows[currentRowIndex] = {
        ...updatedRows[currentRowIndex],
        art_cod: article.codigo,
        art_nom: article.name,
        saldo_actual: article.existencia,
        art_sec: article.id,
        nuevo_saldo: updateNuevoSaldo({
          ...updatedRows[currentRowIndex],
          saldo_actual: article.existencia
        })
      };
      setRows(updatedRows);
    }
    setShowArticleModal(false);
  };

  // Agregar esta nueva función para manejar la búsqueda del proveedor cuando se pierde el foco
  const handleProveedorBlur = async (nitValue) => {
    if (!nitValue) return;

    try {
      const response = await axios.get(`${API_URL}/proveedor/${nitValue}`, {
        headers: {
          'x-access-token': localStorage.getItem('pedidos_pretty_token')
        }
      });

      // Si la respuesta es exitosa, actualizamos los campos del proveedor
      if (response.data && response.data.nit_sec) {
        setHeaderData(prev => ({
          ...prev,
          proveedor: response.data.nit_ide,
          proveedorNombre: response.data.nit_nom,
          nit_sec: response.data.nit_sec
        }));
      }
    } catch (error) {
      console.error("Error al consultar proveedor:", error);
      // Mostrar mensaje de error al usuario
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Proveedor no encontrado',
        confirmButtonColor: '#f58ea3'
      });

      // Limpiar los campos del proveedor
      setHeaderData(prev => ({
        ...prev,
        proveedorNombre: '',
        nit_sec: ''
      }));
    }
  };

  return (
    <div className="p-2 sm:p-4 max-w-full sm:max-w-4xl mx-auto bg-gray-50">
      {/* Overlay de carga */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-50">
          <FaSpinner className="animate-spin text-4xl text-[#f58ea3] mb-4" />
          <p className="text-gray-600 font-medium">Guardando ajuste...</p>
          <p className="text-sm text-gray-500 mt-2">Por favor espere mientras procesamos su solicitud</p>
        </div>
      )}

      {/* Sección de Encabezado */}
      <div className="bg-white p-2 sm:p-4 rounded shadow mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800">
          {isEditing ? `Editar Ajuste de Inventario #${fac_nro}` : 'Nuevo Ajuste de Inventario'}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha</label>
            <input
              type="date"
              value={headerData.fecha}
              onChange={(e) => setHeaderData({ ...headerData, fecha: e.target.value })}
              className="mt-1 block w-full p-2 border rounded text-sm focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
            />
          </div>
          {/* NIT Proveedor */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">NIT Proveedor</label>
            <div className="flex">
              <input
                type="text"
                value={headerData.proveedor}
                onChange={(e) => setHeaderData({ ...headerData, proveedor: e.target.value })}
                onBlur={(e) => handleProveedorBlur(e.target.value)}
                className="mt-1 block w-full p-2 border rounded-l text-sm focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                placeholder="Ingrese NIT..."
              />
              <button
                onClick={buscarProveedor}
                className="mt-1 px-3 py-2 bg-[#fff5f7] border border-l-0 rounded-r hover:bg-[#fce7eb] transition-colors"
              >
                <FaSearch className="text-[#f58ea3]" />
              </button>
            </div>
          </div>
          {/* Nombre Proveedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre Proveedor</label>
            <input
              type="text"
              value={headerData.proveedorNombre}
              readOnly
              className="mt-1 block w-full p-2 border rounded bg-gray-50 text-sm"
              placeholder="Nombre del proveedor..."
            />
          </div>
          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea
              value={headerData.observaciones}
              onChange={(e) => setHeaderData({ ...headerData, observaciones: e.target.value })}
              className="mt-1 block w-full p-2 border rounded text-sm focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
              rows={2}
            ></textarea>
          </div>
          {/* Actualizar Fecha Woo */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={headerData.actualiza_fecha === 'S'}
                onChange={(e) => setHeaderData({ ...headerData, actualiza_fecha: e.target.checked ? 'S' : 'N' })}
                className="h-4 w-4 text-[#f58ea3] focus:ring-[#f58ea3] border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Actualizar Fecha Woo</span>
            </label>
          </div>
        </div>
      </div>

      {/* Sección de Detalle del Ajuste */}
      <div className="bg-white p-2 sm:p-4 rounded shadow mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-gray-800">Detalle del Ajuste</h3>

        {/* Vista móvil */}
        <div className="block sm:hidden">
          <div className="space-y-4">
            {rows.map((row, index) => (
              <div key={index} className="border rounded-lg p-2 bg-gray-50">
                <div className="grid grid-cols-1 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-gray-500">Código</label>
                    <div className="flex space-x-1">
                      <input
                        type="text"
                        value={row.art_cod}
                        onChange={(e) => handleRowChange(index, 'art_cod', e.target.value)}
                        onBlur={(e) => handleArtCodBlur(index, e.target.value)}
                        className="w-full p-1 border rounded text-xs"
                      />
                      <button
                        onClick={() => buscarArticulo(index)}
                        className="p-1 border rounded bg-[#fff5f7] hover:bg-[#fce7eb] transition-colors"
                      >
                        <FaSearch className="text-[#f58ea3] w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-semibold">Naturaleza del Ajuste</label>
                    <select
                      value={row.kar_nat}
                      onChange={(e) => handleRowChange(index, 'kar_nat', e.target.value)}
                      className="w-full p-2 border-2 rounded text-sm font-medium focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                      style={{ minWidth: '100%' }}
                    >
                      <option value="+">➕ Positivo (+) - Agregar unidades</option>
                      <option value="-">➖ Negativo (-) - Restar unidades</option>
                    </select>
                  </div>
                </div>

                {/* Nombre del producto en fila completa */}
                <div className="mb-2">
                  <label className="text-xs text-gray-500">Nombre del Artículo</label>
                  <input
                    type="text"
                    value={row.art_nom}
                    readOnly
                    className="w-full p-1 border rounded text-xs bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Cantidad</label>
                    <input
                      type="number"
                      value={row.kar_uni}
                      onChange={(e) => handleRowChange(index, 'kar_uni', e.target.value)}
                      className="w-full p-1 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Saldo</label>
                    <input
                      type="number"
                      value={row.saldo_actual}
                      readOnly
                      className="w-full p-1 border rounded text-xs bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Nuevo</label>
                    <input
                      type="number"
                      value={row.nuevo_saldo}
                      readOnly
                      className="w-full p-1 border rounded text-xs bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vista desktop (tabla original) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 text-xs font-medium text-gray-700">Art. Cod</th>
                <th className="px-2 py-1 text-xs font-medium text-gray-700">Buscar</th>
                <th className="px-2 py-1 text-xs font-medium text-gray-700">Art. Nom</th>
                <th className="px-2 py-1 text-xs font-medium text-gray-700" style={{ minWidth: '180px', width: '180px' }}>Naturaleza</th>
                <th className="px-2 py-1 text-xs font-medium text-gray-700">Cant.</th>
                <th className="px-2 py-1 text-xs font-medium text-gray-700">Actual</th>
                <th className="px-2 py-1 text-xs font-medium text-gray-700">Nuevo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row, index) => (
                <tr key={index}>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={row.art_cod}
                      onChange={(e) => handleRowChange(index, 'art_cod', e.target.value)}
                      onBlur={(e) => handleArtCodBlur(index, e.target.value)}
                      className="w-full p-1 border rounded text-xs"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <button
                      onClick={() => buscarArticulo(index)}
                      className="p-1 border rounded bg-[#fff5f7] hover:bg-[#fce7eb] transition-colors"
                    >
                      <FaSearch className="text-[#f58ea3] w-3 h-3" />
                    </button>
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={row.art_nom}
                      readOnly
                      className="w-full p-1 border rounded text-xs bg-gray-50"
                    />
                  </td>
                  <td className="px-2 py-1" style={{ minWidth: '180px', width: '180px' }}>
                    <select
                      value={row.kar_nat}
                      onChange={(e) => handleRowChange(index, 'kar_nat', e.target.value)}
                      className="w-full p-2 border-2 rounded text-sm font-medium focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                      style={{ minWidth: '180px' }}
                    >
                      <option value="+">➕ Positivo (+) - Agregar unidades</option>
                      <option value="-">➖ Negativo (-) - Restar unidades</option>
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      value={row.kar_uni}
                      onChange={(e) => handleRowChange(index, 'kar_uni', e.target.value)}
                      className="w-full p-1 border rounded text-xs"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      value={row.saldo_actual}
                      readOnly
                      className="w-full p-1 border rounded text-xs bg-gray-50"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      value={row.nuevo_saldo}
                      readOnly
                      className="w-full p-1 border rounded text-xs bg-gray-50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 sm:mt-4">
          <button
            onClick={addNewRow}
            className="w-full sm:w-auto px-4 py-2 bg-[#f58ea3] text-white rounded hover:bg-[#f7b3c2] transition-colors text-sm"
          >
            Agregar Nuevo
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
        <button
          onClick={handleCancelar}
          className="w-full sm:w-auto px-4 py-2 border border-[#f58ea3] text-[#f58ea3] rounded hover:bg-[#fff5f7] transition-colors text-sm"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          className="w-full sm:w-auto px-4 py-2 bg-[#f58ea3] text-white rounded hover:bg-[#f7b3c2] transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <FaSpinner className="animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            'Guardar'
          )}
        </button>
      </div>

      <ArticleSearchModal
        isOpen={showArticleModal}
        onClose={() => setShowArticleModal(false)}
        onSelectArticle={handleSelectArticle}
      />

      <ProviderSearchModal
        isOpen={showProviderModal}
        onClose={() => setShowProviderModal(false)}
        onSelectProvider={handleSelectProvider}
      />

      {/* Estilos globales */}
      <style global jsx>{`
        .focus-within\\:ring-2:focus-within {
          --tw-ring-color: #f58ea3;
        }
        input:focus, select:focus, textarea:focus {
          --tw-ring-color: #f58ea3;
          --tw-border-opacity: 1;
          border-color: rgba(245, 142, 163, var(--tw-border-opacity));
        }
        .hover\\:bg-brand:hover {
          background-color: #f7b3c2;
        }
      `}</style>
    </div>
  );
};

export default InventoryAdjustment;

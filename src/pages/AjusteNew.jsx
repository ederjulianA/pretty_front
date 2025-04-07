import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const initialRow = {
  art_cod: '',
  art_nom: '',
  kar_nat: '+',  // Valor por defecto: "Positivo"
  kar_uni: '',
  saldo_actual: '',  // Este campo se debe cargar tras la búsqueda del artículo
  nuevo_saldo: ''    // Se calcula automáticamente
};

const InventoryAdjustment = () => {
  // Estado para encabezado
  const [headerData, setHeaderData] = useState({
    fecha: '',
    proveedor: '',
    observaciones: '',
  });

  // Estado para detalle: inicializamos con 10 filas
  const [rows, setRows] = useState(Array(10).fill({ ...initialRow }));

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
  const navigate = useNavigate();

  const handleGuardar = async () => {
    try {
      // Validaciones
      if (!headerData.fecha) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: 'La fecha es requerida',
          confirmButtonColor: '#f58ea3'
        });
        return;
      }

      if (!headerData.proveedor) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: 'El proveedor es requerido',
          confirmButtonColor: '#f58ea3'
        });
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
        return;
      }

      // Preparar el payload según la estructura requerida
      const payload = {
        nit_sec: headerData.proveedor,
        fac_usu_cod_cre: localStorage.getItem('user_pretty'),
        fac_obs: headerData.observaciones,
        fac_fec: headerData.fecha,
        detalles: detallesValidos.map(row => ({
          art_sec: row.art_sec,
          kar_nat: row.kar_nat,
          kar_uni: Number(row.kar_uni),
          kar_pre_pub: Number(row.saldo_actual) || 0 // Usando el saldo actual como precio público
        }))
      };

      // Llamar al endpoint
      const response = await axios.post(`${API_URL}/inventory/adjustment`, payload, {
        headers: {
          'x-access-token': localStorage.getItem('pedidos_pretty_token')
        }
      });

      // Manejar la respuesta exitosa
      if (response.data.fac_nro) {
        await Swal.fire({
          icon: 'success',
          title: 'Ajuste guardado exitosamente',
          text: `Número de ajuste: ${response.data.fac_nro}`,
          confirmButtonColor: '#f58ea3'
        });

        // Redirigir a la lista de ajustes
        navigate('/ajustes');
      }
    } catch (error) {
      console.error('Error al guardar el ajuste:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Error al guardar el ajuste',
        confirmButtonColor: '#f58ea3'
      });
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
    // Aquí se puede implementar la lógica para levantar un prompt o modal de búsqueda
    console.log("Buscar proveedor");
  };

  // Función para abrir búsqueda de artículo (popup)
  const buscarArticulo = (index) => {
    // Lógica para buscar y seleccionar artículo
    console.log("Buscar artículo en fila", index);
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
            art_cod: articulo.art_cod,  // Se actualiza el código (podrías conservar lo ingresado si lo prefieres)
            art_nom: articulo.art_nom,
           
            saldo_actual: articulo.existencia,
            nuevo_saldo: updatedRows[index].kar_uni 
              ? (updatedRows[index].kar_nat === '+' 
                  ? articulo.existencia + Number(updatedRows[index].kar_uni)
                  : articulo.existencia - Number(updatedRows[index].kar_uni))
              : articulo.existencia,
            art_sec: articulo.art_sec  // Guardamos el identificador para trazabilidad
          };
          setRows(updatedRows);
        }
      } catch (error) {
        console.error("Error al consultar artículo:", error);
      }
    };

  return (
    <div className="p-4 max-w-4xl mx-auto bg-gray-50">
      {/* Sección de Encabezado */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Ajuste de Inventarios</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha</label>
            <input
              type="date"
              value={headerData.fecha}
              onChange={(e) => setHeaderData({...headerData, fecha: e.target.value})}
              className="mt-1 block w-full p-2 border rounded"
            />
          </div>
          {/* Proveedor */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Proveedor</label>
            <input
              type="text"
              value={headerData.proveedor}
              onChange={(e) => setHeaderData({...headerData, proveedor: e.target.value})}
              className="mt-1 block w-full p-2 border rounded pr-10"
            />
            <button
              onClick={buscarProveedor}
              className="absolute inset-y-0 right-0 flex items-center px-2"
            >
              <FaSearch className="text-gray-500" />
            </button>
          </div>
          {/* Observaciones */}
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea
              value={headerData.observaciones}
              onChange={(e) => setHeaderData({...headerData, observaciones: e.target.value})}
              className="mt-1 block w-full p-2 border rounded"
              rows={3}
            ></textarea>
          </div>
        </div>
      </div>

      {/* Sección de Detalle del Ajuste */}
      <div className="bg-white p-4 rounded shadow mb-6 overflow-x-auto">
        <h3 className="text-lg font-bold mb-4">Detalle del Ajuste</h3>
        <table className="min-w-full table-fixed">
  <thead>
    <tr className="bg-gray-100">
      <th className="px-2 py-1 text-xs font-medium text-gray-700">Art. Cod</th>
      <th className="px-2 py-1 text-xs font-medium text-gray-700">Buscar Artículo</th>
      <th className="px-2 py-1 text-xs font-medium text-gray-700">Art. Nom</th>
      <th className="px-2 py-1 text-xs font-medium text-gray-700">Naturaleza</th>
      <th className="px-2 py-1 text-xs font-medium text-gray-700">Cant. Ajuste</th>
      <th className="px-2 py-1 text-xs font-medium text-gray-700 min-w-[30px]">Saldo Actual</th>
      <th className="px-2 py-1 text-xs font-medium text-gray-700 min-w-[30px]">Nuevo Saldo</th>
    </tr>
  </thead>
  <tbody>
    {rows.map((row, index) => (
      <tr key={index} className="border-t">
        {/* art_cod editable */}
        <td className="px-2 py-1">
          <input
            type="text"
            value={row.art_cod}
            onChange={(e) => handleRowChange(index, 'art_cod', e.target.value)}
            onBlur={(e) => handleArtCodBlur(index, e.target.value)}
            className="w-full p-1 border rounded text-xs"
          />
        </td>
        {/* Botón para búsqueda de artículo */}
        <td className="px-2 py-1">
          <button
            onClick={() => buscarArticulo(index)}
            className="p-1 border rounded bg-gray-200"
          >
            <FaSearch className="text-gray-600" />
          </button>
        </td>
        {/* art_nom no editable */}
        <td className="px-2 py-1">
          <input
            type="text"
            value={row.art_nom}
            readOnly
            className="w-full p-1 border rounded text-xs bg-gray-100"
          />
        </td>
        {/* Naturaleza: combobox */}
        <td className="px-2 py-1">
          <select
            value={row.kar_nat}
            onChange={(e) => handleRowChange(index, 'kar_nat', e.target.value)}
            className="w-full p-1 border rounded text-xs"
          >
            <option value="+">Positivo (+)</option>
            <option value="-">Negativo (-)</option>
          </select>
        </td>
        {/* Cant. Ajuste editable */}
        <td className="px-2 py-1">
          <input
            type="number"
            value={row.kar_uni}
            onChange={(e) => handleRowChange(index, 'kar_uni', e.target.value)}
            className="w-full p-1 border rounded text-xs"
          />
        </td>
        {/* Saldo Actual no editable */}
        <td className="px-2 py-1">
          <input
            type="number"
            value={row.saldo_actual}
            readOnly
            className="w-full p-1 border rounded text-xs bg-gray-100"
          />
        </td>
        {/* Nuevo Saldo no editable */}
        <td className="px-2 py-1">
          <input
            type="number"
            value={row.nuevo_saldo}
            readOnly
            className="w-full p-1 border rounded text-xs bg-gray-100"
          />
        </td>
      </tr>
    ))}
  </tbody>
</table>

        {/* Botón para agregar nueva fila */}
        <div className="mt-4">
          <button
            onClick={addNewRow}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Agregar Nuevo
          </button>
        </div>
      </div>

      {/* Acciones Finales */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleCancelar}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Guardar
        </button>
      </div>
    </div>
  );
};

export default InventoryAdjustment;

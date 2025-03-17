// src/components/CreateClientModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import Swal from 'sweetalert2';

const CreateClientModal = ({ onClose, onClientCreated }) => {
  const [formData, setFormData] = useState({
    nit_ide: '',
    nit_nom: '',
    nit_tel: '',
    nit_email: '',
    nit_dir: '',
    ciu_cod: '',
  });
  const [cities, setCities] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/ciudades`)
      .then(response => {
        const data = response.data;
        if (data.success && data.ciudades) {
          setCities(data.ciudades);
        }
      })
      .catch(error => {
        console.error("Error al obtener ciudades:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las ciudades.',
          confirmButtonColor: '#f58ea3'
        });
      });
  }, []);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    axios.post(`${API_URL}/nits`, formData)
      .then(response => {
        const data = response.data;
        if(data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Cliente creado',
            text: data.message,
            confirmButtonColor: '#f58ea3'
          });
          // [NUEVO] Llamamos al callback pasando la información del cliente creado
          onClientCreated({ ...formData, nit_sec: data.nit_sec });
          onClose();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.message,
            confirmButtonColor: '#f58ea3'
          });
        }
      })
      .catch(error => {
        console.error("Error al crear cliente:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al crear el cliente, por favor intente nuevamente.',
          confirmButtonColor: '#f58ea3'
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 cursor-pointer">
      <div className="bg-white rounded-lg p-6 w-11/12 md:w-1/2 shadow-lg cursor-pointer">
        <h2 className="text-2xl font-bold mb-4 text-center cursor-pointer">Crear Cliente</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-gray-700 mb-1 cursor-pointer">Identificación</label>
            <input
              type="text"
              name="nit_ide"
              value={formData.nit_ide}
              onChange={handleChange}
              placeholder="Ingrese identificación"
              className="w-full p-2 border rounded cursor-pointer"
              required
            />
          </div>
          <div className="mb-3">
            <label className="block text-gray-700 mb-1 cursor-pointer">Nombre</label>
            <input
              type="text"
              name="nit_nom"
              value={formData.nit_nom}
              onChange={handleChange}
              placeholder="Ingrese nombre"
              className="w-full p-2 border rounded cursor-pointer"
              required
            />
          </div>
          <div className="mb-3">
            <label className="block text-gray-700 mb-1 cursor-pointer">Teléfono</label>
            <input
              type="text"
              name="nit_tel"
              value={formData.nit_tel}
              onChange={handleChange}
              placeholder="Ingrese teléfono"
              className="w-full p-2 border rounded cursor-pointer"
            />
          </div>
          <div className="mb-3">
            <label className="block text-gray-700 mb-1 cursor-pointer">Email</label>
            <input
              type="email"
              name="nit_email"
              value={formData.nit_email}
              onChange={handleChange}
              placeholder="Ingrese email"
              className="w-full p-2 border rounded cursor-pointer"
              required
            />
          </div>
          <div className="mb-3">
            <label className="block text-gray-700 mb-1 cursor-pointer">Dirección</label>
            <input
              type="text"
              name="nit_dir"
              value={formData.nit_dir}
              onChange={handleChange}
              placeholder="Ingrese dirección"
              className="w-full p-2 border rounded cursor-pointer"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1 cursor-pointer">Ciudad</label>
            <select
              name="ciu_cod"
              value={formData.ciu_cod}
              onChange={handleChange}
              className="w-full p-2 border rounded cursor-pointer"
              required
            >
              <option value="">Seleccione Ciudad</option>
              {cities.map((city) => (
                <option key={city.ciu_cod} value={city.ciu_cod}>
                  {city.ciu_nom}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded cursor-pointer hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#f58ea3] text-white rounded cursor-pointer hover:bg-[#a5762f]"
            >
              {isSubmitting ? "Creando..." : "Crear Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClientModal;

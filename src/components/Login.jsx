// src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [usuCod, setUsuCod] = useState('');
  const [usuPass, setUsuPass] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log(`LA URL ${API_URL}`);
    try {
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        usu_cod: usuCod,
        usu_pass: usuPass,
      });
      console.log(`LA RESPUESTA ${response}`);
      const data = response.data;
      if (data.success) {
        // Guardamos el token con una clave única para esta app
        localStorage.setItem('pedidos_pretty_token', data.token);
        localStorage.setItem('user_pretty',data.usuario);
        Swal.fire({
          icon: 'success',
          title: 'Login exitoso',
          text: data.message,
          confirmButtonColor: '#f58ea3',
        });
        navigate('/dashboard');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message,
          confirmButtonColor: '#f58ea3',
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al iniciar sesión, por favor intente nuevamente.',
        confirmButtonColor: '#f58ea3',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#fff9e9] cursor-pointer">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-11/12 max-w-md cursor-pointer">
        <h2 className="text-2xl font-bold mb-4 text-center cursor-pointer">Iniciar Sesión ed</h2>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 cursor-pointer">Usuario</label>
          <input
            type="text"
            value={usuCod}
            onChange={(e) => setUsuCod(e.target.value)}
            placeholder="Ingrese su usuario"
            className="w-full p-2 border rounded cursor-pointer"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 cursor-pointer">Contraseña</label>
          <input
            type="password"
            value={usuPass}
            onChange={(e) => setUsuPass(e.target.value)}
            placeholder="Ingrese su contraseña"
            className="w-full p-2 border rounded cursor-pointer"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#f58ea3] text-white p-2 rounded cursor-pointer hover:bg-[#a5762f]"
        >
          {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
};

export default Login;

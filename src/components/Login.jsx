// src/components/Login.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [usuCod, setUsuCod] = useState('');
  const [usuPass, setUsuPass] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuCod || !usuPass) {
      return;
    }
    await login(usuCod, usuPass);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#fff9e9]">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-11/12 max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Iniciar Sesión</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Usuario
          </label>
          <input
            type="text"
            value={usuCod}
            onChange={(e) => setUsuCod(e.target.value)}
            placeholder="Ingrese su usuario"
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#f58ea3] focus:border-transparent"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Contraseña
          </label>
          <input
            type="password"
            value={usuPass}
            onChange={(e) => setUsuPass(e.target.value)}
            placeholder="Ingrese su contraseña"
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#f58ea3] focus:border-transparent"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-[#f58ea3] text-white p-3 rounded font-bold hover:bg-[#a5762f] transition-colors ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              Cargando...
            </div>
          ) : (
            'Iniciar Sesión'
          )}
        </button>
      </form>
    </div>
  );
};

export default Login;

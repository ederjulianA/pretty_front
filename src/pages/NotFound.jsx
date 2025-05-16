import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fff9e9]">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Página no encontrada</h2>
        <p className="text-gray-600 mb-6">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-[#f58ea3] text-white px-6 py-2 rounded hover:bg-[#e57a91] transition-colors"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default NotFound; 
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MODULES = [
  { key: 'dashboard', path: '/dashboard', label: 'Dashboard' },
  { key: 'orders', path: '/orders', label: 'Órdenes' },
  { key: 'ajustes', path: '/ajustes', label: 'Ajustes' },
  { key: 'users', path: '/users', label: 'Usuarios' },
  // Agrega aquí más módulos según tu app
];

const Unauthorized = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();

  const allowedModules = MODULES.filter(
    (mod) => permissions && permissions[mod.key] && permissions[mod.key].access === true
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fff9e9]">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
        <p className="text-gray-600 mb-6">
          Lo sentimos, no tienes permisos para acceder a esta página.
        </p>
    
        {allowedModules.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-700">Páginas a las que tienes acceso:</h2>
            <ul className="space-y-2">
              {allowedModules.map((mod) => (
                <li key={mod.key}>
                  <Link
                    to={mod.path}
                    className="text-[#f58ea3] hover:underline text-base font-medium"
                  >
                    {mod.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Unauthorized;  
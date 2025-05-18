// src/components/Header.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from './ChangePasswordModal';
import { FaShoppingBag } from 'react-icons/fa';

const Header = ({ title }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const menuRef = useRef(null);
  const currentUser = localStorage.getItem('user_pretty');

  // Cerrar el menú cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('pedidos_pretty_token');
    localStorage.removeItem('user_pretty');
    navigate('/login');
  };

  return (
    <div className="bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] shadow flex items-center justify-between px-4 py-2 rounded-xl mb-2 w-full md:max-w-none md:mx-0 md:rounded-none md:mb-0">
      <div className="flex items-center gap-2">
        <FaShoppingBag className="w-6 h-6 text-white" />
        <span className="font-bold text-lg text-white">Pedidos Pretty</span>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="bg-white/30 text-white text-xs px-2 py-1 rounded-lg font-medium whitespace-nowrap">Sistema de Ventas</span>
        
        {/* Menú de usuario */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors"
          >
            <span className="font-medium">{currentUser}</span>
            <svg
              className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Menú desplegable */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
              <button
                onClick={() => {
                  setShowChangePassword(true);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cambiar Contraseña
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de cambio de contraseña */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
};

export default Header;

// src/layouts/AdminLayout.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaChevronDown, FaChevronRight, FaHome, FaBoxOpen, FaUsers, FaClipboardList, FaCogs, FaClipboardCheck, FaBell, FaUserCircle, FaSignOutAlt, FaUsersCog, FaTag, FaCalendarAlt, FaFolderOpen } from 'react-icons/fa';
import logoPretty from '../assets/prettyLogo1.png';
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordModal from '../components/ChangePasswordModal';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const menuRef = useRef(null);
  const { user, hasAccess, hasPermission, logout, cambiaPass, setCambiaPass } = useAuth();
  const navigate = useNavigate();

  // Cierra el sidebar en mobile al seleccionar una opción
  const handleNavClick = () => {
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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
    logout();
    navigate('/login');
  };

  // Handler para cierre exitoso del cambio de contraseña forzado
  const handleForceChangeClose = () => {
    setCambiaPass(false); // Esto ahora persiste en localStorage
    // Opcional: recargar permisos o usuario si es necesario
  };

  // Si el usuario debe cambiar la contraseña, mostrar solo el modal y bloquear el resto
  if (cambiaPass) {
    return (
      <ChangePasswordModal
        isOpen={true}
        onClose={handleForceChangeClose}
        forceChange={true}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#f7f8fa] overflow-hidden">
      {/* Sidebar: Moderno, fijo en desktop y colapsable en mobile */}
      <aside
        className={`bg-white shadow-lg rounded-xl m-4 flex flex-col w-64 fixed md:static top-0 left-0 h-[calc(100vh-2rem)] transition-transform duration-300 z-50 border border-gray-100 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ boxShadow: isSidebarOpen || window.innerWidth >= 768 ? undefined : 'none', left: 0 }}
      >
        {/* Header del sidebar */}
        <div className="flex items-center gap-2 px-6 py-6 border-b">
          <img src={logoPretty} alt="Logo PrettyMakeup" className="w-10 h-10" />
          <span className="font-bold text-lg text-[#f58ea3]">PrettyMakeup</span>
          {/* Botón para cerrar el sidebar en mobile */}
          <button className="md:hidden ml-auto" onClick={toggleSidebar}>
            <FaTimes className="text-2xl" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {/* Dashboard con submenú - Solo visible si tiene permiso */}
            {hasAccess('dashboard') && (
              <li>
                <button
                  onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                  className="w-full flex items-center justify-between px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors text-gray-700"
                >
                  <span className="flex items-center gap-3"><FaHome className="w-5 h-5" /> Dashboard</span>
                  {isDashboardOpen ? <FaChevronDown /> : <FaChevronRight />}
                </button>
                <div className={`pl-8 mt-2 space-y-2 ${isDashboardOpen ? 'block' : 'hidden'}`}> 
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#fff5f7] text-[#f58ea3] border-l-4 border-[#f58ea3]' : 'text-gray-700 hover:bg-gray-100'}`
                    }
                    onClick={handleNavClick}
                  >
                    <FaClipboardCheck className="w-4 h-4" /> Sync Pedidos Woo
                  </NavLink>
                  <NavLink
                    to="/dashboard/ventas"
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#fff5f7] text-[#f58ea3] border-l-4 border-[#f58ea3]' : 'text-gray-700 hover:bg-gray-100'}`
                    }
                    onClick={handleNavClick}
                  >
                    <FaClipboardList className="w-4 h-4" /> Dashboard Ventas
                  </NavLink>
                  <NavLink
                    to="/dashboard/inventario"
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#fff5f7] text-[#f58ea3] border-l-4 border-[#f58ea3]' : 'text-gray-700 hover:bg-gray-100'}`
                    }
                    onClick={handleNavClick}
                  >
                    <FaBoxOpen className="w-4 h-4" /> Diferencia Inventario
                  </NavLink>
                </div>
              </li>
            )}
            
            {/* Productos - Solo visible si tiene permiso */}
            {hasAccess('products') && (
              <li>
                <NavLink
                  to="/products"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-[#fff5f7] text-[#f58ea3] border-l-4 border-[#f58ea3]' : 'text-gray-700 hover:bg-gray-100'}`
                  }
                  onClick={handleNavClick}
                >
                  <FaBoxOpen className="w-5 h-5" /> Productos
                </NavLink>
              </li>
            )}
            
            {/* Clientes - Solo visible si tiene permiso */}
            {hasAccess('clients') && (
              <li>
                <NavLink
                  to="/clients"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-[#fff5f7] text-[#f58ea3] border-l-4 border-[#f58ea3]' : 'text-gray-700 hover:bg-gray-100'}`
                  }
                  onClick={handleNavClick}
                >
                  <FaUsers className="w-5 h-5" /> Clientes
                </NavLink>
              </li>
            )}
            
            {/* Órdenes - Solo visible si tiene permiso */}
            {hasAccess('orders') && (
              <li>
                <NavLink
                  to="/orders"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-[#fff5f7] text-[#f58ea3] border-l-4 border-[#f58ea3]' : 'text-gray-700 hover:bg-gray-100'}`
                  }
                  onClick={handleNavClick}
                >
                  <FaClipboardList className="w-5 h-5" /> Órdenes
                </NavLink>
              </li>
            )}
            
            {/* Ajustes - Solo visible si tiene permiso */}
            {hasAccess('ajustes') && (
              <li>
                <NavLink
                  to="/ajustes"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-[#fff5f7] text-[#f58ea3] border-l-4 border-[#f58ea3]' : 'text-gray-700 hover:bg-gray-100'}`
                  }
                  onClick={handleNavClick}
                >
                  <FaCogs className="w-5 h-5" /> Ajustes
                </NavLink>
              </li>
            )}
            
            {/* Promociones - Solo visible si tiene permiso */}
            {(hasAccess('promociones') || hasRole('Administrador')) && (
              <li>
                <NavLink
                  to="/promociones"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-[#fff5f7] text-[#f58ea3] border-l-4 border-[#f58ea3]' : 'text-gray-700 hover:bg-gray-100'}`
                  }
                  onClick={handleNavClick}
                >
                  <FaTag className="w-5 h-5" /> Promociones
                </NavLink>
              </li>
            )}
            
            {/* Eventos Promocionales */}
            <li>
              <NavLink
                to="/eventos-promocionales"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-[#fff5f7] text-[#f58ea3] border-l-4 border-[#f58ea3]' : 'text-gray-700 hover:bg-gray-100'}`
                }
                onClick={handleNavClick}
              >
                <FaCalendarAlt className="w-5 h-5" /> Eventos Promocionales
              </NavLink>
            </li>
            
            {/* Conteos - Solo visible si tiene permiso */}
            {hasAccess('conteos') && (
              <li>
                <NavLink
                  to="/conteos"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-[#fff5f7] text-[#f58ea3] border-l-4 border-[#f58ea3]' : 'text-gray-700 hover:bg-gray-100'}`
                  }
                  onClick={handleNavClick}
                >
                  <FaClipboardList className="w-5 h-5" /> Conteos
                </NavLink>
              </li>
            )}
            
            {/* POS - Acceso rápido solo si tiene permiso */}
            {hasAccess('pos') && (
              <li>
                <NavLink
                  to="/pos"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-[#fff5f7] text-[#f58ea3] border-l-4 border-[#f58ea3]' : 'text-gray-700 hover:bg-gray-100'}`
                  }
                  onClick={handleNavClick}
                >
                  <FaClipboardCheck className="w-5 h-5" /> POS
                </NavLink>
              </li>
            )}

            {/* Configuraciones - Solo visible si tiene acceso al módulo products o admin */}
            {(hasAccess('products') || hasAccess('admin')) && (
              <li>
                <button
                  onClick={() => setIsConfigOpen(!isConfigOpen)}
                  className="w-full flex items-center justify-between px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors text-gray-700"
                >
                  <span className="flex items-center gap-3">
                    <FaCogs className="w-5 h-5" /> Configuraciones
                  </span>
                  {isConfigOpen ? <FaChevronDown /> : <FaChevronRight />}
                </button>
                <div className={`pl-8 mt-2 space-y-2 ${isConfigOpen ? 'block' : 'hidden'}`}>
                  {/* Categorías */}
                  {hasAccess('products') && (
                    <NavLink
                      to="/configuraciones/categorias"
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#fff5f7] text-[#f58ea3] border-l-4 border-[#f58ea3]' : 'text-gray-700 hover:bg-gray-100'}`
                      }
                      onClick={handleNavClick}
                    >
                      <FaFolderOpen className="w-4 h-4" /> Categorías
                    </NavLink>
                  )}
                </div>
              </li>
            )}

            {/* Seguridad - Solo visible si tiene acceso al módulo admin */}
            {hasAccess('admin') && (
              <li>
                <button
                  onClick={() => setIsSecurityOpen(!isSecurityOpen)}
                  className="w-full flex items-center justify-between px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors text-gray-700"
                >
                  <span className="flex items-center gap-3">
                    <FaUsersCog className="w-5 h-5" /> Seguridad
                  </span>
                  {isSecurityOpen ? <FaChevronDown /> : <FaChevronRight />}
                </button>
                <div className={`pl-8 mt-2 space-y-2 ${isSecurityOpen ? 'block' : 'hidden'}`}>
                  {/* Roles y Permisos */}
                  {hasPermission('admin', 'manage_roles') && (
                    <NavLink
                      to="/admin/roles"
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#fff5f7] text-[#f58ea3] border-l-4 border-[#f58ea3]' : 'text-gray-700 hover:bg-gray-100'}`
                      }
                      onClick={handleNavClick}
                    >
                      <FaUsersCog className="w-4 h-4" /> Roles y Permisos
                    </NavLink>
                  )}
                  {/* Usuarios */}
                  {hasPermission('admin', 'manage_users') && (
                    <NavLink
                      to="/admin/users"
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#fff5f7] text-[#f58ea3] border-l-4 border-[#f58ea3]' : 'text-gray-700 hover:bg-gray-100'}`
                      }
                      onClick={handleNavClick}
                    >
                      <FaUsers className="w-4 h-4" /> Usuarios
                    </NavLink>
                  )}
                </div>
              </li>
            )}
            
            {/* Cerrar sesión */}
            <li className="mt-auto">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <FaSignOutAlt className="w-5 h-5" /> Cerrar Sesión
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Header moderno */}
        <header className="bg-white shadow-lg rounded-xl m-4 mb-0 flex items-center justify-between px-6 py-4 min-h-[64px]">
          {/* Botón para abrir el sidebar en mobile */}
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={toggleSidebar}>
              <FaBars className="text-2xl text-[#f58ea3]" />
            </button>
            <h1 className="text-xl font-bold text-[#f58ea3] ml-1">Panel Administrativo</h1>
          </div>
          {/* Iconos de usuario y notificación */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full hover:bg-[#fff5f7] transition-colors">
              <FaBell className="text-xl text-[#f58ea3]" />
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 hover:bg-[#fff5f7] p-2 rounded-lg transition-colors"
              >
                <FaUserCircle className="text-2xl text-[#f58ea3]" />
                <span className="hidden sm:block font-medium text-gray-700">{user || 'Usuario'}</span>
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
        </header>
        <main className="flex-1 p-8 overflow-auto bg-[#f7f8fa]">
          <Outlet />
        </main>
      </div>

      {/* Modal de cambio de contraseña */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
};

export default AdminLayout;

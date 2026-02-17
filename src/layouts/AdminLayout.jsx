// src/layouts/AdminLayout.jsx - REDISEÑO UX/UI v2
// Operativo Premium: Denso pero respirable, profesional con identidad cosmética
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaChevronDown, FaChevronRight, FaHome, FaBoxOpen, FaUsers, FaClipboardList, FaCogs, FaClipboardCheck, FaBell, FaUserCircle, FaSignOutAlt, FaUsersCog, FaTag, FaCalendarAlt, FaFolderOpen, FaChartLine, FaShoppingCart } from 'react-icons/fa';
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
  const { user, hasAccess, hasPermission, hasRole, logout, cambiaPass, setCambiaPass } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    setCambiaPass(false);
  };

  // Generar breadcrumbs basados en la ruta actual
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    const breadcrumbMap = {
      'dashboard': 'Dashboard',
      'ventas': 'Dashboard Ventas',
      'inventario': 'Diferencia Inventario',
      'costos': 'Control de Costos',
      'products': 'Productos',
      'clients': 'Clientes',
      'orders': 'Órdenes',
      'compras': 'Compras',
      'ajustes': 'Ajustes',
      'promociones': 'Promociones',
      'eventos-promocionales': 'Eventos Promocionales',
      'conteos': 'Conteos',
      'pos': 'POS',
      'configuraciones': 'Configuraciones',
      'categorias': 'Categorías',
      'admin': 'Administración',
      'roles': 'Roles y Permisos',
      'users': 'Usuarios'
    };

    if (pathnames.length === 0) return [{ label: 'Dashboard', path: '/dashboard' }];

    return pathnames.map((path, index) => {
      const routePath = `/${pathnames.slice(0, index + 1).join('/')}`;
      return {
        label: breadcrumbMap[path] || path.charAt(0).toUpperCase() + path.slice(1),
        path: routePath
      };
    });
  };

  const breadcrumbs = generateBreadcrumbs();

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
    <div className="flex h-screen bg-[#fafbfc] overflow-hidden">
      {/* SIDEBAR REDISEÑADO - Operativo Premium */}
      <aside
        className={`bg-[#fafbfc] flex flex-col w-60 fixed md:static top-0 left-0 h-screen transition-transform duration-300 z-50 border-r border-[#e8eaed] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Logo + Brand - Compacto */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#e8eaed]">
          <img src={logoPretty} alt="Logo" className="w-8 h-8" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-[#2c2c2c] leading-tight">PrettyMakeup</span>
            <span className="text-[10px] text-[#7a7a7a] uppercase tracking-wider font-medium">ERP System</span>
          </div>
          {/* Botón cerrar sidebar mobile */}
          <button className="md:hidden ml-auto p-1" onClick={toggleSidebar}>
            <FaTimes className="text-lg text-[#7a7a7a]" />
          </button>
        </div>

        {/* Navegación - Densidad Operativa */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {/* Dashboard con submenú */}
            {hasAccess('dashboard') && (
              <li>
                <button
                  onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium text-[#2c2c2c] hover:bg-[#f5f6f7] transition-colors duration-150"
                >
                  <span className="flex items-center gap-2.5">
                    <FaHome className="w-[18px] h-[18px] text-[#7a7a7a]" />
                    Dashboard
                  </span>
                  {isDashboardOpen ?
                    <FaChevronDown className="w-3 h-3 text-[#7a7a7a]" /> :
                    <FaChevronRight className="w-3 h-3 text-[#7a7a7a]" />
                  }
                </button>

                {/* Submenú con slide animation */}
                <div
                  className={`overflow-hidden transition-all duration-200 ease-out ${isDashboardOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}
                >
                  <div className="pl-7 space-y-1"> 
                    <NavLink
                      to="/dashboard"
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-normal transition-colors duration-150 ${
                          isActive
                            ? 'bg-[#fff5f7] text-[#f58ea3] border-l-3 border-[#f58ea3] pl-[10px]'
                            : 'text-[#5a5a5a] hover:bg-[#f5f6f7] hover:text-[#2c2c2c]'
                        }`
                      }
                      onClick={handleNavClick}
                    >
                      <FaClipboardCheck className="w-4 h-4" />
                      Sync Pedidos Woo
                    </NavLink>
                    <NavLink
                      to="/dashboard/ventas"
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-normal transition-colors duration-150 ${
                          isActive
                            ? 'bg-[#fff5f7] text-[#f58ea3] border-l-3 border-[#f58ea3] pl-[10px]'
                            : 'text-[#5a5a5a] hover:bg-[#f5f6f7] hover:text-[#2c2c2c]'
                        }`
                      }
                      onClick={handleNavClick}
                    >
                      <FaClipboardList className="w-4 h-4" />
                      Dashboard Ventas
                    </NavLink>
                    <NavLink
                      to="/dashboard/inventario"
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-normal transition-colors duration-150 ${
                          isActive
                            ? 'bg-[#fff5f7] text-[#f58ea3] border-l-3 border-[#f58ea3] pl-[10px]'
                            : 'text-[#5a5a5a] hover:bg-[#f5f6f7] hover:text-[#2c2c2c]'
                        }`
                      }
                      onClick={handleNavClick}
                    >
                      <FaBoxOpen className="w-4 h-4" />
                      Diferencia Inventario
                    </NavLink>
                    <NavLink
                      to="/dashboard/costos"
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-normal transition-colors duration-150 ${
                          isActive
                            ? 'bg-[#fff5f7] text-[#f58ea3] border-l-3 border-[#f58ea3] pl-[10px]'
                            : 'text-[#5a5a5a] hover:bg-[#f5f6f7] hover:text-[#2c2c2c]'
                        }`
                      }
                      onClick={handleNavClick}
                    >
                      <FaChartLine className="w-4 h-4" />
                      Control de Costos
                    </NavLink>
                  </div>
                </div>
              </li>
            )}
            
            {/* Productos */}
            {hasAccess('products') && (
              <li>
                <NavLink
                  to="/products"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#fff5f7] text-[#f58ea3] border-l-3 border-[#f58ea3] pl-[10px]'
                        : 'text-[#2c2c2c] hover:bg-[#f5f6f7]'
                    }`
                  }
                  onClick={handleNavClick}
                >
                  <FaBoxOpen className="w-[18px] h-[18px]" />
                  Productos
                </NavLink>
              </li>
            )}
            
            {/* Clientes */}
            {hasAccess('clients') && (
              <li>
                <NavLink
                  to="/clients"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#fff5f7] text-[#f58ea3] border-l-3 border-[#f58ea3] pl-[10px]'
                        : 'text-[#2c2c2c] hover:bg-[#f5f6f7]'
                    }`
                  }
                  onClick={handleNavClick}
                >
                  <FaUsers className="w-[18px] h-[18px]" />
                  Clientes
                </NavLink>
              </li>
            )}
            
            {/* Órdenes */}
            {hasAccess('orders') && (
              <li>
                <NavLink
                  to="/orders"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#fff5f7] text-[#f58ea3] border-l-3 border-[#f58ea3] pl-[10px]'
                        : 'text-[#2c2c2c] hover:bg-[#f5f6f7]'
                    }`
                  }
                  onClick={handleNavClick}
                >
                  <FaClipboardList className="w-[18px] h-[18px]" />
                  Órdenes
                </NavLink>
              </li>
            )}

            {/* Compras */}
            {hasAccess('dashboard') && (
              <li>
                <NavLink
                  to="/compras"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#fff5f7] text-[#f58ea3] border-l-3 border-[#f58ea3] pl-[10px]'
                        : 'text-[#2c2c2c] hover:bg-[#f5f6f7]'
                    }`
                  }
                  onClick={handleNavClick}
                >
                  <FaShoppingCart className="w-[18px] h-[18px]" />
                  Compras
                </NavLink>
              </li>
            )}
            
            {/* Ajustes */}
            {hasAccess('ajustes') && (
              <li>
                <NavLink
                  to="/ajustes"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#fff5f7] text-[#f58ea3] border-l-3 border-[#f58ea3] pl-[10px]'
                        : 'text-[#2c2c2c] hover:bg-[#f5f6f7]'
                    }`
                  }
                  onClick={handleNavClick}
                >
                  <FaCogs className="w-[18px] h-[18px]" />
                  Ajustes
                </NavLink>
              </li>
            )}
            
            {/* Promociones */}
            {(hasAccess('promociones') || hasRole('Administrador')) && (
              <li>
                <NavLink
                  to="/promociones"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#fff5f7] text-[#f58ea3] border-l-3 border-[#f58ea3] pl-[10px]'
                        : 'text-[#2c2c2c] hover:bg-[#f5f6f7]'
                    }`
                  }
                  onClick={handleNavClick}
                >
                  <FaTag className="w-[18px] h-[18px]" />
                  Promociones
                </NavLink>
              </li>
            )}
            
            {/* Eventos Promocionales */}
            <li>
              <NavLink
                to="/eventos-promocionales"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#fff5f7] text-[#f58ea3] border-l-3 border-[#f58ea3] pl-[10px]'
                      : 'text-[#2c2c2c] hover:bg-[#f5f6f7]'
                  }`
                }
                onClick={handleNavClick}
              >
                <FaCalendarAlt className="w-[18px] h-[18px]" />
                Eventos Promocionales
              </NavLink>
            </li>
            
            {/* Conteos */}
            {hasAccess('conteos') && (
              <li>
                <NavLink
                  to="/conteos"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#fff5f7] text-[#f58ea3] border-l-3 border-[#f58ea3] pl-[10px]'
                        : 'text-[#2c2c2c] hover:bg-[#f5f6f7]'
                    }`
                  }
                  onClick={handleNavClick}
                >
                  <FaClipboardList className="w-[18px] h-[18px]" />
                  Conteos
                </NavLink>
              </li>
            )}
            
            {/* POS */}
            {hasAccess('pos') && (
              <li>
                <NavLink
                  to="/pos"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#fff5f7] text-[#f58ea3] border-l-3 border-[#f58ea3] pl-[10px]'
                        : 'text-[#2c2c2c] hover:bg-[#f5f6f7]'
                    }`
                  }
                  onClick={handleNavClick}
                >
                  <FaClipboardCheck className="w-[18px] h-[18px]" />
                  POS
                </NavLink>
              </li>
            )}

            {/* Configuraciones */}
            {(hasAccess('products') || hasAccess('admin')) && (
              <li>
                <button
                  onClick={() => setIsConfigOpen(!isConfigOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium text-[#2c2c2c] hover:bg-[#f5f6f7] transition-colors duration-150"
                >
                  <span className="flex items-center gap-2.5">
                    <FaCogs className="w-[18px] h-[18px] text-[#7a7a7a]" />
                    Configuraciones
                  </span>
                  {isConfigOpen ?
                    <FaChevronDown className="w-3 h-3 text-[#7a7a7a]" /> :
                    <FaChevronRight className="w-3 h-3 text-[#7a7a7a]" />
                  }
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ease-out ${isConfigOpen ? 'max-h-20 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}
                >
                  <div className="pl-7 space-y-1">
                    {hasAccess('products') && (
                      <NavLink
                        to="/configuraciones/categorias"
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-normal transition-colors duration-150 ${
                            isActive
                              ? 'bg-[#fff5f7] text-[#f58ea3] border-l-3 border-[#f58ea3] pl-[10px]'
                              : 'text-[#5a5a5a] hover:bg-[#f5f6f7] hover:text-[#2c2c2c]'
                          }`
                        }
                        onClick={handleNavClick}
                      >
                        <FaFolderOpen className="w-4 h-4" />
                        Categorías
                      </NavLink>
                    )}
                  </div>
                </div>
              </li>
            )}

            {/* Seguridad */}
            {hasAccess('admin') && (
              <li>
                <button
                  onClick={() => setIsSecurityOpen(!isSecurityOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium text-[#2c2c2c] hover:bg-[#f5f6f7] transition-colors duration-150"
                >
                  <span className="flex items-center gap-2.5">
                    <FaUsersCog className="w-[18px] h-[18px] text-[#7a7a7a]" />
                    Seguridad
                  </span>
                  {isSecurityOpen ?
                    <FaChevronDown className="w-3 h-3 text-[#7a7a7a]" /> :
                    <FaChevronRight className="w-3 h-3 text-[#7a7a7a]" />
                  }
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ease-out ${isSecurityOpen ? 'max-h-28 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}
                >
                  <div className="pl-7 space-y-1">
                    {hasPermission('admin', 'manage_roles') && (
                      <NavLink
                        to="/admin/roles"
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-normal transition-colors duration-150 ${
                            isActive
                              ? 'bg-[#fff5f7] text-[#f58ea3] border-l-3 border-[#f58ea3] pl-[10px]'
                              : 'text-[#5a5a5a] hover:bg-[#f5f6f7] hover:text-[#2c2c2c]'
                          }`
                        }
                        onClick={handleNavClick}
                      >
                        <FaUsersCog className="w-4 h-4" />
                        Roles y Permisos
                      </NavLink>
                    )}
                    {hasPermission('admin', 'manage_users') && (
                      <NavLink
                        to="/admin/users"
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-normal transition-colors duration-150 ${
                            isActive
                              ? 'bg-[#fff5f7] text-[#f58ea3] border-l-3 border-[#f58ea3] pl-[10px]'
                              : 'text-[#5a5a5a] hover:bg-[#f5f6f7] hover:text-[#2c2c2c]'
                          }`
                        }
                        onClick={handleNavClick}
                      >
                        <FaUsers className="w-4 h-4" />
                        Usuarios
                      </NavLink>
                    )}
                  </div>
                </div>
              </li>
            )}
          </ul>
        </nav>

        {/* Footer - Usuario actual + Logout */}
        <div className="px-3 py-3 border-t border-[#e8eaed]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-[#5a5a5a] hover:bg-[#f5f6f7] hover:text-[#2c2c2c] transition-colors duration-150"
          >
            <FaSignOutAlt className="w-[18px] h-[18px]" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER REDISEÑADO - Operativo Premium */}
        <header className="bg-white border-b border-[#e8eaed] flex items-center justify-between px-6 h-[60px] flex-shrink-0">
          {/* Left: Hamburger + Breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-1.5 hover:bg-[#f5f6f7] rounded-md transition-colors"
              onClick={toggleSidebar}
            >
              <FaBars className="text-lg text-[#2c2c2c]" />
            </button>

            {/* Breadcrumbs - Prominente */}
            <nav className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="flex items-center gap-2">
                  {index > 0 && <span className="text-[#b0b0b0]">/</span>}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="font-semibold text-[#2c2c2c]">{crumb.label}</span>
                  ) : (
                    <NavLink
                      to={crumb.path}
                      className="text-[#7a7a7a] hover:text-[#f58ea3] transition-colors font-medium"
                    >
                      {crumb.label}
                    </NavLink>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Right: Acciones secundarias */}
          <div className="flex items-center gap-2">
            {/* Notificaciones */}
            <button className="relative p-2 hover:bg-[#f5f6f7] rounded-md transition-colors duration-150">
              <FaBell className="w-[18px] h-[18px] text-[#7a7a7a]" />
            </button>

            {/* Perfil de usuario */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#f5f6f7] rounded-md transition-colors duration-150"
              >
                <FaUserCircle className="w-5 h-5 text-[#7a7a7a]" />
                <span className="hidden sm:block text-sm font-medium text-[#2c2c2c]">{user || 'Usuario'}</span>
                <svg
                  className={`w-3.5 h-3.5 text-[#7a7a7a] transition-transform duration-150 ${showMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-lg border border-[#e8eaed] shadow-lg py-1 z-50">
                  <button
                    onClick={() => {
                      setShowChangePassword(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[#2c2c2c] hover:bg-[#f5f6f7] transition-colors font-medium"
                  >
                    Cambiar Contraseña
                  </button>
                  <div className="h-px bg-[#e8eaed] my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-[#dc3545] hover:bg-[#fff5f6] transition-colors font-medium"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-[#fafbfc] p-6">
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

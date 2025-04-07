// src/layouts/AdminLayout.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import logoPretty from '../assets/prettyLogo1.png';
import axiosInstance from '../axiosConfig';
import Swal from 'sweetalert2';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const navigate = useNavigate();

  const validateToken = async () => {
    const token = localStorage.getItem('pedidos_pretty_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await axiosInstance.get('/articulos', {
        headers: {
          'x-access-token': token
        },
        params: {
          PageNumber: 1,
          PageSize: 1
        }
      });

      if (!response.data.success) {
        throw new Error('Token inválido');
      }
    } catch (error) {
      console.error('Error de validación:', error);
      localStorage.removeItem('pedidos_pretty_token');
      localStorage.removeItem('user_pretty');
      Swal.fire({
        icon: 'error',
        title: 'Sesión expirada',
        text: 'Por favor, inicie sesión nuevamente.',
        confirmButtonColor: '#f58ea3',
      }).then(() => {
        navigate('/login');
      });
    } finally {
      setIsValidatingToken(false);
    }
  };

  useEffect(() => {
    validateToken();
  }, []);

  if (isValidatingToken) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f58ea3]"></div>
      </div>
    );
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar: se muestra fijo en desktop y colapsado en mobile */}
      <aside
        className={`bg-white shadow-lg border-r fixed md:static top-0 left-0 h-full w-64 transform transition-transform duration-300 z-50 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-4 border-b flex items-center justify-between md:justify-center">
          <img src={logoPretty} alt="Logo PrettyMakeup" className="w-32" />
          {/* Botón para cerrar el sidebar en mobile */}
          <button className="md:hidden" onClick={toggleSidebar}>
            <FaTimes className="text-2xl" />
          </button>
        </div>
        <nav className="p-4">
          <ul>
            {/* Menú Dashboard con submenú */}
            <li className="mb-2">
              <button
                onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-200 transition"
              >
                <span>Dashboard</span>
                {isDashboardOpen ? <FaChevronDown /> : <FaChevronRight />}
              </button>
              <div className={`pl-4 mt-2 space-y-2 ${isDashboardOpen ? 'block' : 'hidden'}`}>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `flex items-center p-2 rounded ${
                      isActive
                        ? 'bg-[#f58ea3] text-white'
                        : 'hover:bg-gray-200 transition'
                    }`
                  }
                >
                  Sync Pedidos Woo
                </NavLink>
                <NavLink
                  to="/dashboard/ventas"
                  className={({ isActive }) =>
                    `flex items-center p-2 rounded ${
                      isActive
                        ? 'bg-[#f58ea3] text-white'
                        : 'hover:bg-gray-200 transition'
                    }`
                  }
                >
                  Dashboard Ventas
                </NavLink>
              </div>
            </li>
            <li className="mb-2">
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  isActive
                    ? 'flex items-center p-2 rounded bg-[#f58ea3] text-white'
                    : 'flex items-center p-2 rounded hover:bg-gray-200 transition'
                }
              >
                Productos
              </NavLink>
            </li>
            <li className="mb-2">
              <NavLink
                to="/clients"
                className={({ isActive }) =>
                  isActive
                    ? 'flex items-center p-2 rounded bg-[#f58ea3] text-white'
                    : 'flex items-center p-2 rounded hover:bg-gray-200 transition'
                }
              >
                Clientes
              </NavLink>
            </li>
            <li className="mb-2">
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  isActive
                    ? 'flex items-center p-2 rounded bg-[#f58ea3] text-white'
                    : 'flex items-center p-2 rounded hover:bg-gray-200 transition'
                }
              >
                Órdenes
              </NavLink>
            </li>

            <li className="mb-2">
              <NavLink
                to="/ajustes"
                className={({ isActive }) =>
                  isActive
                    ? 'flex items-center p-2 rounded bg-[#f58ea3] text-white'
                    : 'flex items-center p-2 rounded hover:bg-gray-200 transition'
                }
              >
                Ajustes
              </NavLink>
            </li>
            {/* Se podrán agregar más opciones fácilmente */}
          </ul>
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        <header className="bg-[#f58ea3] text-white p-4 shadow flex items-center justify-between md:justify-start">
          {/* Botón para abrir el sidebar en mobile */}
          <button className="md:hidden" onClick={toggleSidebar}>
            <FaBars className="text-2xl" />
          </button>
          <h1 className="text-xl ml-2">Panel Administrativo</h1>
        </header>
        <main className="flex-1 p-4 overflow-auto bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

// src/layouts/AdminLayout.jsx
import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import logoPretty from '../assets/prettyLogo1.png';
const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
            <li className="mb-2">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive
                    ? 'flex items-center p-2 rounded bg-[#f58ea3] text-white'
                    : 'flex items-center p-2 rounded hover:bg-gray-200 transition'
                }
              >
                Dashboard
              </NavLink>
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

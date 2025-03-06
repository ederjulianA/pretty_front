// src/components/Layout.js
import React from 'react';
import { NavLink } from 'react-router-dom'; // Si usas react-router-dom para la navegación

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen">
      {/* Barra lateral */}
      <aside className="w-64 bg-white shadow-lg border-r">
        <div className="p-4 border-b flex justify-center">
          {/* Logo de la compañía */}
          <img src="/logo.png" alt="Logo PrettyMakeup" className="w-32" />
        </div>
        <nav className="p-4">
          <ul>
            <li className="mb-2">
              <NavLink 
                to="/" 
                className="flex items-center p-2 rounded hover:bg-gray-200 transition cursor-pointer"
                activeClassName="bg-[#f58ea3] text-white"
              >
                <span className="ml-2">Dashboard</span>
              </NavLink>
            </li>
            <li className="mb-2">
              <NavLink 
                to="/orders" 
                className="flex items-center p-2 rounded hover:bg-gray-200 transition cursor-pointer"
                activeClassName="bg-[#f58ea3] text-white"
              >
                <span className="ml-2">Pedidos</span>
              </NavLink>
            </li>
            <li className="mb-2">
              <NavLink 
                to="/clients" 
                className="flex items-center p-2 rounded hover:bg-gray-200 transition cursor-pointer"
                activeClassName="bg-[#f58ea3] text-white"
              >
                <span className="ml-2">Clientes</span>
              </NavLink>
            </li>
            <li className="mb-2">
              <NavLink 
                to="/settings" 
                className="flex items-center p-2 rounded hover:bg-gray-200 transition cursor-pointer"
                activeClassName="bg-[#f58ea3] text-white"
              >
                <span className="ml-2">Configuración</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        <header className="bg-[#f58ea3] text-white p-4 shadow cursor-pointer">
          <h1 className="text-xl">Pedidos Pretty</h1>
        </header>
        <main className="flex-1 p-4 overflow-auto bg-gray-100 cursor-pointer">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

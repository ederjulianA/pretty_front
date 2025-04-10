import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaBox, FaPlusCircle } from 'react-icons/fa';

const AdminLayout = () => {
  return (
    <div>
      {/* ... (otros elementos del layout) ... */}

      <nav className="mt-10">
        {/* ... (otros elementos del menú) ... */}

        {/* Productos */}
        <NavLink
          to="/products"
          className={({ isActive }) =>
            `flex items-center mt-4 py-2 px-6 text-gray-100 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
          }
        >
          <FaBox className="mr-3" />
          Productos
        </NavLink>
        {/* Submenú o enlace para crear producto */}
        <NavLink
          to="/products/create"
          className={({ isActive }) =>
            `flex items-center mt-1 py-2 px-12 text-gray-400 hover:bg-gray-700 hover:text-gray-100 ${isActive ? 'bg-gray-700 text-gray-100' : ''}`
          }
        >
          <FaPlusCircle className="mr-3" />
          Crear Producto
        </NavLink>

        {/* ... (otros elementos del menú) ... */}
      </nav>

      {/* ... (resto del componente) ... */}
    </div>
  );
};

export default AdminLayout; 
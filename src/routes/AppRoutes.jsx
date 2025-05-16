// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Dashboard from '../pages/Dashboard';
import Products from '../pages/Products';
import Clients from '../pages/Clients';
import Orders from '../pages/Orders';
import POS from '../POS2';
import Ajustes from '../pages/Ajustes';
import CreateProduct from '../pages/CreateProduct';
import EditProduct from '../pages/EditProduct';
import Conteos from '../pages/Conteos';
import Unauthorized from '../pages/Unauthorized';
import ProtectedRoute from '../components/ProtectedRoute';
import Roles from '../pages/admin/Roles';
import Users from '../pages/admin/Users';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Ruta POS protegida */}
      <Route 
        path="/pos" 
        element={
          <ProtectedRoute requiredModule="pos" requiredPermission="view">
            <POS />
          </ProtectedRoute>
        } 
      />

      {/* Rutas protegidas con layout de administración */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute requiredModule="dashboard" requiredPermission="view">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Rutas de productos */}
        <Route 
          path="products" 
          element={
            <ProtectedRoute requiredModule="products" requiredPermission="view">
              <Products />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/products/new" 
          element={
            <ProtectedRoute requiredModule="products" requiredPermission="create">
              <CreateProduct />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/products/edit/:id" 
          element={
            <ProtectedRoute requiredModule="products" requiredPermission="edit">
              <EditProduct />
            </ProtectedRoute>
          } 
        />

        {/* Rutas de clientes */}
        <Route 
          path="clients" 
          element={
            <ProtectedRoute requiredModule="clients" requiredPermission="view">
              <Clients />
            </ProtectedRoute>
          } 
        />

        {/* Rutas de órdenes */}
        <Route 
          path="orders" 
          element={
            <ProtectedRoute requiredModule="orders" requiredPermission="view">
              <Orders />
            </ProtectedRoute>
          } 
        />

        {/* Rutas de ajustes */}
        <Route 
          path="ajustes" 
          element={
            <ProtectedRoute requiredModule="ajustes" requiredPermission="view">
              <Ajustes />
            </ProtectedRoute>
          } 
        />

        {/* Rutas de conteos */}
        <Route 
          path="conteos" 
          element={
            <ProtectedRoute requiredModule="conteos" requiredPermission="view">
              <Conteos />
            </ProtectedRoute>
          } 
        />

        {/* Rutas de administración */}
        <Route 
          path="admin/roles" 
          element={
            <ProtectedRoute 
              requiredModule="admin" 
              requiredPermission="manage_roles"
              requiredRole="Administrador"
            >
              <Roles />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="admin/users" 
          element={
            <ProtectedRoute 
              requiredModule="admin" 
              requiredPermission="manage_users"
              requiredRole="Administrador"
            >
              <Users />
            </ProtectedRoute>
          } 
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;

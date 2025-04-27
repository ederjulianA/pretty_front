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

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/pos" element={<POS />} />
      <Route path="/" element={<AdminLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="clients" element={<Clients />} />
        <Route path="orders" element={<Orders />} />
        <Route path="ajustes" element={<Ajustes />} />
        <Route path="/products/new" element={<CreateProduct />} />
        <Route path="/products/edit/:id" element={<EditProduct />} />
        <Route path="/conteos" element={<Conteos />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;

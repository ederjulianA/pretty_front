// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import Dashboard from '../pages/Dashboard';
import Products from '../pages/Products';
import Clients from '../pages/Clients';
import Orders from '../pages/Orders';
import POS from '../POS2';
import CreateProduct from '../pages/CreateProduct';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/pos" element={<POS />} />
      <Route path="/" element={<AdminLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="clients" element={<Clients />} />
        <Route path="orders" element={<Orders />} />
        <Route path="/products/new" element={<CreateProduct />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;

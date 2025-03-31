import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import DashboardVentas from './pages/DashboardVentas';
import Products from './pages/Products';
import CreateProduct from './pages/CreateProduct';
import EditProduct from './pages/EditProduct';
import Orders from './pages/Orders';
import Clients from './pages/Clients';
import POS from './POS2';

export const urlMiPunto = import.meta.env.VITE_MIPUNTO_URL

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('pedidos_pretty_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={<AdminLayout />}>
        {/* Dashboard Routes */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="dashboard/ventas" element={<DashboardVentas />} />
        
        {/* Products Routes */}
        <Route path="products" element={<Products />} />
        <Route path="products/create" element={<CreateProduct />} />
        <Route path="products/edit/:id" element={<EditProduct />} />
        
        {/* Orders Routes */}
        <Route path="orders" element={<Orders />} />
        <Route path="pos" element={<POS />} />
        
        {/* Clients Routes */}
        <Route path="clients" element={<Clients />} />
        
        {/* Default Route */}
        <Route index element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default App;

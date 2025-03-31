import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Login from './components/Login';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import DashboardVentas from './pages/DashboardVentas';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Clients from './pages/Clients';
import CreateProduct from './pages/CreateProduct';
import EditProduct from './pages/EditProduct';
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
        {/* Rutas del Dashboard */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="dashboard/ventas" element={<DashboardVentas />} />
        
        {/* Rutas de Productos */}
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<CreateProduct />} />
        <Route path="products/edit/:id" element={<EditProduct />} />
        
        {/* Rutas de Órdenes */}
        <Route path="orders" element={<Orders />} />
        <Route path="pos" element={<POS />} />
        
        {/* Ruta de Clientes */}
        <Route path="clients" element={<Clients />} />
        
        {/* Ruta por defecto - redirige al dashboard */}
        <Route index element={<Dashboard />} />
      </Route>
      {isAuthenticated ? (
        <Route path="/" element={<AppRoutes />} />
      ) : (
        <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      )}
    </Routes>
  );
}

export default App;

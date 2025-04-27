import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import DashboardVentas from './pages/DashboardVentas';
import Products from './pages/Products';
import CreateProduct from './pages/CreateProduct';
import AjustesNew from './pages/AjusteNew';
import EditProduct from './pages/EditProduct';
import Orders from './pages/Orders';
import Clients from './pages/Clients';
import Ajustes from './pages/Ajustes';
import POS from './POS2';
import Conteos from './pages/Conteos';
import ConteosNew from './pages/ConteoCreate';

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
      <Route path="/pos" element={<POS />} />

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

        {/* Orders Ajustes */}
        <Route path="ajustes" element={<Ajustes />} />
        <Route path="conteos" element={<Conteos />} />
        <Route path="conteos/nuevo" element={<ConteosNew />} />
        <Route path="conteos/nuevo/:id" element={<ConteosNew />} />
        <Route path="ajustes/nuevo" element={<AjustesNew />} />
        <Route path="ajustes/editar/:fac_nro" element={<AjustesNew />} />

        {/* Clients Routes */}
        <Route path="clients" element={<Clients />} />

        {/* Default Route */}
        <Route index element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default App;

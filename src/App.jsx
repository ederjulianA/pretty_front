import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Login from './components/Login';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import DashboardVentas from './pages/DashboardVentas';
import DashboardCostos from './pages/DashboardCostos';
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
import RoleManager from './pages/RoleManager';
import UserManager from './pages/UserManager';
import DiferenciaInventario from './pages/DiferenciaInventario';
import Promociones from './pages/Promociones';
import PromocionNew from './pages/PromocionNew';
import EventosPromocionales from './pages/EventosPromocionales';
import EventoPromocionalNew from './pages/EventoPromocionalNew';
import Categories from './pages/Categories';
import Compras from './pages/Compras';
import CompraForm from './pages/CompraForm';

export const urlMiPunto = import.meta.env.VITE_MIPUNTO_URL

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Ruta POS requiere acceso al módulo pos */}
        <Route 
          path="/pos" 
          element={
            <ProtectedRoute requiredModule="pos" requiredPermission="view">
              <POS />
            </ProtectedRoute>
          } 
        />

        {/* Rutas del panel administrativo */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard Routes */}
          <Route 
            path="dashboard" 
            element={
              <ProtectedRoute requiredModule="dashboard" requiredPermission="view">
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="dashboard/ventas" 
            element={
              <ProtectedRoute requiredModule="dashboard" requiredPermission="view">
                <DashboardVentas />
              </ProtectedRoute>
            } 
          />
          <Route
            path="dashboard/inventario"
            element={
              <ProtectedRoute requiredModule="dashboard" requiredPermission="view">
                <DiferenciaInventario />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard/costos"
            element={
              <ProtectedRoute requiredModule="dashboard" requiredPermission="view">
                <DashboardCostos />
              </ProtectedRoute>
            }
          />

          {/* Products Routes */}
          <Route 
            path="products" 
            element={
              <ProtectedRoute requiredModule="products" requiredPermission="view">
                <Products />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="products/create" 
            element={
              <ProtectedRoute requiredModule="products" requiredPermission="create">
                <CreateProduct />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="products/edit/:id" 
            element={
              <ProtectedRoute requiredModule="products" requiredPermission="edit">
                <EditProduct />
              </ProtectedRoute>
            } 
          />

          {/* Orders Routes */}
          <Route 
            path="orders" 
            element={
              <ProtectedRoute requiredModule="orders" requiredPermission="view">
                <Orders />
              </ProtectedRoute>
            } 
          />

          {/* Compras Routes */}
          <Route
            path="compras"
            element={
              <ProtectedRoute requiredModule="dashboard" requiredPermission="view">
                <Compras />
              </ProtectedRoute>
            }
          />
          <Route
            path="compras/nueva"
            element={
              <ProtectedRoute requiredModule="dashboard" requiredPermission="view">
                <CompraForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="compras/editar/:fac_nro"
            element={
              <ProtectedRoute requiredModule="dashboard" requiredPermission="view">
                <CompraForm />
              </ProtectedRoute>
            }
          />

          {/* Ajustes */}
          <Route 
            path="ajustes" 
            element={
              <ProtectedRoute requiredModule="ajustes" requiredPermission="view">
                <Ajustes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="ajustes/nuevo" 
            element={
              <ProtectedRoute requiredModule="ajustes" requiredPermission="create">
                <AjustesNew />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="ajustes/editar/:fac_nro" 
            element={
              <ProtectedRoute requiredModule="ajustes" requiredPermission="edit">
                <AjustesNew />
              </ProtectedRoute>
            } 
          />

          {/* Conteos */}
          <Route 
            path="conteos" 
            element={
              <ProtectedRoute requiredModule="conteos" requiredPermission="view">
                <Conteos />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="conteos/nuevo" 
            element={
              <ProtectedRoute requiredModule="conteos" requiredPermission="create">
                <ConteosNew />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="conteos/nuevo/:id" 
            element={
              <ProtectedRoute requiredModule="conteos" requiredPermission="edit">
                <ConteosNew />
              </ProtectedRoute>
            } 
          />

          {/* Clients Routes */}
          <Route 
            path="clients" 
            element={
              <ProtectedRoute requiredModule="clients" requiredPermission="view">
                <Clients />
              </ProtectedRoute>
            } 
          />

          {/* Promociones Routes */}
          <Route 
            path="promociones" 
            element={<Promociones />}
          />
          <Route 
            path="promociones/nueva" 
            element={<PromocionNew />}
          />
          <Route 
            path="promociones/editar/:pro_sec" 
            element={<PromocionNew />}
          />

          {/* Eventos Promocionales Routes */}
          <Route
            path="eventos-promocionales"
            element={<EventosPromocionales />}
          />
          <Route
            path="eventos-promocionales/nuevo"
            element={<EventoPromocionalNew />}
          />
          <Route
            path="eventos-promocionales/editar/:eve_sec"
            element={<EventoPromocionalNew />}
          />

          {/* Configuraciones Routes */}
          <Route
            path="configuraciones/categorias"
            element={
              <ProtectedRoute requiredModule="products" requiredPermission="view">
                <Categories />
              </ProtectedRoute>
            }
          />

          {/* Role Manager - Solo accesible para administradores */}
          <Route 
            path="admin/roles" 
            element={
              <ProtectedRoute requiredModule="admin" requiredPermission="manage_roles">
                <RoleManager />
              </ProtectedRoute>
            } 
          />

          {/* User Manager - Solo accesible para administradores */}
          <Route 
            path="admin/users" 
            element={
              <ProtectedRoute requiredModule="admin" requiredPermission="manage_users">
                <UserManager />
              </ProtectedRoute>
            } 
          />

          {/* Default Route */}
          <Route 
            index 
            element={
              <ProtectedRoute requiredModule="dashboard" requiredPermission="view">
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Ruta 404 - debe ir al final */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

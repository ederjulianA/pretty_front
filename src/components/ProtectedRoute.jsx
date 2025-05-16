import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Componente para proteger rutas basado en autenticación y permisos
const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredRoles = [], 
  requiredPermission = null,
  requiredModule = null 
}) => {
  const { isAuthenticated, isLoading, hasRole, hasAnyRole, hasPermission, hasAccess } = useAuth();
  const location = useLocation();

  // Si está cargando, mostrar un spinner
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f58ea3]"></div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar rol específico
  if (requiredRole && !hasRole(requiredRole)) {
    console.log('No tiene el rol requerido:', requiredRole);
    return <Navigate to="/unauthorized" replace />;
  }

  // Verificar si tiene alguno de los roles requeridos
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    console.log('No tiene ninguno de los roles requeridos:', requiredRoles);
    return <Navigate to="/unauthorized" replace />;
  }

  // Verificar permiso específico
  if (requiredPermission && requiredModule) {
    // Si es el módulo admin, verificar permisos específicos
    if (requiredModule === 'admin') {
      const hasAdminPermission = hasPermission('admin', requiredPermission);
      console.log('Verificando permiso admin:', { requiredPermission, hasAdminPermission });
      if (!hasAdminPermission) {
        return <Navigate to="/unauthorized" replace />;
      }
    } else {
      // Para otros módulos, verificar el permiso normal
      if (!hasPermission(requiredModule, requiredPermission)) {
        console.log('No tiene el permiso requerido:', { module: requiredModule, permission: requiredPermission });
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  // Verificar acceso al módulo
  if (requiredModule) {
    // Si es el módulo admin, verificar acceso específico
    if (requiredModule === 'admin') {
      const hasAdminAccess = hasAccess('admin');
      console.log('Verificando acceso admin:', hasAdminAccess);
      if (!hasAdminAccess) {
        return <Navigate to="/unauthorized" replace />;
      }
    } else {
      // Para otros módulos, verificar acceso normal
      if (!hasAccess(requiredModule)) {
        console.log('No tiene acceso al módulo:', requiredModule);
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  // Si pasa todas las verificaciones, renderizar los hijos
  return children;
};

export default ProtectedRoute; 
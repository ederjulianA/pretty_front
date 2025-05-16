import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_URL } from '../config';
import axiosInstance from '../axiosConfig';

// Creación del contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Comprobar si hay un usuario autenticado al cargar
  useEffect(() => {
    const token = localStorage.getItem('pedidos_pretty_token');
    const userStored = localStorage.getItem('user_pretty');
    const roleStored = localStorage.getItem('user_role');
    const permissionsStored = localStorage.getItem('user_permissions');

    if (token) {
      setUser(userStored);
      setRole(roleStored);
      if (permissionsStored) {
        setPermissions(JSON.parse(permissionsStored));
      }
      setIsAuthenticated(true);
      // Recargar permisos del servidor para asegurar que están actualizados
      fetchPermissions();
    }
    
    setIsLoading(false);
  }, []);

  // Función para iniciar sesión
  const login = async (usuCod, usuPass) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        usu_cod: usuCod,
        usu_pass: usuPass,
      });
      
      const data = response.data;
      if (data.success) {
        // Guardar token y datos del usuario
        localStorage.setItem('pedidos_pretty_token', data.token);
        localStorage.setItem('user_pretty', data.usuario);
        localStorage.setItem('user_role', data.rol);
        
        // Guardar permisos si existen
        if (data.permisos) {
          localStorage.setItem('user_permissions', JSON.stringify(data.permisos));
          setPermissions(data.permisos);
        }
        
        setUser(data.usuario);
        setRole(data.rol);
        setIsAuthenticated(true);
        
        Swal.fire({
          icon: 'success',
          title: 'Login exitoso',
          text: `Bienvenido ${data.usuario}`,
          confirmButtonColor: '#f58ea3',
        });
        
        navigate('/dashboard');
        return true;
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Credenciales inválidas',
          confirmButtonColor: '#f58ea3',
        });
        return false;
      }
    } catch (error) {
      console.error('Error en login:', error);
      const errorMessage = error.response?.data?.message || 'Error al iniciar sesión, por favor intente nuevamente.';
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#f58ea3',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('pedidos_pretty_token');
    localStorage.removeItem('user_pretty');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_permissions');
    setUser(null);
    setRole(null);
    setPermissions(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  // Función para obtener permisos actualizados
  const fetchPermissions = async () => {
    const token = localStorage.getItem('pedidos_pretty_token');
    if (!token) return;

    try {
      const response = await axiosInstance.get('/auth/permissions');
      
      if (response.data.success && response.data.permisos) {
        const newPermissions = response.data.permisos;
        localStorage.setItem('user_permissions', JSON.stringify(newPermissions));
        setPermissions(newPermissions);
        return newPermissions;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener permisos:', error);
      // Si hay error al obtener permisos, cerrar sesión
      if (error.response?.status === 401) {
        logout();
      }
      return null;
    }
  };

  // Función para actualizar permisos en tiempo real
  const updatePermissions = async () => {
    try {
      const newPermissions = await fetchPermissions();
      if (newPermissions) {
        // Actualizar el estado de permisos
        setPermissions(newPermissions);
        
        // Mostrar notificación de permisos actualizados
        Swal.fire({
          icon: 'success',
          title: 'Permisos actualizados',
          text: 'Los permisos han sido actualizados correctamente',
          confirmButtonColor: '#f58ea3',
          timer: 2000,
          showConfirmButton: false
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al actualizar permisos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron actualizar los permisos',
        confirmButtonColor: '#f58ea3',
      });
      return false;
    }
  };

  // Función para verificar si un usuario tiene acceso a un módulo
  const hasAccess = (module) => {
    if (!permissions) {
      return false;
    }
    return permissions[module]?.access === true;
  };

  // Función para verificar si un usuario tiene permiso para realizar una acción
  const hasPermission = (module, action) => {
    if (!permissions) {
      return false;
    }
    // Primero verificar si tiene acceso al módulo
    if (!hasAccess(module)) {
      return false;
    }
    // Luego verificar si tiene el permiso específico
    return permissions[module]?.actions?.includes(action);
  };

  // Función para verificar si el usuario tiene un rol específico
  const hasRole = (roleName) => {
    return role === roleName;
  };

  // Función para verificar si el usuario tiene alguno de los roles especificados
  const hasAnyRole = (roleNames) => {
    return roleNames.includes(role);
  };

  // Valor a proveer en el contexto
  const value = {
    user,
    role,
    permissions,
    isLoading,
    isAuthenticated,
    login,
    logout,
    hasAccess,
    hasPermission,
    hasRole,
    hasAnyRole,
    fetchPermissions,
    updatePermissions
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 
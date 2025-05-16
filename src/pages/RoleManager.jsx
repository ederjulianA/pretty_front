import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSave, FaTimes, FaCheck } from 'react-icons/fa';
import axiosInstance from '../axiosConfig';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';

const RoleManager = () => {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([
    { id: 'dashboard', name: 'Dashboard', actions: ['view', 'export'] },
    { id: 'products', name: 'Productos', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'clients', name: 'Clientes', actions: ['view', 'create', 'edit', 'delete'] },
    { id: 'orders', name: 'Órdenes', actions: ['view', 'create', 'cancel'] },
    { id: 'pos', name: 'POS', actions: ['view', 'create_order', 'apply_discount'] },
    { id: 'ajustes', name: 'Ajustes', actions: ['view', 'create', 'edit'] },
    { id: 'conteos', name: 'Conteos', actions: ['view', 'create', 'edit'] },
    { id: 'admin', name: 'Administración', actions: ['manage_roles', 'manage_users'] },
  ]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPermissions, setEditPermissions] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { updatePermissions } = useAuth();

  // Cargar roles al iniciar
  useEffect(() => {
    fetchRoles();
  }, []);

  // Función para cargar roles
  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/roles', {
        params: {
          page: 1,
          limit: 10,
          active: true
        }
      });
      console.log('Respuesta del servidor PERMISOS##############:', response.data);
      if (response.data.success) {
        // Actualizar para usar la estructura correcta de la respuesta
        setRoles(response.data.roles || []);
      } else {
        throw new Error(response.data.message || 'Error al cargar roles');
      }
    } catch (error) {
      console.error('Error al cargar roles:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'No se pudieron cargar los roles',
        confirmButtonColor: '#f58ea3',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para seleccionar un rol y mostrar sus permisos
  const selectRole = async (roleId) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/roles/${roleId}`);
      if (response.data.success) {
        const role = response.data.role;
        setSelectedRole(role);
        setEditName(role.name);
        setEditPermissions(role.permissions || {});
      }
    } catch (error) {
      console.error('Error al cargar detalles del rol:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los detalles del rol',
        confirmButtonColor: '#f58ea3',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para crear un nuevo rol
  const createRole = () => {
    setSelectedRole(null);
    setEditMode(true);
    setEditName('Nuevo Rol');
    
    // Inicializar permisos vacíos
    const emptyPermissions = {};
    modules.forEach(module => {
      emptyPermissions[module.id] = {
        access: false,
        actions: []
      };
    });
    setEditPermissions(emptyPermissions);
  };

  // Función para guardar un rol (nuevo o editado)
  const saveRole = async () => {
    if (!editName.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre del rol no puede estar vacío',
        confirmButtonColor: '#f58ea3',
      });
      return;
    }

    setIsLoading(true);
    try {
      let response;
      const roleData = {
        name: editName,
        permissions: editPermissions
      };

      if (selectedRole) {
        // Actualizar rol existente
        response = await axiosInstance.put(`/roles/${selectedRole.id}`, roleData);
      } else {
        // Crear nuevo rol
        response = await axiosInstance.post('/roles', roleData);
      }

      if (response.data.success) {
        // Actualizar permisos en tiempo real
        await updatePermissions();
        
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: selectedRole ? 'Rol actualizado correctamente' : 'Rol creado correctamente',
          confirmButtonColor: '#f58ea3',
        });
        fetchRoles();
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error al guardar rol:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el rol',
        confirmButtonColor: '#f58ea3',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para eliminar un rol
  const deleteRole = async (roleId) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f58ea3',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsLoading(true);
        try {
          const response = await axiosInstance.delete(`/roles/${roleId}`);
          if (response.data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: 'Rol eliminado correctamente',
              confirmButtonColor: '#f58ea3',
            });
            if (selectedRole && selectedRole.id === roleId) {
              setSelectedRole(null);
              setEditMode(false);
            }
            fetchRoles();
          }
        } catch (error) {
          console.error('Error al eliminar rol:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar el rol',
            confirmButtonColor: '#f58ea3',
          });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // Función para manejar cambios en el acceso a módulos
  const handleModuleAccessChange = (moduleId, access) => {
    setEditPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        access
      }
    }));
  };

  // Función para manejar cambios en los permisos de acciones
  const handleActionPermissionChange = (moduleId, actionId, checked) => {
    setEditPermissions(prev => {
      const currentActions = prev[moduleId]?.actions || [];
      let newActions;
      
      if (checked) {
        newActions = [...currentActions, actionId];
      } else {
        newActions = currentActions.filter(action => action !== actionId);
      }
      
      return {
        ...prev,
        [moduleId]: {
          ...prev[moduleId],
          actions: newActions
        }
      };
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Administración de Roles y Permisos</h1>
      
      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f58ea3]"></div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Panel de Roles */}
          <div className="w-full md:w-1/3 bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Roles</h2>
              <button
                onClick={createRole}
                className="bg-[#f58ea3] text-white p-2 rounded-lg hover:bg-[#e57a91] transition-colors"
              >
                <FaPlus />
              </button>
            </div>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {roles.map(role => (
                <div 
                  key={role.id}
                  className={`p-3 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors ${selectedRole?.id === role.id ? 'bg-[#fff5f7] border-l-4 border-[#f58ea3]' : ''}`}
                  onClick={() => selectRole(role.id)}
                >
                  <span className="font-medium">{role.name}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        selectRole(role.id);
                        setEditMode(true);
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRole(role.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
              
              {roles.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No hay roles disponibles
                </div>
              )}
            </div>
          </div>
          
          {/* Panel de Permisos */}
          <div className="w-full md:w-2/3 bg-gray-50 rounded-lg p-4">
            {selectedRole || editMode ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold">
                    {editMode ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="p-2 border rounded w-full max-w-xs"
                        placeholder="Nombre del rol"
                      />
                    ) : (
                      selectedRole?.name
                    )}
                  </h2>
                  
                  <div className="flex gap-2">
                    {editMode ? (
                      <>
                        <button
                          onClick={saveRole}
                          className="bg-green-500 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-green-600"
                        >
                          <FaSave /> Guardar
                        </button>
                        <button
                          onClick={() => setEditMode(false)}
                          className="bg-gray-500 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-gray-600"
                        >
                          <FaTimes /> Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditMode(true)}
                        className="bg-[#f58ea3] text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-[#e57a91]"
                      >
                        <FaEdit /> Editar
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-6 max-h-[500px] overflow-y-auto">
                  {modules.map(module => (
                    <div key={module.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{module.name}</h3>
                        {editMode ? (
                          <label className="inline-flex items-center cursor-pointer">
                            <span className="mr-2 text-sm">Acceso</span>
                            <input
                              type="checkbox"
                              checked={editPermissions[module.id]?.access || false}
                              onChange={(e) => handleModuleAccessChange(module.id, e.target.checked)}
                              className="form-checkbox h-5 w-5 text-[#f58ea3] rounded-md focus:ring-[#f58ea3]"
                            />
                          </label>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${editPermissions[module.id]?.access ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {editPermissions[module.id]?.access ? 'Permitido' : 'Denegado'}
                          </span>
                        )}
                      </div>
                      
                      {/* Acciones del módulo */}
                      {module.actions.length > 0 && (
                        <div className="pl-4 border-l-2 border-gray-200">
                          <h4 className="text-sm font-medium mb-2 text-gray-500">Acciones:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {module.actions.map(action => (
                              <div key={action} className="flex items-center">
                                {editMode ? (
                                  <label className="inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      disabled={!editPermissions[module.id]?.access}
                                      checked={editPermissions[module.id]?.actions?.includes(action) || false}
                                      onChange={(e) => handleActionPermissionChange(module.id, action, e.target.checked)}
                                      className="form-checkbox h-4 w-4 text-[#f58ea3] rounded focus:ring-[#f58ea3]"
                                    />
                                    <span className="ml-2 text-sm">{mapActionName(action)}</span>
                                  </label>
                                ) : (
                                  <div className="flex items-center">
                                    <span className={`mr-2 ${editPermissions[module.id]?.actions?.includes(action) ? 'text-green-500' : 'text-red-500'}`}>
                                      {editPermissions[module.id]?.actions?.includes(action) ? <FaCheck /> : <FaTimes />}
                                    </span>
                                    <span className="text-sm">{mapActionName(action)}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <p className="text-gray-500 mb-4">Selecciona un rol para ver sus permisos</p>
                <button
                  onClick={createRole}
                  className="bg-[#f58ea3] text-white px-4 py-2 rounded-lg hover:bg-[#e57a91] transition-colors flex items-center gap-2"
                >
                  <FaPlus /> Crear nuevo rol
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Función auxiliar para mostrar nombres de acciones más amigables
function mapActionName(action) {
  const actionMap = {
    'view': 'Ver',
    'create': 'Crear',
    'edit': 'Editar',
    'delete': 'Eliminar',
    'export': 'Exportar',
    'create_order': 'Crear Orden',
    'cancel': 'Cancelar',
    'apply_discount': 'Aplicar Descuento'
  };
  
  return actionMap[action] || action;
}

export default RoleManager; 
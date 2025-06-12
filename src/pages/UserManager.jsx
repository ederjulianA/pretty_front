import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSave, FaTimes, FaCheck, FaKey } from 'react-icons/fa';
import axiosInstance from '../axiosConfig';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordModal from '../components/ChangePasswordModal';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Cargar usuarios y roles al iniciar
  useEffect(() => {
    console.log('Iniciando carga de datos...');
    fetchUsers();
    fetchRoles();
  }, []);

  // Función para cargar usuarios
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/users');
      console.log('Respuesta de usuarios:', response.data);
      // La respuesta es un array directo de usuarios
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error('La respuesta de usuarios no tiene el formato esperado:', response.data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los usuarios'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cargar roles
  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.get('/roles', {
        params: {
          page: 1,
          limit: 10,
          active: true
        }
      });
      console.log('Respuesta de roles:', response.data);
      
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
      setRoles([]);
    }
  };

  // Función para crear un nuevo usuario
  const createUser = () => {
    setSelectedUser(null);
    setEditMode(true);
    setEditName('');
    setEditEmail('');
    setEditRole('');
  };

  // Función para editar un usuario
  const editUser = (user) => {
    console.log('Editando usuario:', user);
    console.log('Roles disponibles:', roles);
    setSelectedUser(user);
    setEditMode(true);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.rol_id || '');
    console.log('Rol seleccionado:', user.rol_id);
  };

  // Función para guardar usuario
  const saveUser = async () => {
    try {
      setIsLoading(true);
      const userData = {
        name: editName,
        email: editEmail,
        role_id: editRole
      };

      if (selectedUser) {
        // Actualizar usuario existente
        await axiosInstance.put(`/users/${selectedUser.id}`, userData);
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Usuario actualizado correctamente'
        });
      } else {
        // Crear nuevo usuario
        await axiosInstance.post('/users', userData);
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Usuario creado correctamente'
        });
      }

      setEditMode(false);
      fetchUsers();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el usuario'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para eliminar usuario
  const deleteUser = async (userId) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f58ea3',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        setIsLoading(true);
        await axiosInstance.delete(`/users/${userId}`);
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Usuario eliminado correctamente'
        });
        fetchUsers();
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el usuario'
      });
    } finally {
      setIsLoading(false);
    }
  };
 
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Administración de Usuarios</h1>
      
      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f58ea3]"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Lista de usuarios */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Usuarios</h2>
              <button
                onClick={createUser}
                className="bg-[#f58ea3] text-white px-4 py-2 rounded-lg hover:bg-[#e57a91] transition-colors flex items-center gap-2"
              >
                <FaPlus /> Nuevo Usuario
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.rol_nombre || 'Sin rol'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => editUser(user)}
                          className="text-[#f58ea3] hover:text-[#e57a91] mr-4"
                          title="Editar Usuario"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPasswordModal(true);
                          }}
                          className="text-[#f58ea3] hover:text-[#e57a91] mr-4"
                          title="Cambiar Contraseña"
                        >
                          <FaKey />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar Usuario"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formulario de edición/creación */}
          {editMode && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#f58ea3] focus:ring-[#f58ea3]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#f58ea3] focus:ring-[#f58ea3]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rol</label>
                  {console.log('Renderizando select con roles:', roles)}
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#f58ea3] focus:ring-[#f58ea3]"
                  >
                    <option value="">Seleccionar rol</option>
                    {roles && roles.length > 0 ? (
                      roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name} {role.description ? `- ${role.description}` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No hay roles disponibles</option>
                    )}
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveUser}
                    className="px-4 py-2 bg-[#f58ea3] text-white rounded-md hover:bg-[#e57a91]"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Cambio de Contraseña */}
      {showPasswordModal && selectedUser && (
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
          userId={selectedUser.id}
          isAdmin={true}
        />
      )}
    </div>
  );
};

export default UserManager; 
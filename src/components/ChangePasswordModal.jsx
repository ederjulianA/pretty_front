import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import Swal from 'sweetalert2';
import { FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';

const ChangePasswordModal = ({ isOpen, onClose, forceChange = false, userId = null, isAdmin = false }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Validar requisitos de contraseña
  useEffect(() => {
    if (newPassword) {
      setPasswordRequirements({
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[!@#$%^&*()_+\[\]{}|;:,.<>?\-]/.test(newPassword)
      });
    } else {
      setPasswordRequirements({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
      });
    }
  }, [newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!isAdmin && !currentPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'La contraseña actual es obligatoria',
        confirmButtonColor: '#f58ea3'
      });
      return;
    }

    if (!newPassword || !confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Todos los campos son obligatorios',
        confirmButtonColor: '#f58ea3'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas nuevas no coinciden',
        confirmButtonColor: '#f58ea3'
      });
      return;
    }

    // Validar que cumpla todos los requisitos
    if (!Object.values(passwordRequirements).every(req => req)) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'La contraseña no cumple con todos los requisitos',
        confirmButtonColor: '#f58ea3'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = isAdmin ? '/auth/change-password-admin' : '/auth/change-password';
      const response = await axios.post(`${API_URL}${endpoint}`, {
        currentPassword: isAdmin ? undefined : currentPassword,
        newPassword,
        usu_cod: userId
      }, {
        headers: {
          'x-access-token': localStorage.getItem('pedidos_pretty_token')
        }
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Contraseña actualizada correctamente',
          confirmButtonColor: '#f58ea3'
        });
        onClose();
        // Limpiar campos
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      } else {
        throw new Error(response.data.message || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Error al cambiar la contraseña',
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Cambiar Contraseña</h2>
        {forceChange && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded text-sm font-medium">
            Por seguridad, debes cambiar tu contraseña para poder ingresar al sistema.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña Actual
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-transparent pr-10"
                  placeholder="Ingrese su contraseña actual"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-transparent pr-10"
                placeholder="Ingrese la nueva contraseña"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {/* Requisitos de contraseña */}
            <div className="mt-2 space-y-1 text-sm">
              <div className={`flex items-center gap-2 ${passwordRequirements.length ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordRequirements.length ? <FaCheck /> : <FaTimes />}
                <span>Longitud mínima de 8 caracteres</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordRequirements.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordRequirements.uppercase ? <FaCheck /> : <FaTimes />}
                <span>Al menos una mayúscula</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordRequirements.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordRequirements.lowercase ? <FaCheck /> : <FaTimes />}
                <span>Al menos una minúscula</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordRequirements.number ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordRequirements.number ? <FaCheck /> : <FaTimes />}
                <span>Al menos un número</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordRequirements.special ? 'text-green-600' : 'text-gray-500'}`}>
                {passwordRequirements.special ? <FaCheck /> : <FaTimes />}
                <span>Al menos un carácter especial (!@#$%^&amp;*()_+[]&#123;&#125;|;:,.&lt;&gt;?-)</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-transparent pr-10"
                placeholder="Confirme la nueva contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            {!forceChange && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-[#f58ea3] text-white rounded-lg hover:bg-[#f7b3c2] transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal; 
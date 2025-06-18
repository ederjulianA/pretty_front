import { useState, useEffect, useCallback } from 'react';
import { photoService } from '../services/photoService';
import Swal from 'sweetalert2';

export const useProductPhotos = (productId) => {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar fotos del producto
  const loadPhotos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await photoService.getProductPhotos(productId);
      console.log('Respuesta de carga de fotos:', response); // Debug
      if (response.success) {
        setPhotos(response.data || []);
      } else {
        setPhotos([]);
      }
    } catch (error) {
      console.error('Error al cargar fotos:', error);
      setError(error.message);
      setPhotos([]);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar las fotos del producto',
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  // Subir nueva foto
  const uploadPhoto = async (file, isPrincipal = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await photoService.uploadPhoto(productId, file, isPrincipal);
      console.log('Respuesta de subida:', response);
      
      if (response.success) {
        if (response.data) {
          setPhotos(prevPhotos => [...prevPhotos, response.data]);
        }
        // Recargar todas las fotos para asegurar consistencia
        await loadPhotos();
        
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Foto subida correctamente',
          confirmButtonColor: '#f58ea3'
        });
      } else {
        throw new Error(response.message || 'Error al subir la foto');
      }
    } catch (error) {
      console.error('Error al subir foto:', error);
      setError(error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al subir la foto',
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar foto
  const deletePhoto = async (photoId) => {
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
        setError(null);
        const response = await photoService.deletePhoto(productId, photoId);
        console.log('Respuesta de eliminación:', response);
        
        if (response.success) {
          // Actualizar el estado local eliminando la foto
          setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));
          // Recargar todas las fotos para asegurar consistencia
          await loadPhotos();
          
          Swal.fire({
            icon: 'success',
            title: 'Eliminada',
            text: 'Foto eliminada correctamente',
            confirmButtonColor: '#f58ea3'
          });
        } else {
          throw new Error(response.message || 'Error al eliminar la foto');
        }
      }
    } catch (error) {
      console.error('Error al eliminar foto:', error);
      setError(error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al eliminar la foto',
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Establecer foto principal
  const setMainPhoto = async (photoId) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await photoService.setMainPhoto(productId, photoId);
      console.log('Respuesta de establecer principal:', response);
      
      if (response.success) {
        // Actualizar el estado local
        setPhotos(prevPhotos => 
          prevPhotos.map(photo => ({
            ...photo,
            es_principal: photo.id === photoId
          }))
        );
        // Recargar todas las fotos para asegurar consistencia
        await loadPhotos();
        
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Foto principal actualizada',
          confirmButtonColor: '#f58ea3'
        });
      } else {
        throw new Error(response.message || 'Error al actualizar la foto principal');
      }
    } catch (error) {
      console.error('Error al establecer foto principal:', error);
      setError(error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al actualizar la foto principal',
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sincronizar con WooCommerce
  const syncWithWooCommerce = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await photoService.syncWithWooCommerce(productId);
      console.log('Respuesta de sincronización:', response);
      
      if (response.success) {
        // Recargar todas las fotos después de la sincronización
        await loadPhotos();
        
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Fotos sincronizadas con WooCommerce',
          confirmButtonColor: '#f58ea3'
        });
      } else {
        throw new Error(response.message || 'Error al sincronizar con WooCommerce');
      }
    } catch (error) {
      console.error('Error al sincronizar con WooCommerce:', error);
      setError(error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al sincronizar con WooCommerce',
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reordenar fotos
  const reorderPhotos = async (newOrder) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await photoService.reorderPhotos(productId, newOrder);
      if (response.success) {
        await loadPhotos(); // Recargar todas las fotos
      }
    } catch (error) {
      setError(error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al reordenar las fotos',
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar fotos al montar el componente
  useEffect(() => {
    if (productId) {
      loadPhotos();
    } else {
      setPhotos([]);
    }
  }, [productId, loadPhotos]);

  return {
    photos: photos || [],
    isLoading,
    error,
    uploadPhoto,
    deletePhoto,
    setMainPhoto,
    syncWithWooCommerce,
    reorderPhotos,
    loadPhotos
  };
}; 
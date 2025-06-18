import axios from 'axios';
import { API_URL } from '../config';

class PhotoService {
  // Obtener todas las fotos de un producto
  async getProductPhotos(productId) {
    try {
      const response = await axios.get(`${API_URL}/productos/${productId}/fotos`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Subir una nueva foto
  async uploadPhoto(productId, file, isPrincipal = false) {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('es_principal', isPrincipal);

      const response = await axios.post(
        `${API_URL}/productos/${productId}/fotos/temp`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload Progress: ${percentCompleted}%`);
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw this.handleError(error);
    }
  }

  // Eliminar una foto
  async deletePhoto(productId, photoId) {
    try {
      const response = await axios.delete(
        `${API_URL}/productos/${productId}/fotos/${photoId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Establecer foto principal
  async setMainPhoto(productId, photoId) {
    try {
      const response = await axios.put(
        `${API_URL}/productos/${productId}/fotos/${photoId}/principal`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Sincronizar fotos con WooCommerce
  async syncWithWooCommerce(productId) {
    try {
      const response = await axios.post(
        `${API_URL}/productos/${productId}/fotos/sync-woo`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Reordenar fotos
  async reorderPhotos(productId, photoOrder) {
    try {
      const response = await axios.put(
        `${API_URL}/productos/${productId}/fotos/reordenar`,
        { orden: photoOrder }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Manejo de errores
  handleError(error) {
    if (error.response) {
      return new Error(error.response.data.message || 'Error en la operación');
    }
    return new Error('Error de conexión');
  }
}

export const photoService = new PhotoService(); 
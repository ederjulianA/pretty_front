import React from 'react';
import { useProductPhotos } from '../../../hooks/useProductPhotos';
import ProductPhotoGalleryItem from './ProductPhotoGalleryItem';
import ProductPhotoUploader from './ProductPhotoUploader';
import { FaSync } from 'react-icons/fa';

const ProductPhotoGallery = ({ productId, isVariation = false }) => {
  const {
    photos,
    isLoading,
    error,
    uploadPhoto,
    deletePhoto,
    setMainPhoto,
    syncWithWooCommerce
  } = useProductPhotos(productId);

  // Asegurarnos de que photos es un array
  const photosArray = Array.isArray(photos) ? photos : [];

  return (
    <div className="bg-white/80 shadow-xl rounded-2xl p-4 sm:p-6 mb-6 max-w-6xl mx-auto">
      {/* Aviso para variaciones: WooCommerce solo soporta 1 imagen por variación */}
      {isVariation && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-800 text-sm">
          <strong>Variación:</strong> En WooCommerce las variaciones solo admiten 1 imagen. Si subes varias fotos aquí, solo la primera se sincronizará con WooCommerce.
        </div>
      )}

      {/* Encabezado con acciones */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-700 tracking-tight">Fotos del Producto</h3>
        <button
          onClick={syncWithWooCommerce}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-300/80 to-pink-400/80 text-white shadow-md hover:from-pink-400 hover:to-pink-500 transition disabled:opacity-50 backdrop-blur-md"
        >
          <FaSync className={isLoading ? 'animate-spin' : ''} />
          <span className="font-medium">Sincronizar con WooCommerce</span>
        </button>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl mb-2 shadow-sm">
          {error}
        </div>
      )}

      {/* Uploader en una sola fila */}
      <div className="flex justify-center mb-8">
        <div className="w-full max-w-[380px]">
          <ProductPhotoUploader
            onUpload={uploadPhoto}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Grid de fotos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 justify-center items-start place-content-center">
        {photosArray.map((photo) => (
          <div key={photo.id} className="aspect-square w-full max-w-[320px] mx-auto mb-2">
            <ProductPhotoGalleryItem
              photo={photo}
              onDelete={deletePhoto}
              onSetMain={setMainPhoto}
              isLoading={isLoading}
              isVariation={isVariation}
            />
          </div>
        ))}
      </div>

      {/* Mensaje cuando no hay fotos */}
      {photosArray.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 py-8">
          No hay fotos subidas para este producto
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center text-gray-500 py-8">
          Cargando...
        </div>
      )}
    </div>
  );
};

export default ProductPhotoGallery; 
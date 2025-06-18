import React from 'react';
import { FaTrash, FaStar, FaRegStar } from 'react-icons/fa';

const ProductPhotoGalleryItem = ({ 
  photo, 
  onDelete, 
  onSetMain, 
  isLoading 
}) => {
  // Función para manejar el clic en el botón de eliminar
  const handleDelete = (e) => {
    e.preventDefault(); // Prevenir el comportamiento por defecto
    e.stopPropagation(); // Detener la propagación del evento
    onDelete(photo.id);
  };

  // Función para manejar el clic en el botón de establecer principal
  const handleSetMain = (e) => {
    e.preventDefault(); // Prevenir el comportamiento por defecto
    e.stopPropagation(); // Detener la propagación del evento
    onSetMain(photo.id);
  };

  return (
    <div className="relative group rounded-xl overflow-hidden shadow-lg bg-white/60 backdrop-blur-md border border-[#f5cad4] hover:shadow-2xl transition-all duration-200 h-full flex flex-col pb-6">
      {/* Imagen */}
      <div className="aspect-square overflow-hidden rounded-xl bg-gray-100 flex-1 flex items-center justify-center">
        <img
          src={photo.url}
          alt={photo.nombre}
          className="w-full h-full object-cover transition-transform duration-200"
        />
      </div>

      {/* Badge de estado */}
      {photo.estado === 'temp' && (
        <div className="absolute top-2 right-2 px-3 py-1 rounded-full bg-yellow-400/80 text-white text-xs shadow backdrop-blur-md border border-yellow-200/60 select-none">
          Temporal
        </div>
      )}
      {photo.estado === 'woo' && (
        <div className="absolute top-2 right-2 px-3 py-1 rounded-full bg-green-400/80 text-white text-xs shadow backdrop-blur-md border border-green-200/60 select-none">
          WooCommerce
        </div>
      )}

      {/* Espacio entre imagen y barra de acciones */}
      <div className="h-3" />

      {/* Barra de acciones fija más abajo con colores de marca */}
      <div className="absolute left-0 bottom-0 w-full flex justify-center gap-4 pb-1 z-10 bg-[#fffafe]/80 backdrop-blur-md rounded-b-xl">
        {/* Botón Establecer Principal */}
        <button
          type="button"
          onClick={handleSetMain}
          disabled={isLoading || photo.es_principal}
          className={`p-2 rounded-full shadow-lg border border-[#f5cad4] focus:outline-none focus:ring-2 focus:ring-[#f58ea3]/60 transition-all duration-200 ${
            photo.es_principal 
              ? 'bg-[#a5762f] text-white scale-110' 
              : 'bg-[#f58ea3] text-white hover:bg-[#f7b3c2]'
          }`}
          title={photo.es_principal ? 'Foto principal' : 'Establecer como principal'}
        >
          {photo.es_principal ? <FaStar className="text-lg" /> : <FaRegStar className="text-lg" />}
        </button>

        {/* Botón Eliminar */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isLoading}
          className="p-2 rounded-full bg-white text-[#f58ea3] hover:bg-[#f7b3c2] hover:text-white shadow-lg border border-[#f5cad4] focus:outline-none focus:ring-2 focus:ring-[#f58ea3]/60 transition-all duration-200"
          title="Eliminar foto"
        >
          <FaTrash className="text-lg" />
        </button>
      </div>
    </div>
  );
};

export default ProductPhotoGalleryItem; 
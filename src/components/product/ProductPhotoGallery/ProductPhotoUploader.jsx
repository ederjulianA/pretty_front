import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaCloudUploadAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';

const ProductPhotoUploader = ({ onUpload, isLoading }) => {
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Solo se permiten archivos JPG, PNG y WEBP',
          confirmButtonColor: '#f58ea3'
        });
        return;
      }
      // Validar tamaño (5MB máximo)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'El archivo no debe superar los 5MB',
          confirmButtonColor: '#f58ea3'
        });
        return;
      }
      try {
        const fileToUpload = new File([file], file.name, {
          type: file.type,
          lastModified: file.lastModified,
        });
        await onUpload(fileToUpload);
      } catch (error) {
        console.error('Error al procesar el archivo:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al procesar el archivo. Por favor, intente nuevamente.',
          confirmButtonColor: '#f58ea3'
        });
      }
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    disabled: isLoading,
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-xl p-6 min-h-[180px] flex flex-col items-center justify-center bg-white/60 shadow-md backdrop-blur-md transition-all duration-200
        ${isDragActive ? 'border-[#f58ea3] bg-pink-50/80 scale-105' : 'border-gray-300/60'}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#f58ea3]'}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-center select-none">
        <FaCloudUploadAlt className="text-5xl text-gray-300 mb-3 drop-shadow" />
        <p className="text-base text-gray-600 font-medium">
          {isDragActive
            ? 'Suelta la imagen aquí'
            : 'Arrastra una imagen o haz clic para seleccionar'}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Formatos permitidos: JPG, PNG, WEBP (máx. 5MB)
        </p>
      </div>
    </div>
  );
};

export default ProductPhotoUploader; 
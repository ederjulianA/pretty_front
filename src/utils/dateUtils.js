// Configuración de la zona horaria de Colombia
const COLOMBIA_TIMEZONE = 'America/Bogota';

/**
 * Formatea una fecha para mostrar en la UI
 * @param {string|Date} dateInput - Fecha en formato ISO (YYYY-MM-DD) o objeto Date
 * @returns {string} Fecha formateada
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '';

  try {
    let dateString;

    if (dateInput instanceof Date) {
      // Si es un objeto Date, convertirlo a string ISO
      dateString = dateInput.toISOString();
    } else {
      // Si ya es un string, usarlo directamente
      dateString = dateInput;
    }

    // Extraer la parte de la fecha (YYYY-MM-DD)
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return dateInput;
  }
};

/**
 * Formatea una fecha y hora
 * @param {string} dateTimeString - Fecha y hora en formato ISO
 * @param {object} options - Opciones de formato (opcional)
 * @returns {string} Fecha y hora formateada
 */
export const formatDateTime = (dateTimeString, options = {}) => {
  if (!dateTimeString) return '';

  const defaultOptions = {
    timeZone: COLOMBIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options
  };

  try {
    const date = new Date(dateTimeString);
    return new Intl.DateTimeFormat('es-CO', defaultOptions).format(date);
    console.log('Nueva Fecha '.date);
  } catch (error) {
    console.error('Error formateando fecha y hora:', error);
    return dateTimeString;
  }
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 * @returns {string} Fecha actual
 */
export const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Convierte una fecha al formato requerido por la API
 * @param {string} dateString - Fecha en cualquier formato
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const toAPIDateFormat = (dateString) => {
  if (!dateString) return '';

  try {
    const [year, month, day] = dateString.split('-');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (error) {
    console.error('Error convirtiendo fecha para API:', error);
    return dateString;
  }
}; 
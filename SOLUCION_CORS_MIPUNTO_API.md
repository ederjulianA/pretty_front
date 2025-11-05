# Solución Completa para CORS con MiPunto API

## 🎯 **Problema**
Las peticiones desde el frontend React a la API externa de MiPunto (`VITE_MIPUNTO_URL='/mipuntoV1/ApiWoo'`) generaban errores de CORS (Cross-Origin Resource Sharing) que impedían la comunicación entre dominios.

## 🔧 **Solución Implementada**

### **1. Configuración de Proxy en Vite (Desarrollo)**

**Archivo: `vite.config.js`**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5174,
    proxy: {
      // Proxy para API principal
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      // Proxy para MiPunto API - SOLUCIÓN CORS
      '/mipuntoV1': {
        target: 'http://localhost:8088',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mipuntoV1/, '/mipuntoV1'),
      },
    }
  },
})
```

### **2. Configuración de Variables de Entorno**

**Archivo: `src/config.js`**
```javascript
export const API_URL = '/api';

const isDevelopment = import.meta.env.MODE === 'development';

export const baseUrl = isDevelopment
  ? import.meta.env.VITE_MIPUNTO_URL  // En desarrollo: '/mipuntoV1/ApiWoo'
  : '/apigenexus';  // En producción: '/apigenexus'
```

**Archivo: `.env` (crear si no existe)**
```env
VITE_MIPUNTO_URL=/mipuntoV1/ApiWoo
```

### **3. Configuración de Rewrites en Vercel (Producción)**

**Archivo: `vercel.json`**
```json
{
  "rewrites": [
    {
      "source": "/api/:path*", 
      "destination": "http://154.53.62.220:3000/api/:path*" 
    },
    {
      "source": "/apigenexus/:path*", 
      "destination": "http://154.53.62.220:8081/mipuntoV1/ApiWoo/:path*" 
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-access-token" }
      ]
    },
    {
      "source": "/apigenexus/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-access-token" }
      ]
    }
  ]
}
```

## 🚀 **Cómo Funciona la Solución**

### **En Entorno de Desarrollo:**

1. **Frontend** hace petición a: `http://localhost:5174/mipuntoV1/ApiWoo/endpoint`
2. **Vite Proxy** intercepta la petición y la redirige a: `http://localhost:8088/mipuntoV1/ApiWoo/endpoint`
3. **No hay CORS** porque el proxy actúa como intermediario del mismo dominio

### **En Entorno de Producción:**

1. **Frontend** hace petición a: `https://tu-dominio.com/apigenexus/endpoint`
2. **Vercel Rewrite** redirige a: `http://154.53.62.220:8081/mipuntoV1/ApiWoo/endpoint`
3. **Headers CORS** se agregan automáticamente por Vercel

## 💻 **Uso en el Código**

### **Importación de Configuración**
```javascript
import { baseUrl, API_URL } from '../config';
```

### **Ejemplo de Petición GET**
```javascript
const fetchDataFromMiPunto = async () => {
  try {
    const response = await axios.get(`${baseUrl}/endpoint`);
    return response.data;
  } catch (error) {
    console.error('Error fetching from MiPunto:', error);
    throw error;
  }
};
```

### **Ejemplo de Petición POST**
```javascript
const sendDataToMiPunto = async (data) => {
  try {
    const response = await axios.post(`${baseUrl}/endpoint`, data, {
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': localStorage.getItem('pedidos_pretty_token')
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error sending to MiPunto:', error);
    throw error;
  }
};
```

## 🔄 **Flujo Completo de Peticiones**

### **Desarrollo:**
```
Frontend (localhost:5174) 
    ↓ petición a /mipuntoV1/ApiWoo/endpoint
Vite Proxy 
    ↓ redirige a localhost:8088/mipuntoV1/ApiWoo/endpoint
MiPunto API (localhost:8088)
    ↓ respuesta
Vite Proxy 
    ↓ devuelve respuesta
Frontend
```

### **Producción:**
```
Frontend (tu-dominio.com) 
    ↓ petición a /apigenexus/endpoint
Vercel Rewrite 
    ↓ redirige a 154.53.62.220:8081/mipuntoV1/ApiWoo/endpoint
MiPunto API (154.53.62.220:8081)
    ↓ respuesta con headers CORS
Vercel 
    ↓ devuelve respuesta
Frontend
```

## ✅ **Ventajas de esta Solución**

1. **Sin CORS en desarrollo**: El proxy de Vite evita completamente el problema
2. **Configuración automática**: Vercel maneja los headers CORS automáticamente
3. **Flexibilidad**: Diferentes URLs para desarrollo y producción
4. **Transparente**: El código no necesita cambios entre entornos
5. **Escalable**: Fácil de mantener y extender para otras APIs
6. **Seguro**: Los headers CORS se configuran correctamente

## 🛠️ **Configuración Adicional Recomendada**

### **Para Múltiples APIs Externas:**
```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
  },
  '/mipuntoV1': {
    target: 'http://localhost:8088',
    changeOrigin: true,
  },
  '/otra-api': {
    target: 'http://localhost:9000',
    changeOrigin: true,
  }
}
```

### **Para Manejo de Errores CORS:**
```javascript
// src/utils/apiErrorHandler.js
export const handleCorsError = (error) => {
  if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
    console.error('Error de CORS detectado:', error);
    // Mostrar mensaje al usuario
    alert('Error de conexión. Verifique la configuración del servidor.');
  }
  throw error;
};
```

## 📋 **Checklist de Implementación**

- [ ] Configurar proxy en `vite.config.js`
- [ ] Crear archivo `.env` con `VITE_MIPUNTO_URL`
- [ ] Configurar `vercel.json` con rewrites y headers
- [ ] Actualizar `src/config.js` con lógica de entornos
- [ ] Probar peticiones en desarrollo
- [ ] Probar peticiones en producción
- [ ] Verificar headers CORS en DevTools
- [ ] Documentar endpoints utilizados

## 🐛 **Solución de Problemas Comunes**

### **Error: "Access to XMLHttpRequest has been blocked by CORS policy"**
- **Causa**: El proxy no está configurado correctamente
- **Solución**: Verificar que la URL en el frontend coincida con la configuración del proxy

### **Error: "Network Error" en producción**
- **Causa**: Los rewrites de Vercel no están funcionando
- **Solución**: Verificar la configuración de `vercel.json` y los headers CORS

### **Error: "404 Not Found"**
- **Causa**: La URL de destino no es correcta
- **Solución**: Verificar que el servidor de MiPunto esté ejecutándose en el puerto correcto

## 📚 **Referencias**

- [Vite Proxy Configuration](https://vitejs.dev/config/server-options.html#server-proxy)
- [Vercel Rewrites](https://vercel.com/docs/concepts/projects/project-configuration#rewrites)
- [CORS Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Axios Configuration](https://axios-http.com/docs/config_defaults)

---

**Nota**: Esta solución es específica para el proyecto POS Pretty v2 con Tailwind CSS 4, pero puede adaptarse a otros proyectos React + Vite que necesiten comunicarse con APIs externas.

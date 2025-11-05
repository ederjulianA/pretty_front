# Reglas para Inicializar Proyecto React + Vite + Tailwind CSS 4

## Pasos para Crear un Nuevo Proyecto

### 1. Crear el Proyecto Base con Vite
```bash
npm create vite@latest nombre-del-proyecto -- --template react
cd nombre-del-proyecto
```

### 2. Instalar Dependencias Principales
```bash
# Dependencias de producción
npm install @tailwindcss/vite@^4.0.5 tailwindcss@^4.0.5
npm install react@^19.0.0 react-dom@^19.0.0
npm install react-router-dom@^7.2.0
npm install axios@^1.7.9
npm install react-icons@^5.5.0
npm install react-toastify@^11.0.5
npm install sweetalert2@^11.16.0
npm install chart.js@^4.4.8 react-chartjs-2@^5.3.0
npm install date-fns@^4.1.0
npm install lodash@^4.17.21
npm install jspdf@^2.5.2 jspdf-autotable@^3.8.4
npm install react-dropzone@^14.3.8

# Dependencias de desarrollo
npm install -D @vitejs/plugin-react@^4.3.4
npm install -D vite@^6.1.0
npm install -D eslint@^9.19.0
npm install -D @eslint/js@^9.19.0
npm install -D eslint-plugin-react@^7.37.4
npm install -D eslint-plugin-react-hooks@^5.0.0
npm install -D eslint-plugin-react-refresh@^0.4.18
npm install -D globals@^15.14.0
npm install -D @types/react@^19.0.8
npm install -D @types/react-dom@^19.0.3
```

### 3. Configurar Vite (vite.config.js)
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    }
  },
})
```

### 4. Configurar Tailwind CSS 4 (src/index.css)
```css
@import "tailwindcss";

/* Estilos personalizados */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

### 5. Configurar ESLint (eslint.config.js)
```javascript
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '19.0' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]
```

### 6. Actualizar package.json
```json
{
  "name": "nombre-del-proyecto",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

### 7. Configurar index.html
```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tu Proyecto</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### 8. Estructura de Carpetas Recomendada
```
src/
├── components/          # Componentes reutilizables
├── pages/              # Páginas de la aplicación
├── contexts/           # Contextos de React
├── hooks/              # Hooks personalizados
├── services/           # Servicios API
├── utils/              # Utilidades
├── layouts/            # Layouts de la aplicación
├── assets/             # Imágenes, iconos, etc.
├── App.jsx
├── main.jsx
└── index.css
```

### 9. Script de Inicialización Automática
Crear un archivo `init-project.sh` (Linux/Mac) o `init-project.bat` (Windows):

**Para Windows (init-project.bat):**
```batch
@echo off
echo Creando proyecto React + Vite + Tailwind CSS 4...
npm create vite@latest %1 -- --template react
cd %1

echo Instalando dependencias...
call npm install @tailwindcss/vite@^4.0.5 tailwindcss@^4.0.5
call npm install react@^19.0.0 react-dom@^19.0.0
call npm install react-router-dom@^7.2.0 axios@^1.7.9
call npm install react-icons@^5.5.0 react-toastify@^11.0.5
call npm install sweetalert2@^11.16.0 chart.js@^4.4.8
call npm install react-chartjs-2@^5.3.0 date-fns@^4.1.0
call npm install lodash@^4.17.21 jspdf@^2.5.2
call npm install jspdf-autotable@^3.8.4 react-dropzone@^14.3.8

call npm install -D @vitejs/plugin-react@^4.3.4 vite@^6.1.0
call npm install -D eslint@^9.19.0 @eslint/js@^9.19.0
call npm install -D eslint-plugin-react@^7.37.4
call npm install -D eslint-plugin-react-hooks@^5.0.0
call npm install -D eslint-plugin-react-refresh@^0.4.18
call npm install -D globals@^15.14.0
call npm install -D @types/react@^19.0.8 @types/react-dom@^19.0.3

echo Configurando archivos...
echo @import "tailwindcss"; > src\index.css
echo. >> src\index.css
echo .no-scrollbar::-webkit-scrollbar { >> src\index.css
echo   display: none; >> src\index.css
echo } >> src\index.css
echo .no-scrollbar { >> src\index.css
echo   -ms-overflow-style: none; >> src\index.css
echo   scrollbar-width: none; >> src\index.css
echo } >> src\index.css

echo Proyecto creado exitosamente!
echo Para iniciar el servidor de desarrollo ejecuta: npm run dev
pause
```

**Para Linux/Mac (init-project.sh):**
```bash
#!/bin/bash
echo "Creando proyecto React + Vite + Tailwind CSS 4..."
npm create vite@latest $1 -- --template react
cd $1

echo "Instalando dependencias..."
npm install @tailwindcss/vite@^4.0.5 tailwindcss@^4.0.5
npm install react@^19.0.0 react-dom@^19.0.0
npm install react-router-dom@^7.2.0 axios@^1.7.9
npm install react-icons@^5.5.0 react-toastify@^11.0.5
npm install sweetalert2@^11.16.0 chart.js@^4.4.8
npm install react-chartjs-2@^5.3.0 date-fns@^4.1.0
npm install lodash@^4.17.21 jspdf@^2.5.2
npm install jspdf-autotable@^3.8.4 react-dropzone@^14.3.8

npm install -D @vitejs/plugin-react@^4.3.4 vite@^6.1.0
npm install -D eslint@^9.19.0 @eslint/js@^9.19.0
npm install -D eslint-plugin-react@^7.37.4
npm install -D eslint-plugin-react-hooks@^5.0.0
npm install -D eslint-plugin-react-refresh@^0.4.18
npm install -D globals@^15.14.0
npm install -D @types/react@^19.0.8 @types/react-dom@^19.0.3

echo "Configurando archivos..."
cat > src/index.css << 'EOF'
@import "tailwindcss";

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
EOF

echo "Proyecto creado exitosamente!"
echo "Para iniciar el servidor de desarrollo ejecuta: npm run dev"
```

### 10. Uso de los Scripts
```bash
# Windows
init-project.bat mi-nuevo-proyecto

# Linux/Mac
chmod +x init-project.sh
./init-project.sh mi-nuevo-proyecto
```

## Características Incluidas

- ✅ React 19 con Vite 6
- ✅ Tailwind CSS 4 con configuración optimizada
- ✅ React Router DOM para navegación
- ✅ Axios para peticiones HTTP
- ✅ React Icons para iconografía
- ✅ React Toastify para notificaciones
- ✅ SweetAlert2 para modales
- ✅ Chart.js para gráficos
- ✅ Date-fns para manejo de fechas
- ✅ Lodash para utilidades
- ✅ jsPDF para generación de PDFs
- ✅ React Dropzone para subida de archivos
- ✅ ESLint configurado para React
- ✅ Proxy configurado para API
- ✅ Puerto 5174 por defecto
- ✅ Estructura de carpetas organizada

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Construcción
npm run build

# Preview de producción
npm run preview

# Linting
npm run lint
```

## Notas Importantes

1. **Tailwind CSS 4**: Usa la nueva sintaxis `@import "tailwindcss"` en lugar de archivos de configuración separados
2. **React 19**: Versión más reciente con mejoras de rendimiento
3. **Vite 6**: Última versión con mejoras de velocidad
4. **ESLint 9**: Nueva configuración flat config
5. **Proxy**: Configurado para redirigir `/api` a `localhost:3000`

Esta configuración te dará una base sólida para cualquier proyecto React moderno con todas las herramientas necesarias ya configuradas.

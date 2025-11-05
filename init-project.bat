@echo off
echo Creando proyecto React + Vite + Tailwind CSS 4...
if "%1"=="" (
    echo Error: Debes proporcionar un nombre para el proyecto
    echo Uso: init-project.bat nombre-del-proyecto
    pause
    exit /b 1
)

npm create vite@latest %1 -- --template react
cd %1

echo Instalando dependencias principales...
call npm install @tailwindcss/vite@^4.0.5 tailwindcss@^4.0.5
call npm install react@^19.0.0 react-dom@^19.0.0
call npm install react-router-dom@^7.2.0 axios@^1.7.9
call npm install react-icons@^5.5.0 react-toastify@^11.0.5
call npm install sweetalert2@^11.16.0 chart.js@^4.4.8
call npm install react-chartjs-2@^5.3.0 date-fns@^4.1.0
call npm install lodash@^4.17.21 jspdf@^2.5.2
call npm install jspdf-autotable@^3.8.4 react-dropzone@^14.3.8

echo Instalando dependencias de desarrollo...
call npm install -D @vitejs/plugin-react@^4.3.4 vite@^6.1.0
call npm install -D eslint@^9.19.0 @eslint/js@^9.19.0
call npm install -D eslint-plugin-react@^7.37.4
call npm install -D eslint-plugin-react-hooks@^5.0.0
call npm install -D eslint-plugin-react-refresh@^0.4.18
call npm install -D globals@^15.14.0
call npm install -D @types/react@^19.0.8 @types/react-dom@^19.0.3

echo Configurando archivos...

REM Crear vite.config.js
echo import { defineConfig } from 'vite' > vite.config.js
echo import react from '@vitejs/plugin-react' >> vite.config.js
echo import tailwindcss from '@tailwindcss/vite' >> vite.config.js
echo. >> vite.config.js
echo // https://vite.dev/config/ >> vite.config.js
echo export default defineConfig({ >> vite.config.js
echo   plugins: [ >> vite.config.js
echo     react(), >> vite.config.js
echo     tailwindcss(), >> vite.config.js
echo   ], >> vite.config.js
echo   server: { >> vite.config.js
echo     host: true, >> vite.config.js
echo     port: 5174, >> vite.config.js
echo     proxy: { >> vite.config.js
echo       '/api': { >> vite.config.js
echo         target: 'http://localhost:3000', >> vite.config.js
echo         changeOrigin: true, >> vite.config.js
echo         secure: false, >> vite.config.js
echo         rewrite: (path) =^> path.replace(/^\/api/, '/api'), >> vite.config.js
echo       }, >> vite.config.js
echo     } >> vite.config.js
echo   }, >> vite.config.js
echo }) >> vite.config.js

REM Crear eslint.config.js
echo import js from '@eslint/js' > eslint.config.js
echo import globals from 'globals' >> eslint.config.js
echo import react from 'eslint-plugin-react' >> eslint.config.js
echo import reactHooks from 'eslint-plugin-react-hooks' >> eslint.config.js
echo import reactRefresh from 'eslint-plugin-react-refresh' >> eslint.config.js
echo. >> eslint.config.js
echo export default [ >> eslint.config.js
echo   { ignores: ['dist'] }, >> eslint.config.js
echo   { >> eslint.config.js
echo     files: ['**/*.{js,jsx}'], >> eslint.config.js
echo     languageOptions: { >> eslint.config.js
echo       ecmaVersion: 2020, >> eslint.config.js
echo       globals: globals.browser, >> eslint.config.js
echo       parserOptions: { >> eslint.config.js
echo         ecmaVersion: 'latest', >> eslint.config.js
echo         ecmaFeatures: { jsx: true }, >> eslint.config.js
echo         sourceType: 'module', >> eslint.config.js
echo       }, >> eslint.config.js
echo     }, >> eslint.config.js
echo     settings: { react: { version: '19.0' } }, >> eslint.config.js
echo     plugins: { >> eslint.config.js
echo       react, >> eslint.config.js
echo       'react-hooks': reactHooks, >> eslint.config.js
echo       'react-refresh': reactRefresh, >> eslint.config.js
echo     }, >> eslint.config.js
echo     rules: { >> eslint.config.js
echo       ...js.configs.recommended.rules, >> eslint.config.js
echo       ...react.configs.recommended.rules, >> eslint.config.js
echo       ...react.configs['jsx-runtime'].rules, >> eslint.config.js
echo       ...reactHooks.configs.recommended.rules, >> eslint.config.js
echo       'react/jsx-no-target-blank': 'off', >> eslint.config.js
echo       'react-refresh/only-export-components': [ >> eslint.config.js
echo         'warn', >> eslint.config.js
echo         { allowConstantExport: true }, >> eslint.config.js
echo       ], >> eslint.config.js
echo     }, >> eslint.config.js
echo   }, >> eslint.config.js
echo ] >> eslint.config.js

REM Actualizar src/index.css
echo @import "tailwindcss"; > src\index.css
echo. >> src\index.css
echo .no-scrollbar::-webkit-scrollbar { >> src\index.css
echo   display: none; >> src\index.css
echo } >> src\index.css
echo .no-scrollbar { >> src\index.css
echo   -ms-overflow-style: none; >> src\index.css
echo   scrollbar-width: none; >> src\index.css
echo } >> src\index.css

REM Crear estructura de carpetas
mkdir src\components 2>nul
mkdir src\pages 2>nul
mkdir src\contexts 2>nul
mkdir src\hooks 2>nul
mkdir src\services 2>nul
mkdir src\utils 2>nul
mkdir src\layouts 2>nul
mkdir src\assets 2>nul

echo.
echo ========================================
echo Proyecto creado exitosamente!
echo ========================================
echo.
echo Para iniciar el servidor de desarrollo:
echo   cd %1
echo   npm run dev
echo.
echo El servidor estará disponible en: http://localhost:5174
echo.
pause

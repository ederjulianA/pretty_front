#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Creando proyecto React + Vite + Tailwind CSS 4...${NC}"

if [ -z "$1" ]; then
    echo -e "${RED}Error: Debes proporcionar un nombre para el proyecto${NC}"
    echo "Uso: ./init-project.sh nombre-del-proyecto"
    exit 1
fi

PROJECT_NAME=$1

# Crear proyecto con Vite
npm create vite@latest $PROJECT_NAME -- --template react
cd $PROJECT_NAME

echo -e "${YELLOW}Instalando dependencias principales...${NC}"
npm install @tailwindcss/vite@^4.0.5 tailwindcss@^4.0.5
npm install react@^19.0.0 react-dom@^19.0.0
npm install react-router-dom@^7.2.0 axios@^1.7.9
npm install react-icons@^5.5.0 react-toastify@^11.0.5
npm install sweetalert2@^11.16.0 chart.js@^4.4.8
npm install react-chartjs-2@^5.3.0 date-fns@^4.1.0
npm install lodash@^4.17.21 jspdf@^2.5.2
npm install jspdf-autotable@^3.8.4 react-dropzone@^14.3.8

echo -e "${YELLOW}Instalando dependencias de desarrollo...${NC}"
npm install -D @vitejs/plugin-react@^4.3.4 vite@^6.1.0
npm install -D eslint@^9.19.0 @eslint/js@^9.19.0
npm install -D eslint-plugin-react@^7.37.4
npm install -D eslint-plugin-react-hooks@^5.0.0
npm install -D eslint-plugin-react-refresh@^0.4.18
npm install -D globals@^15.14.0
npm install -D @types/react@^19.0.8 @types/react-dom@^19.0.3

echo -e "${YELLOW}Configurando archivos...${NC}"

# Crear vite.config.js
cat > vite.config.js << 'EOF'
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
EOF

# Crear eslint.config.js
cat > eslint.config.js << 'EOF'
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
EOF

# Actualizar src/index.css
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

# Crear estructura de carpetas
mkdir -p src/components
mkdir -p src/pages
mkdir -p src/contexts
mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/utils
mkdir -p src/layouts
mkdir -p src/assets

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Proyecto creado exitosamente!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Para iniciar el servidor de desarrollo:${NC}"
echo -e "  ${YELLOW}cd $PROJECT_NAME${NC}"
echo -e "  ${YELLOW}npm run dev${NC}"
echo ""
echo -e "${BLUE}El servidor estará disponible en:${NC} ${GREEN}http://localhost:5174${NC}"
echo ""

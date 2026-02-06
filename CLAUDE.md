# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

POS Pretty is a modern inventory and sales management system (Point of Sale) built with React 19, Vite 6, and Tailwind CSS 4. The system provides comprehensive inventory management, product catalog, sales processing, role-based access control, and promotional event management.

## Development Commands

```bash
# Start development server (runs on port 5174)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## Multi-Backend Architecture

This frontend connects to THREE separate backend services through Vite proxy configuration:

1. **Node.js API** (`/api`) → `localhost:3000`
   - Main authentication and business logic
   - User management, roles, and permissions

2. **Spring Boot Microservices** (`/api-spring`) → `localhost:8080`
   - Spring-based microservices
   - Uses different base path internally (`/api` on Spring)

3. **PHP GenExus API** (`/mipuntoV1`) → `localhost:8088`
   - Legacy GenExus system
   - WooCommerce integration

**Important**: When making API calls:
- Use `axiosInstance` (from [axiosConfig.js](src/axiosConfig.js)) for Node.js API (`/api`)
- Use `springAxios` (from [axiosConfig.js](src/axiosConfig.js)) for Spring Boot API (`/api-spring`)
- The proxy rewrites `/api-spring/*` to `/api/*` on the Spring backend
- In production (Vercel), these proxies are configured in [vercel.json](vercel.json)

## Authentication System

Authentication uses JWT tokens with a role-based permission system:

- **Token Storage**: `localStorage.getItem('pedidos_pretty_token')`
- **Token Header**: `x-access-token` (NOT `Authorization`)
- **User Data**: Stored in `localStorage` as `user_pretty`, `user_role`, `user_permissions`
- **Auth Context**: [src/contexts/AuthContext.jsx](src/contexts/AuthContext.jsx) manages auth state globally
- **Auto-logout**: 401 responses trigger automatic logout with SweetAlert2 modal

### Role-Based Access Control (RBAC)

The system implements granular permissions with:
- **Modules**: dashboard, products, orders, clients, ajustes, conteos, pos, admin
- **Permissions per module**: view, create, edit, delete, manage_roles, manage_users
- **Protected Routes**: Use `<ProtectedRoute requiredModule="..." requiredPermission="...">` wrapper
- **Example**: See [src/App.jsx](src/App.jsx) routes configuration

## Key Architectural Patterns

### 1. Component Structure
- **Pages** ([src/pages/](src/pages/)): Full-page components with business logic
- **Components** ([src/components/](src/components/)): Reusable UI components
- **Layouts** ([src/layouts/](src/layouts/)): Layout wrappers (AdminLayout for admin panel)

### 2. State Management
- **Global State**: React Context ([src/contexts/AuthContext.jsx](src/contexts/AuthContext.jsx))
- **Local State**: Component state with useState
- **Custom Hooks** ([src/hooks/](src/hooks/)): Reusable stateful logic
  - `useProducts`, `useCategories`, `useClients`, `usePromociones`, etc.
  - `usePersistentState`: localStorage-backed state
  - `usePrintOrder`: PDF generation for orders

### 3. API Service Layer
Located in [src/services/](src/services/):
- `photoService.js`: Product photo management
- `nitService.js`: NIT validation service
- `springService.js`: Spring Boot API interactions

### 4. Routing Architecture
- Main routes defined in [src/App.jsx](src/App.jsx)
- Two layout contexts:
  1. **Admin Panel**: Uses `<AdminLayout>` with sidebar navigation
  2. **POS Mode**: Standalone fullscreen POS interface at `/pos`
- All admin routes nested under `/` with `<AdminLayout>`

## Tailwind CSS 4 Configuration

This project uses Tailwind CSS 4 with the new simplified configuration:

- **No config file**: Uses `@import "tailwindcss"` in [src/index.css](src/index.css)
- **Custom utilities**: Defined directly in CSS (e.g., `.no-scrollbar`)
- **Vite plugin**: `@tailwindcss/vite` configured in [vite.config.js](vite.config.js)

## Environment Variables

Required in `.env`:
```bash
VITE_MIPUNTO_URL=http://localhost:8088  # PHP GenExus API URL
VITE_SPRING_API_URL=/api-spring         # Spring Boot API (optional, defaults to /api-spring)
```

## Key Functionality Areas

### Products & Inventory
- Full CRUD for products with photo gallery ([src/pages/Products.jsx](src/pages/Products.jsx))
- Multi-photo upload with drag-and-drop reordering
- WooCommerce sync capability ([src/components/SyncWooModal.jsx](src/components/SyncWooModal.jsx))
- Stock adjustments (Ajustes) and physical counts (Conteos)

### Sales & POS
- Full-featured POS interface ([src/POS2.jsx](src/POS2.jsx))
- Order management with client association
- Wholesale/retail pricing logic
- Receipt printing with jsPDF

### Administration
- User management with role assignment ([src/pages/UserManager.jsx](src/pages/UserManager.jsx))
- Dynamic role and permission management ([src/pages/RoleManager.jsx](src/pages/RoleManager.jsx))
- Dashboard with sales analytics ([src/pages/Dashboard.jsx](src/pages/Dashboard.jsx))

### Promotions System
- Promotion rules (Promociones) with configurable discounts
- Promotional events (Eventos Promocionales) with date ranges
- Applied automatically in POS based on event dates

## Common Development Patterns

### Making API Calls
```javascript
// For Node.js API
import axiosInstance from '../axiosConfig';
const response = await axiosInstance.get('/products');

// For Spring Boot API
import { springAxios } from '../axiosConfig';
const response = await springAxios.get('/some-endpoint');
```

### Using Protected Routes
```javascript
<Route
  path="products"
  element={
    <ProtectedRoute requiredModule="products" requiredPermission="view">
      <Products />
    </ProtectedRoute>
  }
/>
```

### Creating Custom Hooks
See existing hooks in [src/hooks/](src/hooks/) for patterns. Common pattern:
- Use `useState` for data, loading, and error states
- Fetch data with `useEffect`
- Return data and utility functions

## Styling Guidelines

- Use Tailwind utility classes for all styling
- Glassmorphism design pattern: `bg-white/80 backdrop-blur-md`
- Primary color: pink (#f58ea3) - used in buttons, accents
- Rounded corners: prefer `rounded-xl` or `rounded-2xl`
- Shadows: `shadow-lg`, `shadow-xl` for depth

## Important Notes

1. **Port Configuration**: Dev server runs on port 5174 (not default 5173)
2. **Token Expiry**: All 401 responses trigger automatic logout
3. **Password Changes**: System supports forced password changes (`cambia_pass` flag)
4. **Breadcrumbs**: Admin layout includes automatic breadcrumb navigation
5. **Notifications**: Use `react-toastify` for success messages, `SweetAlert2` for confirmations
6. **Date Handling**: Use `date-fns` library (imported in multiple components)

## Testing

No automated tests are currently configured. Manual testing is done through the development server.

## Deployment

- Production deployment via Vercel
- [vercel.json](vercel.json) handles API proxying and SPA routing
- Build output in `dist/` directory

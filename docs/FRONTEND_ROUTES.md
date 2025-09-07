# 🌐 Frontend Routes Documentation

Documentación completa de las rutas y páginas disponibles en el Finance Tracker frontend.

## 🏠 **Estructura de Rutas**

### **Públicas** (Sin autenticación)
| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/` | `Navigate` → `/dashboard` | Redirect automático |
| `/login` | `LoginPage` | Página de inicio de sesión |
| `/register` | `RegisterPage` | Página de registro |

### **Privadas** (Requieren autenticación)
| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/dashboard` | `DashboardPage` | Panel principal del usuario |
| `/accounts` | `AccountsPage` | Gestión de cuentas financieras |
| `/cards` | `CardsPage` | Gestión de tarjetas de crédito/débito |
| `/transactions` | `TransactionsPage` | Historial de transacciones |
| `/reports` | `ReportsPage` | Reportes y analytics |
| `/profile` | `ProfilePage` | Configuración de perfil |

## 🔒 **Protección de Rutas**

```tsx
// Componente ProtectedRoute
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>

// Lógica de protección
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
```

## 🎯 **Configuración de React Router**

### **App.tsx Principal**
```tsx
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Rutas protegidas */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
          <Route path="/accounts" element={
            <ProtectedRoute>
              <AccountsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/cards" element={
            <ProtectedRoute>
              <CardsPage />
            </ProtectedRoute>
          } />
          
          {/* Redirect por defecto */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 handler */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

## 🌐 **Cómo Funciona el Hosting en S3 + CloudFront**

### **1. Estructura de Archivos Desplegados**
```
S3 Bucket: finance-tracker-frontend-dev-abc123/
├── index.html                    # SPA entry point
├── static/
│   ├── css/main.a1b2c3.css      # Estilos compilados
│   ├── js/main.d4e5f6.js        # React app bundle
│   └── media/logo.svg            # Assets estáticos
├── manifest.json                 # PWA config
└── robots.txt                    # SEO
```

### **2. Flujo de Navegación**

#### **Carga Inicial** 
```
Usuario → https://tu-app.cloudfront.net/
      ↓
CloudFront → S3: GET /index.html
      ↓
S3 → CloudFront: index.html (200)
      ↓
Browser: Descarga y ejecuta React app
      ↓
React Router: Evalúa URL actual → Renderiza componente
```

#### **Navegación SPA (Client-side)**
```
Usuario click "Dashboard"
      ↓
React Router: Cambia URL a /dashboard
      ↓
NO hay request HTTP al servidor
      ↓
React: Renderiza <DashboardPage />
```

#### **Refresh/Link Directo**
```
Usuario → https://tu-app.cloudfront.net/dashboard
      ↓
CloudFront → S3: GET /dashboard
      ↓
S3: 404 - Archivo /dashboard no existe
      ↓
CloudFront: Error 404 → Devolver /index.html (200)
      ↓
Browser: Recibe index.html
      ↓
React Router: Lee URL /dashboard → Renderiza <DashboardPage />
```

### **3. Configuración Crítica de CloudFront**

**Error Responses (Terraform):**
```hcl
# Cualquier 404/403 → index.html
custom_error_response {
  error_code         = 404
  response_code      = 200  # ¡Importante!
  response_page_path = "/index.html"
}

custom_error_response {
  error_code         = 403
  response_code      = 200  # ¡Importante!
  response_page_path = "/index.html"
}
```

## 📱 **Comportamientos por Ruta**

### **Ruta: `/` (Root)**
- **Primera visita**: Redirect a `/dashboard`
- **Autenticado**: Muestra Dashboard
- **No autenticado**: Redirect a `/login`

### **Ruta: `/login`**
- **GET**: Formulario de login
- **POST**: Autenticación → Redirect a `/dashboard`
- **Ya autenticado**: Redirect a `/dashboard`

### **Ruta: `/dashboard`**
- **Requiere**: JWT token válido
- **Muestra**: Resumen financiero, gráficos, accesos rápidos
- **APIs llamadas**: 
  - `GET /users/profile`
  - `GET /accounts`
  - `GET /reports/summary`

### **Ruta: `/accounts`**
- **Requiere**: JWT token válido
- **Muestra**: Lista de cuentas financieras
- **APIs llamadas**:
  - `GET /accounts`
  - `POST /accounts` (crear nueva)
  - `PUT /accounts/{id}` (editar)

### **Ruta: `/cards`**
- **Requiere**: JWT token válido
- **Muestra**: Lista de tarjetas de crédito y débito
- **Query params**: `?status=active&type=credit`
- **APIs llamadas**:
  - `GET /cards`
  - `POST /cards` (crear nueva)
  - `PUT /cards/{id}` (editar)
  - `DELETE /cards/{id}` (eliminar)
  - `POST /cards/{id}/transactions` (agregar transacción)
  - `POST /cards/{id}/payment` (hacer pago)
- **Características**:
  - Gestión completa de tarjetas
  - Cálculos automáticos de crédito disponible
  - Alertas de fechas de pago
  - Transacciones y pagos
  - Visualización con colores personalizados

### **Ruta: `/transactions`**
- **Requiere**: JWT token válido
- **Query params**: `?account_id=123&start_date=2025-01-01`
- **APIs llamadas**:
  - `GET /accounts/{id}/transactions`

## 🎨 **Configuración de Assets Estáticos**

### **Caché Strategy**
```javascript
// Configurado automáticamente por el workflow

// Archivos HTML (index.html, etc.)
Cache-Control: public, max-age=0, must-revalidate

// Assets estáticos (CSS, JS, imágenes)
Cache-Control: public, max-age=31536000, immutable
```

### **Asset Paths**
```tsx
// En React components
import logo from './assets/logo.svg';        // → /static/media/logo.a1b2c3.svg
import './styles/Dashboard.css';             // → /static/css/main.d4e5f6.css

// En JSX
<img src={logo} alt="Logo" />                // ✅ Funciona
<img src="/logo.svg" alt="Logo" />           // ❌ 404 - no existe en S3
<img src={process.env.PUBLIC_URL + '/logo.svg'} alt="Logo" />  // ✅ Si está en public/
```

## 🛠️ **Debugging de Rutas**

### **Verificar que una ruta funciona**
```bash
# Debe devolver 200 y contenido HTML
curl -s https://tu-cloudfront-url.com/dashboard | grep -i "<!doctype html"

# Verificar headers
curl -I https://tu-cloudfront-url.com/dashboard
```

### **Problemas Comunes**

**❌ Error: "Cannot GET /dashboard"**
- **Causa**: CloudFront no configurado para SPA
- **Solución**: Verificar `custom_error_response` en Terraform

**❌ Error: "Page not found" en React**
- **Causa**: Ruta no definida en React Router
- **Solución**: Agregar ruta en `App.tsx`

**❌ Error: Assets no cargan (404)**
- **Causa**: Paths incorrectos o `PUBLIC_URL` mal configurado
- **Solución**: Verificar `homepage` en `package.json`

## 📊 **Monitoreo y Analytics**

### **Métricas Importantes**
- **Page Views**: Cada cambio de ruta
- **Bounce Rate**: Usuarios que salen sin interactuar
- **Load Time**: Tiempo de carga inicial
- **Error Rate**: 404s, crashes de JavaScript

### **Implementación**
```typescript
// En cada página
import { trackPageView } from '../utils/analytics';

useEffect(() => {
  trackPageView('Dashboard');
}, []);
```

## 🚀 **Optimizaciones**

### **Code Splitting por Ruta**
```tsx
// Lazy loading de páginas
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const CardsPage = lazy(() => import('./pages/CardsPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

// En App.tsx
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/accounts" element={<AccountsPage />} />
    <Route path="/cards" element={<CardsPage />} />
    <Route path="/transactions" element={<TransactionsPage />} />
    <Route path="/reports" element={<ReportsPage />} />
  </Routes>
</Suspense>
```

### **Preloading Crítico**
```tsx
// Precargar datos críticos
useEffect(() => {
  // Preload user profile, accounts y cards en paralelo
  Promise.all([
    userService.getProfile(),
    accountsService.getAccounts(),
    cardService.getCards()
  ]);
}, []);
```

---

📝 **Nota**: Esta configuración está optimizada para SPAs modernas con React Router v6 y deployment en AWS CloudFront + S3.

# 🌐 Frontend Configuration Guide

Guía completa para configurar y desplegar el frontend del Finance Tracker.

## 🏗️ Arquitectura

```
Frontend (React + TypeScript)
    ↓
CloudFront CDN
    ↓
S3 Bucket (Static Hosting)
    ↓
API Gateway (Backend)
    ↓
Lambda Functions
    ↓
DynamoDB
```

## 🔧 Configuración Local

### 1. **Instalar Dependencias**

```bash
cd frontend
npm install
```

### 2. **Configurar Variables de Entorno**

Crear `.env.local` para desarrollo:

```bash
# Backend API
REACT_APP_API_URL=https://your-api-gateway-url.execute-api.mx-central-1.amazonaws.com/dev
REACT_APP_ENVIRONMENT=development

# Frontend URL (para callbacks y CORS)
REACT_APP_FRONTEND_URL=http://localhost:3000

# Configuración de build
GENERATE_SOURCEMAP=true
PUBLIC_URL=/
```

Crear `.env.production` para producción:

```bash
# Backend API (se configura automáticamente por Terraform)
REACT_APP_API_URL=https://your-api-gateway-url.execute-api.mx-central-1.amazonaws.com/prod
REACT_APP_ENVIRONMENT=production

# Frontend URL (se obtiene de CloudFront)
REACT_APP_FRONTEND_URL=https://your-cloudfront-domain.cloudfront.net

# Optimizaciones de producción
GENERATE_SOURCEMAP=false
PUBLIC_URL=/
```

### 3. **Ejecutar en Desarrollo**

```bash
cd frontend
npm start
```

## 🚀 Despliegue Automático

### Configurar GitHub Secrets

Ve a tu repositorio → Settings → Secrets and variables → Actions

Agrega estos secretos:

```
AWS_ACCESS_KEY_ID=tu_aws_access_key
AWS_SECRET_ACCESS_KEY=tu_aws_secret_key
TERRAFORM_STATE_BUCKET=finance-tracker-serverless-tfstates
```

### Desplegar Frontend

#### **Opción 1: Push Automático**
```bash
# Cualquier cambio en la carpeta frontend/ despliega automáticamente
git add .
git commit -m "Update frontend"
git push origin main
```

#### **Opción 2: Despliegue Manual**
1. Ve a tu repositorio en GitHub
2. Click en "Actions"
3. Selecciona "Deploy Frontend"
4. Click "Run workflow"
5. Selecciona ambiente (dev/prod)

## 📁 Estructura de Archivos

```
frontend/
├── public/
│   ├── index.html          # Template principal
│   ├── manifest.json       # PWA manifest
│   └── favicon.ico
├── src/
│   ├── components/         # Componentes reutilizables
│   │   ├── auth/          # Componentes de autenticación
│   │   └── ui/            # Componentes de UI
│   ├── context/           # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── index.ts
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useUserProfile.ts
│   ├── pages/             # Páginas principales
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── DashboardPage.tsx
│   ├── services/          # Servicios API
│   │   ├── apiClient.ts   # Cliente HTTP configurado
│   │   ├── authService.ts # Servicio de autenticación
│   │   └── userService.ts # Servicio de usuarios
│   ├── types/             # Tipos TypeScript
│   │   ├── auth.ts
│   │   └── index.ts
│   ├── utils/             # Utilidades
│   │   ├── helpers.ts
│   │   └── jwt.ts
│   ├── App.tsx            # Componente principal
│   ├── index.tsx          # Entry point
│   └── index.css          # Estilos globales
├── package.json
├── tsconfig.json
└── build/                 # Archivos generados (solo después de build)
```

## 🔌 Integración con Backend

### Configuración del Cliente API

El archivo `src/services/apiClient.ts` configura automáticamente:

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Servicios Disponibles

#### **authService.ts**
```typescript
import apiClient from './apiClient';

export const authService = {
  login: (email: string, password: string) => 
    apiClient.post('/auth/login', { email, password }),
  
  register: (email: string, password: string, name: string) => 
    apiClient.post('/auth/register', { email, password, name }),
  
  refreshToken: () => 
    apiClient.post('/auth/refresh'),
  
  logout: () => {
    localStorage.removeItem('jwt_token');
    window.location.href = '/login';
  }
};
```

#### **userService.ts**
```typescript
import apiClient from './apiClient';

export const userService = {
  getProfile: () => 
    apiClient.get('/users/profile'),
  
  updateProfile: (data: UpdateProfileData) => 
    apiClient.put('/users/profile', data),
};
```

## 🎨 Configuración de Estilos

### CSS Variables (en `src/index.css`)

```css
:root {
  /* Colores principales */
  --color-primary: #10b981;
  --color-secondary: #6b7280;
  --color-success: #059669;
  --color-warning: #d97706;
  --color-error: #dc2626;
  
  /* Colores de fondo */
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-dark: #1f2937;
  
  /* Texto */
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-light: #9ca3af;
  
  /* Sombras */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

/* Tema oscuro */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1f2937;
    --bg-secondary: #111827;
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
  }
}
```

## 🔒 Configuración de Autenticación

### AuthContext Setup

```typescript
// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      // Verificar token y obtener usuario
      verifyTokenAndGetUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    const { token, user } = response.data.data;
    
    localStorage.setItem('jwt_token', token);
    setUser(user);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## 📱 Configuración PWA (Progressive Web App)

### Manifest Configuration

```json
// public/manifest.json
{
  "short_name": "Finance Tracker",
  "name": "Personal Finance Tracker",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#10b981",
  "background_color": "#ffffff",
  "orientation": "portrait"
}
```

## 🐛 Debugging y Logs

### Configuración de Logs

```typescript
// src/utils/logger.ts
const isDev = process.env.REACT_APP_ENVIRONMENT === 'development';

export const logger = {
  debug: (message: string, data?: any) => {
    if (isDev) {
      console.log(`🐛 ${message}`, data);
    }
  },
  
  info: (message: string, data?: any) => {
    if (isDev) {
      console.info(`ℹ️ ${message}`, data);
    }
  },
  
  error: (message: string, error?: Error) => {
    console.error(`❌ ${message}`, error);
    
    // En producción, enviar a servicio de monitoreo
    if (!isDev) {
      // sendToMonitoringService(message, error);
    }
  }
};
```

## ⚡ Optimizaciones de Performance

### Code Splitting

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Suspense>
  );
}
```

### Service Worker para Caché

```javascript
// public/sw.js (si necesitas caché personalizado)
const CACHE_NAME = 'finance-tracker-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

## 🔍 Troubleshooting Común

### Error 403 Access Denied
```bash
# 1. Verificar que los archivos estén en S3
aws s3 ls s3://tu-bucket-frontend/ --recursive

# 2. Verificar política del bucket
aws s3api get-bucket-policy --bucket tu-bucket-frontend

# 3. Invalidar caché de CloudFront
aws cloudfront create-invalidation --distribution-id ABCD1234 --paths "/*"
```

### Problemas de CORS
```typescript
// Verificar configuración de API Gateway
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.REACT_APP_FRONTEND_URL,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};
```

### Variables de Entorno No Cargadas
```bash
# Verificar que empiecen con REACT_APP_
REACT_APP_API_URL=https://api.example.com  # ✅ Correcto
API_URL=https://api.example.com            # ❌ No se carga
```

## 📊 Métricas y Monitoreo

### Performance Metrics

```typescript
// src/utils/metrics.ts
export const trackPageView = (pageName: string) => {
  if (process.env.REACT_APP_ENVIRONMENT === 'production') {
    // Google Analytics, Mixpanel, etc.
    console.log(`Page view: ${pageName}`);
  }
};

export const trackUserAction = (action: string, data?: any) => {
  if (process.env.REACT_APP_ENVIRONMENT === 'production') {
    console.log(`Action: ${action}`, data);
  }
};
```

## 🚀 Comandos Útiles

```bash
# Desarrollo local
npm start                 # Iniciar dev server
npm test                  # Ejecutar tests
npm run build            # Build para producción
npm run analyze          # Analizar bundle size

# Deployment
git push origin main                    # Deploy automático
gh workflow run "Deploy Frontend"      # Deploy manual

# Debugging
npm run build && npx serve -s build   # Probar build localmente
```

---

📝 **Nota**: Esta configuración está optimizada para la región `mx-central-1` de AWS y moneda mexicana (MXN). Ajusta las configuraciones según tus necesidades específicas.

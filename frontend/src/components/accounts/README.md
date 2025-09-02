# Componentes de Cuentas - Finance Tracker

Esta documentación describe los componentes mejorados para la gestión de cuentas bancarias en el Finance Tracker.

## Componentes Principales

### AccountCard

Tarjeta individual que muestra la información de una cuenta bancaria.

#### Características:
- **Diseño moderno** con indicador de color personalizable
- **Información completa**: nombre, banco, tipo, balance, descripción
- **Animaciones suaves** con Framer Motion
- **Acciones rápidas**: editar, eliminar, actualizar balance
- **Estado visual** del balance (positivo/negativo)
- **Responsive design** adaptable a diferentes tamaños

#### Props:
```typescript
interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onUpdateBalance: (account: Account) => void;
}
```

### AccountStats

Panel de estadísticas que muestra un resumen general de las cuentas.

#### Características:
- **Tarjetas con gradientes** para mostrar métricas importantes
- **Balance total por moneda** con indicadores visuales
- **Conteo de cuentas** por estado (positivas/negativas)
- **Distribución por tipo** de cuenta con gráficos
- **Animaciones escalonadas** para mejor UX

#### Props:
```typescript
interface AccountStatsProps {
  accounts: Account[];
  totalBalance: Record<string, number>;
  totalAccounts: number;
  isLoading: boolean;
}
```

### AccountFiltersBar

Barra de filtros y búsqueda avanzada para cuentas.

#### Características:
- **Búsqueda en tiempo real** por nombre, descripción o banco
- **Filtros múltiples**: tipo, banco, moneda, estado del balance
- **Ordenamiento avanzado** por diferentes campos
- **Filtros activos visuales** con chips removibles
- **UI adaptable** con diseño responsive

#### Props:
```typescript
interface AccountFiltersBarProps {
  filters: AccountFilters;
  sort: AccountSort;
  onFiltersChange: (filters: AccountFilters) => void;
  onSortChange: (sort: AccountSort) => void;
  onClearFilters: () => void;
  accounts: Account[];
}
```

## Página Principal - AccountsPage

### Funcionalidades Principales

#### 1. **Dashboard Completo**
- Vista general con estadísticas en tiempo real
- Resumen por tipo de cuenta y moneda
- Indicadores visuales de salud financiera

#### 2. **Gestión CRUD Completa**
- ✅ **Crear** cuentas con validación completa
- ✅ **Leer** lista de cuentas con filtros
- ✅ **Actualizar** información y balances
- ✅ **Eliminar** con confirmación de seguridad

#### 3. **Filtrado y Búsqueda Avanzada**
- Búsqueda por texto en tiempo real
- Filtros por tipo de cuenta, banco, moneda
- Filtros por estado del balance
- Ordenamiento multidimensional

#### 4. **Experiencia de Usuario Mejorada**
- **Animaciones fluidas** con Framer Motion
- **Feedback visual** con toast notifications
- **Estados de carga** informativos
- **Diseño responsive** para mobile y desktop

#### 5. **Interfaz Moderna**
- **Material Design 3.0** con componentes actualizados
- **Temas personalizables** con soporte dark/light
- **Gradientes y sombras** para profundidad visual
- **Iconografía consistente** en toda la aplicación

### Diálogos Interactivos

#### Crear/Editar Cuenta
- Formularios con validación en tiempo real
- Selector de colores visual
- Campos adaptativos según el contexto

#### Actualizar Balance
- Interface simple y directa
- Validación de montos
- Contexto visual de la cuenta

#### Confirmación de Eliminación
- Diálogo de seguridad
- Información clara sobre la acción
- Prevención de eliminaciones accidentales

### Tecnologías Utilizadas

- **React** con TypeScript
- **Material-UI (MUI)** v5+
- **Framer Motion** para animaciones
- **React Hook Form** para formularios
- **Yup** para validación
- **React Hot Toast** para notificaciones

### Responsive Design

#### Desktop (> 768px)
- Layout de tarjetas flexible
- Sidebar de filtros completo
- Todas las funcionalidades visibles

#### Tablet (768px - 1024px)
- Adaptación de columnas
- Filtros colapsables
- Navegación optimizada

#### Mobile (< 768px)
- Vista de lista vertical
- Speed Dial para acciones rápidas
- Navegación simplificada
- Filtros en modal

## Configuración de Colores

Los colores de las cuentas se pueden personalizar desde una paleta predefinida:

```typescript
const DEFAULT_ACCOUNT_COLORS = [
  '#1976d2', // Blue
  '#388e3c', // Green
  '#f57c00', // Orange
  '#7b1fa2', // Purple
  '#c2185b', // Pink
  '#00796b', // Teal
  '#5d4037', // Brown
  '#455a64', // Blue Grey
  '#e53935', // Red
  '#fbc02d', // Yellow
];
```

## Mejoras Implementadas

### Desde la Versión Anterior:

1. **Performance**:
   - Memoización de filtros y ordenamiento
   - Lazy loading de componentes pesados
   - Optimización de re-renders

2. **UX/UI**:
   - Interfaz más moderna y atractiva
   - Feedback visual mejorado
   - Navegación más intuitiva

3. **Funcionalidad**:
   - Filtros más potentes y flexibles
   - Búsqueda en tiempo real
   - Gestión de estados mejorada

4. **Accesibilidad**:
   - Soporte completo para lectores de pantalla
   - Navegación por teclado
   - Contraste de colores optimizado

5. **Responsividad**:
   - Diseño mobile-first
   - Componentes adaptativos
   - Touch-friendly en dispositivos móviles

## Próximas Mejoras

- **Exportación de datos** (PDF, Excel, CSV)
- **Gráficos de tendencias** de balances
- **Notificaciones push** para cambios importantes
- **Sincronización automática** con bancos (Open Banking)
- **Categorización automática** de movimientos
- **Presupuestos y metas** por cuenta

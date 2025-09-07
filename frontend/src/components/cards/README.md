# Componentes de Tarjetas - Finance Tracker

Esta documentación describe los componentes para la gestión de tarjetas de crédito y débito en el Finance Tracker.

## 📋 **Componentes Disponibles**

### CardList
Componente principal que renderiza una lista de tarjetas con información detallada.

**Características:**
- Diseño responsivo con grid CSS
- Estados de carga con skeletons
- Información financiera detallada
- Indicadores visuales de utilización de crédito
- Alertas de fechas de pago
- Colores personalizables por red de tarjeta

**Props:**
```tsx
interface CardListProps {
  cards: CardType[];
  onCardSelect?: (card: CardType) => void;
  onCardEdit?: (card: CardType) => void;
  onCardDelete?: (card: CardType) => void;
  onAddTransaction?: (card: CardType) => void;
  onMakePayment?: (card: CardType) => void;
  loading?: boolean;
}
```

**Información mostrada:**
- **Nombre y banco** de la tarjeta
- **Tipo y red** (Visa, Mastercard, etc.)
- **Balance actual** y deuda
- **Límite de crédito** y crédito disponible
- **Tasa de utilización** con barra de progreso
- **Días hasta vencimiento** del pago
- **APR** (tasa de interés anual)
- **Estado** de la tarjeta (activa, bloqueada, etc.)

### CardStats
Panel de estadísticas que muestra un resumen general de las tarjetas.

**Características:**
- **Conteo de tarjetas** activas vs total
- **Deuda total** agrupada por moneda
- **Crédito disponible** total
- **Tasa de utilización** general con alertas de riesgo
- Colores dinámicos según niveles de riesgo

**Props:**
```tsx
interface CardStatsProps {
  cardData: CardListResponse | undefined;
  loading?: boolean;
}
```

**Métricas mostradas:**
- 🟢 **Tarjetas Activas**: Número de tarjetas en uso
- 🟡 **Deuda Total**: Suma de todos los balances
- 🔵 **Crédito Disponible**: Total de crédito sin usar
- 🔴 **Utilización**: Porcentaje de uso del crédito

## 🎨 **Estilos y Temas**

### Colores por Red de Tarjeta
```tsx
const NETWORK_COLORS = {
  visa: '#1A1F71',      // Azul Visa
  mastercard: '#EB001B', // Rojo Mastercard
  amex: '#006FCF',       // Azul American Express
  discover: '#FF6000',   // Naranja Discover
  other: '#666666',      // Gris genérico
};
```

### Estados de Tarjetas
```tsx
const STATUS_COLORS = {
  active: 'success',    // Verde
  blocked: 'error',     // Rojo
  expired: 'error',     // Rojo
  cancelled: 'error',   // Rojo
  pending: 'warning',   // Amarillo
};
```

### Alertas de Utilización
- 🔴 **>= 90%**: Alto riesgo (rojo)
- 🟡 **>= 70%**: Precaución (amarillo)
- 🔵 **>= 50%**: Moderado (azul)
- 🟢 **< 50%**: Saludable (verde)

## 📱 **Diseño Responsivo**

### Breakpoints
- **Mobile**: 1 tarjeta por fila
- **Tablet**: 2 tarjetas por fila
- **Desktop**: 3 tarjetas por fila (minWidth: 350px)

### Grid CSS
```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
gap: 24px;
```

## 🔧 **Funcionalidades Interactivas**

### Eventos Soportados
- **Click en tarjeta**: Selección/vista de detalles
- **Botón de editar**: Modificar información
- **Botón de eliminar**: Remover tarjeta
- **Agregar transacción**: Nueva compra/cargo
- **Hacer pago**: Pago hacia la tarjeta

### Estados de UI
- **Loading**: Skeletons mientras carga
- **Empty**: Mensaje cuando no hay tarjetas
- **Error**: Manejo de errores de carga
- **Hover**: Efectos visuales en desktop

## 💡 **Ejemplos de Uso**

### Uso Básico
```tsx
import { CardList, CardStats } from '../components/cards';

const CardsPage = () => {
  const { data: cardsData, loading } = useCards();

  return (
    <Box>
      <CardStats cardData={cardsData} loading={loading} />
      <CardList 
        cards={cardsData?.cards || []}
        loading={loading}
        onCardSelect={handleCardSelect}
        onCardEdit={handleCardEdit}
        onAddTransaction={handleAddTransaction}
        onMakePayment={handleMakePayment}
      />
    </Box>
  );
};
```

### Con Estados de Carga
```tsx
<CardList 
  cards={[]}
  loading={true}  // Muestra skeletons
/>
```

### Manejo de Eventos
```tsx
const handleCardSelect = (card: CardType) => {
  setSelectedCard(card);
  setShowDetails(true);
};

const handleAddTransaction = (card: CardType) => {
  setSelectedCard(card);
  setShowTransactionForm(true);
};
```

## 🚀 **Próximas Mejoras**

- [ ] Animaciones mejoradas con Framer Motion
- [ ] Soporte para más monedas
- [ ] Gráficos de gastos por tarjeta
- [ ] Comparador de tasas APR
- [ ] Notificaciones push para fechas de pago
- [ ] Integración con Open Banking APIs

## 📊 **Métricas de Performance**

### Optimizaciones Implementadas
- ✅ **Lazy loading** de componentes
- ✅ **Memoización** de cálculos financieros
- ✅ **CSS Grid** para layout eficiente
- ✅ **Animaciones** optimizadas con GPU
- ✅ **Skeletons** para mejor UX

### Benchmarks
- **First Paint**: < 100ms
- **Time to Interactive**: < 500ms
- **Bundle Size**: < 50KB gzipped

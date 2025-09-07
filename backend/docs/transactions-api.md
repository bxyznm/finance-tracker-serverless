# Transactions API Documentation

## Overview

The Transactions API provides comprehensive functionality for managing financial transactions within the finance tracker system. It supports income tracking, expense management, account transfers, and detailed financial analytics.

## Features

- ✅ **Complete CRUD operations** for transactions
- ✅ **Account balance management** - automatic updates
- ✅ **Transfer transactions** - between user accounts
- ✅ **Advanced filtering and search** - by date, amount, category, tags
- ✅ **Transaction analytics** - summaries and insights
- ✅ **Mexican localization** - categories and transaction types
- ✅ **Pagination support** - efficient large dataset handling
- ✅ **JWT authentication** - secure access control
- ✅ **Comprehensive validation** - using Pydantic models

## API Endpoints

### 1. Create Transaction
**POST** `/transactions`

Creates a new transaction and automatically updates account balance.

#### Request Body
```json
{
  "account_id": "acc_test123",
  "amount": 250.75,
  "description": "Grocery shopping at Soriana",
  "transaction_type": "expense",
  "category": "groceries",
  "transaction_date": "2024-01-15T10:30:00",
  "reference_number": "REF-2024-001",
  "notes": "Weekly groceries for the family",
  "tags": ["family", "weekly", "essentials"],
  "location": "Soriana Hiper Centro",
  "is_recurring": false
}
```

#### Transfer Transaction
For transfers between accounts, include `destination_account_id`:
```json
{
  "account_id": "acc_checking123",
  "destination_account_id": "acc_savings456", 
  "amount": 1000.0,
  "description": "Transfer to savings",
  "transaction_type": "transfer",
  "category": "account_transfer"
}
```

#### Response (201 Created)
```json
{
  "message": "Transaction created successfully",
  "transaction": {
    "transaction_id": "txn_abc123def456",
    "user_id": "user_123",
    "account_id": "acc_test123",
    "account_name": "BBVA Cuenta de Cheques",
    "amount": 250.75,
    "description": "Grocery shopping at Soriana",
    "transaction_type": "expense",
    "category": "groceries",
    "status": "completed",
    "transaction_date": "2024-01-15T10:30:00",
    "reference_number": "REF-2024-001",
    "notes": "Weekly groceries for the family",
    "tags": ["family", "weekly", "essentials"],
    "location": "Soriana Hiper Centro",
    "destination_account_id": null,
    "destination_account_name": null,
    "account_balance_after": 2749.25,
    "created_at": "2024-01-15T10:30:00",
    "updated_at": "2024-01-15T10:30:00"
  }
}
```

### 2. List Transactions
**GET** `/transactions`

Retrieves transactions with advanced filtering, search, and pagination.

#### Query Parameters
- `account_id` (string): Filter by specific account
- `transaction_type` (string): Filter by type (income, expense, transfer, etc.)
- `category` (string): Filter by category (groceries, transportation, etc.)
- `status` (string): Filter by status (completed, pending, etc.)
- `date_from` (string): Start date (ISO format)
- `date_to` (string): End date (ISO format)
- `amount_min` (number): Minimum amount filter
- `amount_max` (number): Maximum amount filter
- `search_term` (string): Search in description, notes, reference
- `tags` (array): Filter by tags (OR logic)
- `page` (number): Page number (default: 1)
- `per_page` (number): Items per page (default: 50, max: 100)
- `sort_by` (string): Sort field (date, amount, description, created_at)
- `sort_order` (string): Sort order (asc, desc)

#### Example Request
```
GET /transactions?account_id=acc_test123&transaction_type=expense&category=groceries&date_from=2024-01-01T00:00:00&date_to=2024-01-31T23:59:59&page=1&per_page=25&sort_by=date&sort_order=desc
```

#### Response (200 OK)
```json
{
  "transactions": [...], // Array of transaction objects
  "total_count": 125,
  "page": 1,
  "per_page": 25,
  "total_pages": 5,
  "total_income": 15000.00,
  "total_expenses": 8750.50,
  "net_amount": 6249.50
}
```

### 3. Get Transaction
**GET** `/transactions/{transaction_id}`

Retrieves a specific transaction by ID.

#### Response (200 OK)
```json
{
  "transaction_id": "txn_abc123def456",
  "user_id": "user_123",
  "account_id": "acc_test123",
  "account_name": "BBVA Cuenta de Cheques",
  "amount": 250.75,
  "description": "Grocery shopping at Soriana",
  "transaction_type": "expense",
  "category": "groceries",
  "status": "completed",
  "transaction_date": "2024-01-15T10:30:00",
  "account_balance_after": 2749.25,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00"
}
```

### 4. Update Transaction
**PUT** `/transactions/{transaction_id}`

Updates transaction details (limited fields for data integrity).

#### Updatable Fields
- `description`: Transaction description
- `category`: Transaction category
- `notes`: Additional notes
- `tags`: Transaction tags
- `location`: Transaction location
- `reference_number`: External reference

#### Request Body
```json
{
  "description": "Updated grocery shopping description",
  "category": "food_drinks",
  "notes": "Updated notes about the transaction",
  "tags": ["updated", "grocery", "family"]
}
```

#### Response (200 OK)
```json
{
  "message": "Transaction updated successfully",
  "transaction": {
    // Updated transaction object
  }
}
```

### 5. Delete Transaction
**DELETE** `/transactions/{transaction_id}`

Deletes a transaction and reverts the account balance.

⚠️ **Warning**: This operation automatically reverts the account balance. Use with caution.

#### Response (200 OK)
```json
{
  "message": "Transaction deleted successfully",
  "account_balance_after_deletion": 3000.00
}
```

### 6. Transaction Summary
**GET** `/transactions/summary`

Provides detailed analytics and insights about transactions.

#### Query Parameters
- `period` (string): Analysis period
  - `current_month` (default)
  - `last_30_days`
  - `current_year`
  - `last_year`
  - `custom` (requires date_from and date_to)
- `account_id` (string): Filter by specific account
- `date_from` (string): Custom period start (ISO format)
- `date_to` (string): Custom period end (ISO format)

#### Example Request
```
GET /transactions/summary?period=current_month&account_id=acc_test123
```

#### Response (200 OK)
```json
{
  "period": "2024-01",
  "total_income": 15000.00,
  "total_expenses": 8750.50,
  "net_amount": 6249.50,
  "transaction_count": 87,
  "income_by_category": {
    "salary": 12000.00,
    "freelance": 2000.00,
    "investment_gains": 1000.00
  },
  "expenses_by_category": {
    "groceries": 2500.00,
    "transportation": 1200.00,
    "restaurants": 800.00,
    "utilities": 1500.00,
    "entertainment": 600.00
  },
  "activity_by_account": {
    "acc_checking123": {
      "account_name": "BBVA Cuenta de Cheques",
      "total_income": 10000.00,
      "total_expenses": 6000.00,
      "net_amount": 4000.00,
      "transaction_count": 45
    }
  },
  "top_expense_categories": [
    {"category": "groceries", "amount": 2500.00},
    {"category": "utilities", "amount": 1500.00},
    {"category": "transportation", "amount": 1200.00}
  ],
  "top_income_categories": [
    {"category": "salary", "amount": 12000.00},
    {"category": "freelance", "amount": 2000.00}
  ]
}
```

## Transaction Types

### Income Types
- `income`: General income
- `salary`: Salary payment
- `freelance`: Freelance work
- `business_income`: Business revenue
- `investment`: Investment gains
- `dividend`: Dividend received
- `bonus`: Bonus payment
- `refund`: Refunds received
- `interest`: Interest earned
- `other`: Other income

### Expense Types
- `expense`: General expense
- `fee`: Service fees
- `other`: Other expenses

### Special Types
- `transfer`: Transfer between accounts
- `investment`: Investment transaction

## Transaction Categories (Mexican Context)

### Income Categories
- `salary`: Salario
- `freelance`: Trabajo independiente
- `business_income`: Ingresos de negocio
- `investment_gains`: Ganancias de inversión
- `rental_income`: Ingresos por renta
- `gifts_received`: Regalos recibidos
- `refunds`: Reembolsos
- `other_income`: Otros ingresos

### Expense Categories
- `food_drinks`: Comida y bebidas
- `transportation`: Transporte
- `shopping`: Compras
- `entertainment`: Entretenimiento
- `bills_utilities`: Servicios y facturas
- `healthcare`: Salud
- `education`: Educación
- `travel`: Viajes
- `insurance`: Seguros
- `taxes`: Impuestos
- `rent_mortgage`: Renta/Hipoteca
- `groceries`: Supermercado
- `restaurants`: Restaurantes
- `gas_fuel`: Gasolina
- `clothing`: Ropa
- `electronics`: Electrónicos
- `subscriptions`: Suscripciones
- `gifts_donations`: Regalos y donaciones
- `bank_fees`: Comisiones bancarias
- `other_expenses`: Otros gastos

### Transfer Categories
- `account_transfer`: Transferencia entre cuentas
- `investment`: Inversión
- `savings`: Ahorros
- `debt_payment`: Pago de deudas
- `other_transfer`: Otras transferencias

## Business Logic

### Balance Calculation
The system automatically calculates account balances based on transaction types:

- **Income transactions**: Add to account balance
  - `income`, `salary`, `refund`, `dividend`, `bonus`, `interest`
- **Expense transactions**: Subtract from account balance
  - `expense`, `fee`
- **Transfer transactions**: 
  - Subtract from source account
  - Add to destination account (creates matching income transaction)

### Transfer Handling
When creating a transfer transaction:
1. Creates outgoing transaction in source account (negative amount)
2. Updates source account balance (decreases)
3. Creates incoming transaction in destination account (positive amount)
4. Updates destination account balance (increases)
5. Both transactions reference each other for audit trail

### Data Validation
- Amount cannot be zero
- Description is required and normalized (removes extra spaces)
- Maximum 10 tags per transaction, 30 characters per tag
- ISO date format validation
- Account ownership verification
- Active account validation

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "Transaction amount cannot be zero"
}
```

#### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

#### 404 Not Found
```json
{
  "error": "Account not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Authentication

All endpoints require JWT authentication:
```
Authorization: Bearer <jwt_token>
```

## Rate Limiting

- **Create/Update/Delete**: 100 requests per minute
- **Read operations**: 1000 requests per minute

## Database Design

Uses DynamoDB Single Table Design for optimal performance:

### Primary Key Structure
- **pk**: `USER#{user_id}`
- **sk**: `TRANSACTION#{transaction_id}`

### GSI1 (Account Index)
- **gsi1_pk**: `ACCOUNT#{account_id}`
- **gsi1_sk**: `TRANSACTION#{transaction_date}#{transaction_id}`

This design enables:
- Efficient user transaction queries
- Fast account-specific transaction retrieval
- Date-range queries with automatic sorting
- Data isolation between users

## Testing

Comprehensive test coverage includes:
- ✅ **44+ unit tests** for models, handlers, and database operations
- ✅ **Validation testing** for all Pydantic models
- ✅ **Integration testing** for complete workflows
- ✅ **Error scenario testing** for edge cases
- ✅ **Performance testing** for large datasets

### Run Tests
```bash
cd backend
python -m pytest tests/test_transaction* -v
```

## Mexican Market Considerations

- **Currency**: Default MXN (Mexican Peso)
- **Categories**: Localized for Mexican spending patterns
- **Banking**: Compatible with major Mexican banks (BBVA, Banamex, Santander, etc.)
- **Language**: Categories and types in Spanish context
- **Regulations**: Designed for Mexican financial practices

## Performance Optimization

- **Single Table Design**: Minimizes DynamoDB costs and latency
- **GSI Utilization**: Efficient account-based queries
- **Pagination**: Handles large transaction volumes
- **Decimal Precision**: Accurate financial calculations
- **Batch Processing**: Optimized for high-volume operations

## Security Features

- **JWT Authentication**: Secure token-based access
- **Data Isolation**: User-specific data access patterns
- **Input Validation**: Comprehensive Pydantic validation
- **SQL Injection Protection**: NoSQL design eliminates risk
- **Account Verification**: Ownership validation for all operations

## Future Enhancements

- 🔄 **Recurring Transactions**: Automated scheduled transactions
- 📱 **Receipt OCR**: Image-based transaction creation
- 🏷️ **Smart Categorization**: AI-powered category suggestions
- 📊 **Advanced Analytics**: Machine learning insights
- 🔔 **Budget Alerts**: Spending limit notifications
- 💱 **Multi-Currency**: Enhanced currency conversion
- 🧾 **Receipt Storage**: Digital receipt management

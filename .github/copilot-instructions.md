# Finance Tracker Serverless - AI Coding Instructions

## Architecture Overview

This is a **production-ready serverless finance tracker** built for the Mexican market with AWS Lambda, DynamoDB, React, and Terraform. The system uses **Single Table Design** in DynamoDB and follows strict serverless patterns.

**Live URLs:**
- Frontend: https://finance-tracker.brxvn.xyz
- API: https://sjlc3gosfe.execute-api.mx-central-1.amazonaws.com/dev

## Key Architecture Patterns

### Backend: Single Handler per Domain + JWT Middleware
- Each Lambda function handles **one domain** (auth, users, accounts) with multiple HTTP methods
- JWT auth via `@require_auth` decorator in `utils/jwt_auth.py`
- All handlers use the pattern: `lambda_handler(event, context)` → route by `path` and `httpMethod`

```python
# Handler pattern in backend/src/handlers/
def lambda_handler(event, context):
    path = event.get('path', '')
    method = event.get('httpMethod', '')
    # Route to specific function based on path/method
```

### Database: DynamoDB Single Table Design
- **One table** (`finance-tracker-dev-main`) for all entities
- Access patterns in `backend/src/utils/dynamodb_client.py`:
  - Users: `pk=USER#{user_id}`, `sk=METADATA`
  - Accounts: `pk=USER#{user_id}`, `sk=ACCOUNT#{account_id}`
  - GSI1 for email lookups: `gsi1_pk=EMAIL#{email}`

### Frontend: Context + Service Layer + React Query
- JWT tokens managed in `AuthContext` (`frontend/src/context/`)
- API calls via service layer (`frontend/src/services/`) with automatic token refresh
- Material-UI components with TypeScript interfaces in `frontend/src/types/`

## Development Workflows

### Backend Testing
```bash
cd backend
python -m pytest tests/ -v                    # All tests (44 tests)
python -m pytest tests/test_auth.py -v        # Auth tests only
python -m pytest tests/test_accounts.py -v    # Accounts tests only
```

### Frontend Development  
```bash
cd frontend
npm start                                      # Local dev server
npm test                                       # Run tests
npm run build                                  # Production build
```

### Infrastructure Deployment
```bash
cd terraform/environments/dev
terraform plan -var-file="terraform.tfvars"   # Plan infrastructure
terraform apply                               # Deploy backend
```

## Critical Conventions

### Error Handling Pattern
All backend handlers use `utils/responses.py`:
```python
from utils.responses import create_response, internal_server_error_response
return create_response(200, {"message": "Success"})  # Always use this
```

### JWT Authentication
- Access tokens expire in 30 minutes, refresh tokens in 7 days
- Frontend automatically refreshes via `ApiClient.makeAuthenticatedRequest()`
- Backend validates with `@require_auth` decorator

### Pydantic Models
All data validation via Pydantic v2 models in `backend/src/models/`:
- `UserCreate`, `UserLogin` for auth operations
- `AccountCreate`, `AccountUpdate` for account operations
- Models include Mexican banking validation (BBVA, Banamex, etc.)

### Mexican Localization
- Default currency: MXN (Mexican Peso)
- Bank codes in `backend/src/models/account.py` for Mexican institutions
- UI text in Spanish (`frontend/src/` components)

## Integration Points

### API Gateway Routes
6 Lambda functions mapped to REST endpoints:
- `/health` → health handler (public)
- `/auth/*` → auth handler (register, login, refresh)
- `/users/*` → users handler (CRUD operations)  
- `/accounts/*` → accounts handler (bank account management)

### CI/CD Automation
- **Frontend**: Auto-deploys on pushes to `main` via GitHub Actions → S3 + Cloudflare
- **Backend**: Manual Terraform deployment with release tagging
- **Tests**: All PRs run full test suite (backend + frontend)

### Environment Configuration
- Backend config in `backend/src/utils/config.py`
- Frontend API URLs in `frontend/src/config/api.ts` with dev/prod switching
- Infrastructure variables in `terraform/environments/{dev,prod}/terraform.tfvars`

When working on this codebase:
- Always run backend tests before making changes to handlers
- Use the existing Pydantic models for validation - don't create raw dictionaries
- Follow the Single Table Design patterns in DynamoDBClient
- Keep Mexican banking context (currency=MXN, Spanish UI, local bank codes)
- JWT tokens are the only authentication method - no sessions or cookies

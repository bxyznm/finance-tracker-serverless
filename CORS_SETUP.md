# CORS Configuration and Setup

This document explains the CORS (Cross-Origin Resource Sharing) configuration for the Finance Tracker application and how to resolve common issues.

## Problem Description

The application was experiencing CORS errors when trying to access the API from `localhost:3000` during development:

```
Access to XMLHttpRequest at 'https://jjb0khkiz0.execute-api.mx-central-1.amazonaws.com/dev/accounts' 
from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request 
doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause

The backend API Gateway CORS configuration was not properly allowing localhost origins for development, even though it was configured to allow `"*"`.

## Solutions Implemented

### 1. Frontend Proxy Configuration

**File**: `frontend/package.json`
```json
{
  "proxy": "https://jjb0khkiz0.execute-api.mx-central-1.amazonaws.com"
}
```

This configures Create React App's development server to proxy API requests, avoiding CORS issues entirely during development.

### 2. Environment-Aware API Configuration

**File**: `frontend/src/config/api.ts`
```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

export const getApiBaseUrl = (): string => {
  if (isDevelopment) {
    return '/dev';  // Use proxy in development
  }
  return 'https://jjb0khkiz0.execute-api.mx-central-1.amazonaws.com/dev';  // Full URL in production
};
```

### 3. Backend CORS Configuration Update

**File**: `terraform/environments/dev/terraform.tfvars`
```hcl
cors_allowed_origins = [
  "*",
  "http://localhost:3000",
  "https://localhost:3000", 
  "https://finance-tracker.brxvn.xyz",
  "https://financetracker.brxvn.xyz"
]
```

### 4. Manifest File Fix

**File**: `frontend/public/manifest.json`

Removed references to non-existent logo files (`logo192.png`, `logo512.png`) that were causing browser errors.

## How It Works

### Development Environment
1. React development server starts on `http://localhost:3000`
2. API requests are made to relative URLs like `/dev/accounts`
3. The proxy configuration forwards these to the AWS API Gateway
4. No CORS issues because the request appears to come from the same origin

### Production Environment
1. Frontend is served from `https://finance-tracker.brxvn.xyz`
2. API requests are made directly to AWS API Gateway
3. CORS headers allow the production domain

## Testing the Fix

### Local Development
```bash
cd frontend
npm start
```

The application should now work without CORS errors when accessing accounts and user profile pages.

### Production
The production build continues to work with direct API calls to AWS API Gateway.

## Troubleshooting

### If CORS errors persist in development:

1. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
2. **Restart development server**: Stop and start `npm start`
3. **Check proxy configuration**: Ensure `package.json` has the correct proxy URL

### If backend redeployment is needed:

```bash
cd terraform/environments/dev
terraform plan
terraform apply
```

This will update the CORS configuration on the AWS API Gateway.

### For production deployment:

Update `terraform/environments/prod/terraform.tfvars` with appropriate CORS origins for production:

```hcl
cors_allowed_origins = [
  "https://finance-tracker.brxvn.xyz",
  "https://financetracker.brxvn.xyz"
]
```

## Additional Notes

- The proxy solution only works in development with `npm start`
- Production builds (`npm run build`) will use the full API URLs
- CORS configuration in the backend is still important for production
- Consider using environment variables for API URLs in more complex setups

## Files Modified

1. `frontend/package.json` - Added proxy configuration
2. `frontend/src/config/api.ts` - New API configuration file
3. `frontend/src/services/authService.ts` - Updated to use new config
4. `frontend/public/manifest.json` - Fixed manifest errors
5. `terraform/environments/dev/terraform.tfvars` - Updated CORS origins

## Status

✅ **Fixed**: CORS errors in development environment  
✅ **Fixed**: Manifest errors  
🔄 **Pending**: Backend redeployment for production CORS (optional)  

The application should now work correctly in both development and production environments.

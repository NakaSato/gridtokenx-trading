# GridTokenX Authentication API Endpoints

Complete reference for all authentication-related API endpoints in the API Gateway.

---

## 🔓 Public Authentication Endpoints (No Auth Required)

### 1. **Login**
**Path:** `POST /api/auth/login`

**Description:** Standard username/password login

**Request Body:**
```typescript
{
  username: string;      // min: 3, max: 50 chars
  password: string;      // min: 8, max: 128 chars
}
```

**Response:** `200 OK`
```typescript
{
  access_token: string;
  token_type: "Bearer";
  expires_in: number;    // seconds (86400 = 24 hours)
  user: {
    username: string;
    email: string;
    role: string;
    blockchain_registered: boolean;
  }
}
```

**Errors:**
- `400` - Validation error
- `401` - Invalid credentials
- `403` - Email not verified

**Example:**
```typescript
import { createApiClient } from '@/lib/api-client';

const client = createApiClient();
const response = await client.login('john_doe', 'SecurePassword123!');
```

---

### 2. **Register**
**Path:** `POST /api/auth/register`

**Description:** Create a new user account

**Request Body:**
```typescript
{
  username: string;      // min: 3, max: 50 chars
  email: string;         // valid email format
  password: string;      // min: 8, max: 128 chars
  role: string;          // e.g., "user", "producer"
  first_name: string;    // min: 1, max: 100 chars
  last_name: string;     // min: 1, max: 100 chars
  wallet_address?: string; // optional, 32-44 chars
}
```

**Response:** `201 Created`
```typescript
{
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  user: {
    username: string;
    email: string;
    role: string;
    blockchain_registered: boolean;
  }
}
```

**Errors:**
- `400` - Validation error or user already exists
- `500` - Internal server error

**Example:**
```typescript
const response = await fetch(getApiUrl('/api/auth/register'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'jane_doe',
    email: 'jane@example.com',
    password: 'SecurePass456!',
    role: 'user',
    first_name: 'Jane',
    last_name: 'Doe'
  })
});
```

---

### 3. **Verify Email**
**Path:** `GET /api/auth/verify-email?token={token}`

**Description:** Verify user's email address using verification token

**Query Parameters:**
```typescript
{
  token: string;  // Email verification token (Base58 encoded)
}
```

**Response:** `200 OK`
```typescript
{
  message: string;
  email_verified: boolean;
  verified_at: string;   // ISO 8601 timestamp
  auth?: {               // Optional: if auto_login enabled
    access_token: string;
    token_type: "Bearer";
    expires_in: number;
    user: {
      username: string;
      email: string;
      role: string;
      blockchain_registered: boolean;
    }
  }
}
```

**Errors:**
- `400` - Invalid or expired token
- `410` - Token expired

**Example:**
```typescript
const token = 'ABC123XYZ...'; // From email link
const response = await fetch(
  getApiUrl(`/api/auth/verify-email?token=${token}`)
);
```

---

### 4. **Resend Verification Email**
**Path:** `POST /api/auth/resend-verification`

**Description:** Request a new verification email

**Request Body:**
```typescript
{
  email: string;  // User's email address
}
```

**Response:** `200 OK`
```typescript
{
  message: string;
  email: string;
  sent_at: string;        // ISO 8601 timestamp
  expires_in_hours: number;
}
```

**Errors:**
- `400` - Invalid email or already verified
- `404` - User not found
- `429` - Too many requests (rate limit: 1 per 5 minutes)

**Example:**
```typescript
const response = await fetch(getApiUrl('/api/auth/resend-verification'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'jane@example.com' })
});
```

---

### 5. **Login with Wallet**
**Path:** `POST /api/auth/wallet/login`

**Description:** Login and retrieve wallet information

**Request Body:**
```typescript
{
  username: string;
  password: string;
}
```

**Response:** `200 OK`
```typescript
{
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  user: {
    username: string;
    email: string;
    role: string;
    blockchain_registered: boolean;
  };
  wallet_info?: {
    address: string;
    balance_lamports?: number;
    balance_sol?: number;
  }
}
```

**Errors:**
- `400` - Validation error
- `401` - Invalid credentials or inactive account
- `500` - Internal server error

---

### 6. **Register with Wallet**
**Path:** `POST /api/auth/wallet/register`

**Description:** Create account with automatic wallet creation

**Request Body:**
```typescript
{
  username: string;
  email: string;
  password: string;
  role: string;
  first_name: string;
  last_name: string;
  create_wallet?: boolean;      // Auto-create Solana wallet
  airdrop_amount?: number;      // DEV ONLY: SOL to airdrop
  wallet_address?: string;      // Or provide existing wallet
}
```

**Response:** `200 OK`
```typescript
{
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  user: {
    username: string;
    email: string;
    role: string;
    blockchain_registered: boolean;
  };
  wallet_info?: {
    address: string;
    balance_lamports: number;
    balance_sol: number;
    private_key: string;        // DEV ONLY: DO NOT USE IN PROD
    airdrop_signature?: string;
    created_new: boolean;
  }
}
```

**Errors:**
- `400` - Invalid data or user already exists
- `500` - Wallet creation failed

**Example:**
```typescript
const response = await fetch(getApiUrl('/api/auth/wallet/register'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'producer1',
    email: 'producer@example.com',
    password: 'SecurePass789!',
    role: 'producer',
    first_name: 'Solar',
    last_name: 'Producer',
    create_wallet: true,
    airdrop_amount: 2.0
  })
});
```

---

## 🔒 Protected Authentication Endpoints (Requires Bearer Token)

### 7. **Get User Profile**
**Path:** `GET /api/auth/profile`

**Headers:**
```typescript
Authorization: Bearer {access_token}
```

**Response:** `200 OK`
```typescript
{
  id: string;           // UUID
  username: string;
  email: string;
  role: string;
  wallet_address?: string;
  blockchain_registered: boolean;
}
```

**Errors:**
- `401` - Unauthorized (invalid/expired token)
- `404` - User not found

**Example:**
```typescript
import { useUserProfile } from '@/hooks/useApi';

function ProfileComponent() {
  const { profile, loading, error } = useUserProfile(token);
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  
  return <div>{profile.username}</div>;
}
```

---

### 8. **Update User Profile**
**Path:** `POST /api/auth/profile/update`

**Headers:**
```typescript
Authorization: Bearer {access_token}
```

**Request Body:**
```typescript
{
  email?: string;           // Valid email
  first_name?: string;      // 1-100 chars
  last_name?: string;       // 1-100 chars
  wallet_address?: string;  // 32-44 chars
}
```

**Response:** `200 OK`
```typescript
{
  id: string;
  username: string;
  email: string;
  role: string;
  wallet_address?: string;
  blockchain_registered: boolean;
}
```

**Errors:**
- `400` - Validation error or no fields to update
- `401` - Unauthorized
- `404` - User not found

**Example:**
```typescript
const response = await fetch(getApiUrl('/api/auth/profile/update'), {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    first_name: 'John',
    wallet_address: '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP8'
  })
});
```

---

### 9. **Change Password**
**Path:** `POST /api/auth/password`

**Headers:**
```typescript
Authorization: Bearer {access_token}
```

**Request Body:**
```typescript
{
  current_password: string;  // min: 8, max: 128
  new_password: string;      // min: 8, max: 128
}
```

**Response:** `204 No Content`

**Errors:**
- `400` - Validation error or incorrect current password
- `401` - Unauthorized
- `404` - User not found

**Example:**
```typescript
const response = await fetch(getApiUrl('/api/auth/password'), {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    current_password: 'OldPassword123!',
    new_password: 'NewSecurePassword456!'
  })
});

if (response.status === 204) {
  console.log('Password changed successfully');
}
```

---

## 🔐 Admin-Only User Management Endpoints

### 10. **Get User by ID**
**Path:** `GET /api/users/{id}`

**Headers:**
```typescript
Authorization: Bearer {admin_token}
```

**Path Parameters:**
```typescript
{
  id: string;  // UUID
}
```

**Response:** `200 OK`
```typescript
{
  id: string;
  username: string;
  email: string;
  role: string;
  wallet_address?: string;
  blockchain_registered: boolean;
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (admin access required)
- `404` - User not found

---

### 11. **List Users (with search & pagination)**
**Path:** `GET /api/users`

**Headers:**
```typescript
Authorization: Bearer {admin_token}
```

**Query Parameters:**
```typescript
{
  search?: string;        // Search username, email, first/last name
  role?: string;          // Filter by role
  page?: number;          // Page number (default: 1)
  page_size?: number;     // Items per page (default: 20, max: 100)
  sort_by?: string;       // "created_at" | "username" | "email" | "role"
  sort_order?: string;    // "asc" | "desc" (default: "desc")
}
```

**Response:** `200 OK`
```typescript
{
  data: Array<{
    id: string;
    username: string;
    email: string;
    role: string;
    wallet_address?: string;
    blockchain_registered: boolean;
  }>;
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_more: boolean;
  }
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (admin/faculty access required)

**Example:**
```typescript
// Search for users with "john" in name, page 2, 50 items
const params = new URLSearchParams({
  search: 'john',
  page: '2',
  page_size: '50',
  sort_by: 'created_at',
  sort_order: 'desc'
});

const response = await fetch(
  getApiUrl(`/api/users?${params.toString()}`),
  {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }
);
```

---

## 🔧 User Wallet Management

### 12. **Update Wallet Address**
**Path:** `POST /api/user/wallet`

**Headers:**
```typescript
Authorization: Bearer {access_token}
```

**Request Body:**
```typescript
{
  wallet_address: string;  // Solana wallet address (32-44 chars)
}
```

**Response:** `200 OK`

---

### 13. **Remove Wallet Address**
**Path:** `DELETE /api/user/wallet`

**Headers:**
```typescript
Authorization: Bearer {access_token}
```

**Response:** `204 No Content`

---

### 14. **Get User Activity**
**Path:** `GET /api/user/activity`

**Headers:**
```typescript
Authorization: Bearer {access_token}
```

**Query Parameters:**
```typescript
{
  limit?: number;
  offset?: number;
}
```

**Response:** `200 OK`
```typescript
{
  activities: Array<{
    id: string;
    user_id: string;
    activity_type: string;
    timestamp: string;
    details: object;
  }>
}
```

---

## 📝 Authentication Flow Examples

### Basic Login Flow
```typescript
import { useAuth } from '@/hooks/useApi';

function LoginForm() {
  const { login, isAuthenticated, token } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(email, password);
      // Token automatically saved to localStorage
      console.log('Logged in:', response);
    } catch (error) {
      console.error('Login failed:', error.message);
    }
  };
  
  return isAuthenticated ? <Dashboard /> : <form onSubmit={handleSubmit}>...</form>;
}
```

### Registration with Wallet Creation
```typescript
const response = await fetch(getApiUrl('/api/auth/wallet/register'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'energy_trader',
    email: 'trader@example.com',
    password: 'SecurePass123!',
    role: 'user',
    first_name: 'Energy',
    last_name: 'Trader',
    create_wallet: true,
    airdrop_amount: 5.0  // Development only
  })
});

const data = await response.json();
// Save token
localStorage.setItem('auth_token', data.access_token);
// Save wallet info (dev only)
console.log('Wallet address:', data.wallet_info.address);
console.log('Private key:', data.wallet_info.private_key);
```

### Email Verification Flow
```typescript
// 1. User registers
await fetch(getApiUrl('/api/auth/register'), { /* ... */ });

// 2. User receives email with verification link
// Link format: https://app.gridtokenx.com/verify?token=ABC123XYZ

// 3. Frontend calls verification endpoint
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

const response = await fetch(
  getApiUrl(`/api/auth/verify-email?token=${token}`)
);

const data = await response.json();
if (data.auth) {
  // Auto-login enabled - save token
  localStorage.setItem('auth_token', data.auth.access_token);
}
```

---

## 🔑 Authentication Headers

All protected endpoints require the JWT token in the Authorization header:

```typescript
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Management
```typescript
// Store token after login
localStorage.setItem('auth_token', response.data.access_token);

// Retrieve token for API calls
const token = localStorage.getItem('auth_token');

// Use with API client
const client = createApiClient(token);

// Clear token on logout
localStorage.removeItem('auth_token');
```

---

## ⚠️ Error Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `204` | No Content (success, no body) |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (invalid/expired token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Not Found |
| `410` | Gone (expired token) |
| `429` | Too Many Requests (rate limited) |
| `500` | Internal Server Error |

---

## 🧪 Testing

### Example Test with Native Fetch
```typescript
describe('Authentication API', () => {
  it('should login successfully', async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'test_user',
        password: 'TestPassword123!'
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.access_token).toBeDefined();
    expect(data.user.username).toBe('test_user');
  });
});
```

---

## 📚 Related Documentation

- [API Integration Guide](./API_INTEGRATION.md)
- [Configuration Guide](./lib/config.ts)
- [API Client Usage](./lib/api-client.ts)
- [React Hooks](./hooks/useApi.ts)

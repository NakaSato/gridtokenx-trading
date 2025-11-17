# GridTokenX Frontend API Integration

This document explains how the frontend uses environment variables to connect to the API Gateway backend.

## Environment Configuration

All API and service URLs are configured through environment variables in the `.env` file at the root of the `gridtokenx-trading` directory.

### Environment Variables

```bash
# Solana Network Configuration
NEXT_PUBLIC_SOLANA_NETWORK=localnet
NEXT_PUBLIC_SOLANA_RPC_URL=http://localhost:8899
NEXT_PUBLIC_SOLANA_WS_URL=ws://localhost:8900

# API Gateway Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8080

# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_SHOW_DEV_TOOLS=true
```

### Environment Setup for Different Environments

#### Local Development
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8080
```

#### Staging
```bash
NEXT_PUBLIC_API_BASE_URL=https://api-staging.gridtokenx.com
NEXT_PUBLIC_WS_BASE_URL=wss://api-staging.gridtokenx.com
```

#### Production
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.gridtokenx.com
NEXT_PUBLIC_WS_BASE_URL=wss://api.gridtokenx.com
```

## Configuration Files

### `lib/config.ts`
Centralized configuration that reads from environment variables and exports typed constants.

```typescript
import { API_CONFIG, SOLANA_CONFIG, API_ENDPOINTS } from '@/lib/config';

// Access API base URL
console.log(API_CONFIG.baseUrl); // http://localhost:8080

// Access specific endpoints
console.log(API_ENDPOINTS.trading.orders); // http://localhost:8080/api/orders
```

## API Client Usage

### Basic Usage

```typescript
import { createApiClient } from '@/lib/api-client';

const client = createApiClient();

// Login
const response = await client.login('user@example.com', 'password');
if (response.error) {
  console.error(response.error);
} else {
  console.log('Token:', response.data.token);
}
```

### With Authentication Token

```typescript
import { createApiClient } from '@/lib/api-client';

const token = 'your_jwt_token';
const client = createApiClient(token);

// Create order
const orderResponse = await client.createOrder({
  energy_amount: '100',
  price_per_kwh: '0.15',
});
```

### Using React Hooks

```typescript
'use client';

import { useAuth, useOrderBook, useCreateOrder } from '@/hooks/useApi';

function TradingComponent() {
  const { token, login, logout, isAuthenticated } = useAuth();
  const { orderBook, loading, error } = useOrderBook(token);
  const { createOrder, loading: creating } = useCreateOrder(token);

  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleCreateOrder = async () => {
    const result = await createOrder({
      energy_amount: '100',
      price_per_kwh: '0.15',
    });
    if (result) {
      console.log('Order created:', result);
    }
  };

  if (!isAuthenticated) {
    return <button onClick={handleLogin}>Login</button>;
  }

  return (
    <div>
      {loading ? (
        <p>Loading order book...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        <pre>{JSON.stringify(orderBook, null, 2)}</pre>
      )}
      <button onClick={handleCreateOrder} disabled={creating}>
        {creating ? 'Creating...' : 'Create Order'}
      </button>
    </div>
  );
}
```

## WebSocket Client Usage

### Basic WebSocket Connection

```typescript
import { createOrderBookWS } from '@/lib/websocket-client';

const token = 'your_jwt_token';
const ws = createOrderBookWS(token);

ws.on('orderbook_update', (message) => {
  console.log('Order book updated:', message.data);
});

ws.connect();

// Cleanup
ws.disconnect();
```

### Using React Hooks

```typescript
'use client';

import { useOrderBookWebSocket, useEpochWebSocket } from '@/hooks/useWebSocket';

function LiveTradingComponent() {
  const { orderBook, connected } = useOrderBookWebSocket(token);
  const { currentEpoch, lastTransition } = useEpochWebSocket(token);

  return (
    <div>
      <p>WebSocket Status: {connected ? 'Connected' : 'Disconnected'}</p>
      <p>Current Epoch: {currentEpoch?.id}</p>
      {orderBook && (
        <div>
          <h3>Order Book</h3>
          <pre>{JSON.stringify(orderBook, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

## API Endpoints

All endpoints automatically use the `NEXT_PUBLIC_API_BASE_URL` from environment variables.

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Trading
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/book` - Get current order book
- `GET /api/market` - Get market data
- `GET /api/trades` - Get recent trades

### User
- `GET /api/user/profile` - Get user profile
- `GET /api/user/balance` - Get user balance
- `GET /api/user/positions` - Get user positions

### Meters
- `POST /api/meters/submit` - Submit meter data
- `GET /api/meters/{meter_id}` - Get meter data

### WebSocket Channels
- `ws://localhost:8080/ws/orderbook` - Order book updates
- `ws://localhost:8080/ws/trades` - Trade updates
- `ws://localhost:8080/ws/epochs` - Epoch transitions

## Testing

### Integration Tests

The integration tests use the same environment-based configuration:

```typescript
import { createApiClient } from '@/lib/api-client';

describe('API Integration Tests', () => {
  it('should connect to API Gateway', async () => {
    const client = createApiClient();
    const response = await client.login('test@example.com', 'password');
    expect(response.error).toBeUndefined();
  });
});
```

## Best Practices

### 1. Always Use Environment Variables
Never hardcode URLs in your components or API calls:

```typescript
// ❌ BAD
const response = await fetch('http://localhost:8080/api/orders');

// ✅ GOOD
import { getApiUrl } from '@/lib/config';
const response = await fetch(getApiUrl('/api/orders'));

// ✅ BETTER - Use the API client
import { createApiClient } from '@/lib/api-client';
const client = createApiClient(token);
const response = await client.getOrders();
```

### 2. Use Native Fetch API
Always use native `fetch()` instead of axios in integration tests to avoid serialization issues:

```typescript
// ✅ CORRECT
const response = await fetch(`${API_BASE_URL}/api/orders`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(orderData),
});

// ❌ WRONG - Causes DataCloneError in vitest
import axios from 'axios';
const response = await axios.post(`${API_BASE_URL}/api/orders`, orderData);
```

### 3. Handle Errors Gracefully

```typescript
const { data, error, loading } = useOrderBook(token);

if (loading) return <Spinner />;
if (error) return <ErrorMessage message={error} />;
return <OrderBookDisplay data={data} />;
```

### 4. Clean Up WebSocket Connections

```typescript
useEffect(() => {
  const ws = createOrderBookWS(token);
  ws.connect();

  return () => {
    ws.disconnect(); // Always cleanup
  };
}, [token]);
```

## Troubleshooting

### API Connection Issues

1. **Check environment variables**:
   ```bash
   echo $NEXT_PUBLIC_API_BASE_URL
   ```

2. **Verify API Gateway is running**:
   ```bash
   curl http://localhost:8080/health
   ```

3. **Check CORS settings**: Ensure the API Gateway allows requests from your frontend origin.

### WebSocket Connection Issues

1. **Verify WebSocket URL**: Check that `NEXT_PUBLIC_WS_BASE_URL` uses the correct protocol (`ws://` or `wss://`).

2. **Check authentication**: Ensure the JWT token is valid and not expired.

3. **Monitor connection status**: Use the `connected` property from hooks to display connection status.

## Migration Guide

If you're updating existing code to use the new environment-based configuration:

1. Replace hardcoded URLs with environment variables
2. Use the `config.ts` file for centralized configuration
3. Update API calls to use the `api-client.ts` methods
4. Replace manual fetch calls with React hooks from `useApi.ts`
5. Update WebSocket connections to use `websocket-client.ts`

## Additional Resources

- [API Gateway Documentation](../../api-gateway/docs/README.md)
- [Testing Guide](../../tests/README.md)
- [Environment Setup](../../docs/technical/ENVIRONMENT_SETUP.md)

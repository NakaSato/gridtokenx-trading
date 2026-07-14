import { defaultApiClient, ApiClient } from '../api-client'
import type { LoginResponse, RegisterResponse, Role } from '../../types/auth'

// Mock fetch globally
global.fetch = jest.fn()

describe('ApiClient', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockClear()
  })

  // ... login ...

  describe('register', () => {
    it('sends correct registration request with all fields', async () => {
      const mockResponse: RegisterResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'newuser',
        email: 'new@example.com',
        status: 'pending_verification',
        message: 'User registered successfully',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () => JSON.stringify(mockResponse),
        json: async () => mockResponse,
      } as Response)

      const registerData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        role: 'prosumer' as Role,
        first_name: 'John',
        last_name: 'Doe',
        wallet_address: 'SomeWalletAddress123456789012345678',
      }

      const result = await defaultApiClient.register(registerData)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registerData),
        })
      )

      expect(result.status).toBe(201)
      expect(result.data).toEqual(mockResponse)
      expect(result.error).toBeUndefined()
    })

    it('sends registration request without optional wallet address', async () => {
      const mockResponse: RegisterResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'newuser',
        email: 'new@example.com',
        status: 'pending_verification',
        message: 'User registered successfully',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () => JSON.stringify(mockResponse),
        json: async () => mockResponse,
      } as Response)

      const registerData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        role: 'consumer' as Role,
        first_name: 'John',
        last_name: 'Doe',
      }

      const result = await defaultApiClient.register(registerData)

      expect(result.status).toBe(201)
      expect(result.data).toEqual(mockResponse)
    })

    it('handles 400 user already exists error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: 'User already exists' }),
        json: async () => ({ error: 'User already exists' }),
      } as Response)

      const registerData = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
        role: 'consumer' as Role,
        first_name: 'John',
        last_name: 'Doe',
      }

      const result = await defaultApiClient.register(registerData)

      expect(result.status).toBe(400)
      expect(result.error).toBe('User already exists')
      expect(result.data).toBeUndefined()
    })

    it('handles 400 validation error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ message: 'Invalid email format' }),
        json: async () => ({ message: 'Invalid email format' }),
      } as Response)

      const registerData = {
        username: 'newuser',
        email: 'invalid-email',
        password: 'password123',
        role: 'consumer' as Role,
        first_name: 'John',
        last_name: 'Doe',
      }

      const result = await defaultApiClient.register(registerData)

      expect(result.status).toBe(400)
      expect(result.error).toBe('Invalid email format')
    })

    it('handles 500 server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ error: 'Internal server error' }),
        json: async () => ({ error: 'Internal server error' }),
      } as Response)

      const registerData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        role: 'consumer' as Role,
        first_name: 'John',
        last_name: 'Doe',
      }

      const result = await defaultApiClient.register(registerData)

      expect(result.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })
  })

  describe('login error codes', () => {
    it('extracts the structured code from the IAM error envelope (AUTH_1005 email not verified)', async () => {
      const body = {
        error: {
          code: 'AUTH_1005',
          code_number: 1005,
          message: 'Email not verified',
        },
        request_id: 'req-1',
        timestamp: '2026-07-05T00:00:00Z',
      }
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify(body),
        json: async () => body,
      } as Response)

      const result = await defaultApiClient.login('pending-user', 'Correct-Pass-123!')

      expect(result.status).toBe(401)
      expect(result.code).toBe('AUTH_1005')
      expect(result.error).toBe('Email not verified')
      expect(result.data).toBeUndefined()
    })

    it('leaves code undefined for a plain string error body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ error: 'Invalid username or password' }),
        json: async () => ({ error: 'Invalid username or password' }),
      } as Response)

      const result = await defaultApiClient.login('someone', 'Wrong-Pass-123!')

      expect(result.status).toBe(401)
      expect(result.code).toBeUndefined()
      expect(result.error).toBe('Invalid username or password')
    })
  })

  describe('refreshToken', () => {
    it('POSTs to /api/v1/auth/refresh with the refresh token in the JSON body', async () => {
      const mockResponse = {
        access_token: 'fresh-token',
        expires_in: 86400,
        token_type: 'Bearer',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
        json: async () => mockResponse,
      } as Response)

      const client = new ApiClient('current-token')
      const result = await client.refreshToken('my-refresh-token')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/refresh'),
        expect.objectContaining({
          method: 'POST',
          // Backend reads the refresh token from the body (RefreshRequest), not
          // the Authorization header.
          body: JSON.stringify({ refresh_token: 'my-refresh-token' }),
        })
      )
      expect(result.status).toBe(200)
      expect(result.data).toEqual(mockResponse)
    })

    it('surfaces a 401 (expired token) without throwing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ error: 'token expired' }),
        json: async () => ({ error: 'token expired' }),
      } as Response)

      const client = new ApiClient('expired-token')
      const result = await client.refreshToken('expired-refresh-token')

      expect(result.status).toBe(401)
      expect(result.error).toBe('token expired')
      expect(result.data).toBeUndefined()
    })
  })

  describe('ApiClient instance', () => {
    it('can be created with a token', () => {
      const client = new ApiClient('test-token')
      expect(client).toBeInstanceOf(ApiClient)
    })

    it('can set and clear tokens', () => {
      const client = new ApiClient()

      client.setToken('new-token')
      // Token is set (internal state, not directly testable without making request)

      client.clearToken()
      // Token is cleared
    })

    it('includes authorization header when token is set', async () => {
      const client = new ApiClient('test-token')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({}),
        json: async () => ({}),
      } as Response)

      // Use an authenticated call that attaches the Bearer header to exercise
      // the header path (refresh sends the token in the body, not the header).
      await client.getProfile()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })
  })
})

import { defaultApiClient, ApiClient } from '../api-client'
import type { LoginResponse, RegisterResponse } from '../../types/auth'

// Mock fetch globally
global.fetch = jest.fn()

describe('ApiClient', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockClear()
  })

  describe('login', () => {
    it('sends correct login request', async () => {
      const mockResponse: LoginResponse = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          blockchain_registered: false,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
        json: async () => mockResponse,
      } as Response)

      const result = await defaultApiClient.login('testuser', 'password123')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'testuser',
            password: 'password123',
          }),
        })
      )

      expect(result.status).toBe(200)
      expect(result.data).toEqual(mockResponse)
      expect(result.error).toBeUndefined()
    })

    it('handles 401 unauthorized error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ error: 'Invalid credentials' }),
        json: async () => ({ error: 'Invalid credentials' }),
      } as Response)

      const result = await defaultApiClient.login('testuser', 'wrongpassword')

      expect(result.status).toBe(401)
      expect(result.error).toBe('Invalid credentials')
      expect(result.data).toBeUndefined()
    })

    it('handles 403 email not verified error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => JSON.stringify({ message: 'Email not verified' }),
        json: async () => ({ message: 'Email not verified' }),
      } as Response)

      const result = await defaultApiClient.login('testuser', 'password123')

      expect(result.status).toBe(403)
      expect(result.error).toBe('Email not verified')
    })

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await defaultApiClient.login('testuser', 'password123')

      expect(result.status).toBe(500)
      expect(result.error).toBe('Network error')
    })
  })

  describe('register', () => {
    it('sends correct registration request with all fields', async () => {
      const mockResponse: RegisterResponse = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          username: 'newuser',
          email: 'new@example.com',
          role: 'producer',
          blockchain_registered: false,
        },
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
        role: 'producer',
        first_name: 'John',
        last_name: 'Doe',
        wallet_address: 'SomeWalletAddress123456789012345678',
      }

      const result = await defaultApiClient.register(registerData)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
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
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          username: 'newuser',
          email: 'new@example.com',
          role: 'user',
          blockchain_registered: false,
        },
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
        role: 'user',
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
        role: 'user',
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
        role: 'user',
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
        role: 'user',
        first_name: 'John',
        last_name: 'Doe',
      }

      const result = await defaultApiClient.register(registerData)

      expect(result.status).toBe(500)
      expect(result.error).toBe('Internal server error')
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

      await client.logout()

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

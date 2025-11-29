import type {
  RegistrationRequest,
  RegistrationResponse,
  LoginRequest,
  LoginResponse,
} from '../../types/auth'

export async function register(
  data: RegistrationRequest
): Promise<RegistrationResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  const text = await res.text()
  let payload: any = {}
  try {
    payload = text ? JSON.parse(text) : {}
  } catch (err) {
    throw new Error(`Invalid JSON response from server: ${err}`)
  }

  if (!res.ok) {
    let message = payload?.message || res.statusText || 'Registration failed'

    // Handle 422 Unprocessable Entity with detailed validation info
    if (res.status === 422) {
      message =
        payload?.message ||
        'Validation error: Please check all required fields are filled correctly. Ensure username is 3-50 chars, password is 8+ chars, email is valid, and role is one of: user, producer, consumer, admin, ami.'
    }

    throw new Error(message)
  }

  return payload as RegistrationResponse
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  const text = await res.text()
  let payload: any = {}
  try {
    payload = text ? JSON.parse(text) : {}
  } catch (err) {
    throw new Error(`Invalid JSON response from server: ${err}`)
  }

  if (!res.ok) {
    let message = payload?.message || res.statusText || 'Login failed'

    // Handle specific error cases
    if (res.status === 401) {
      message = payload?.message || 'Invalid username or password'
    } else if (res.status === 403) {
      message =
        payload?.message ||
        'Email verification required. Please check your email.'
    } else if (res.status === 422) {
      message =
        payload?.message || 'Validation error: Please check your credentials.'
    }

    throw new Error(message)
  }

  return payload as LoginResponse
}

import { getApiUrl } from '../config'

export interface ApiRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    headers?: Record<string, string>
    body?: any
    token?: string
}

export interface ApiResponse<T = any> {
    data?: T
    error?: string
    /** Structured backend error code (e.g. IAM "AUTH_1005" = email not verified). */
    code?: string
    status: number
    /** Lowercased response headers (e.g. pagination metadata X-Total-Count / X-Has-More). */
    headers?: Record<string, string>
}

/** Error carrying the backend's structured code so callers can branch on it. */
export class ApiClientError extends Error {
    code?: string
    status?: number

    constructor(message: string, code?: string, status?: number) {
        super(message)
        this.name = 'ApiClientError'
        this.code = code
        this.status = status
    }
}

/**
 * Make an API request that returns a non-JSON body (e.g. CSV export).
 * Same auth/error conventions as apiRequest, but data is the raw text.
 */
export async function apiRequestText(
    path: string,
    options: ApiRequestOptions = {}
): Promise<ApiResponse<string>> {
    const { method = 'GET', headers = {}, token } = options

    const requestHeaders: Record<string, string> = { ...headers }
    if (token) {
        requestHeaders.Authorization = `Bearer ${token}`
    }

    try {
        const response = await fetch(getApiUrl(path), {
            method,
            headers: requestHeaders,
        })
        const text = await response.text()

        if (!response.ok) {
            return { error: text || 'Request failed', status: response.status }
        }
        return { data: text, status: response.status }
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 500,
        }
    }
}

/**
 * Make an API request using native fetch
 * @param path - API endpoint path (e.g., '/api/orders')
 * @param options - Request options
 */
export async function apiRequest<T = any>(
    path: string,
    options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
    const { method = 'GET', headers = {}, body, token } = options

    const url = getApiUrl(path)

    // Build headers
    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    }

    // Add authorization token if provided
    if (token) {
        requestHeaders.Authorization = `Bearer ${token}`
    }

    try {
        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
        })

        // Get the response text first
        const text = await response.text()

        // Try to parse JSON, but handle empty responses
        let data: any = {}
        if (text) {
            try {
                data = JSON.parse(text)
            } catch (parseError) {
                // If JSON parsing fails, return the text as error
                return {
                    error: `Invalid JSON response: ${text}`,
                    status: response.status,
                }
            }
        }

        if (!response.ok) {
            let errorMessage = 'Request failed'
            let errorCode: string | undefined
            if (data.message) {
                errorMessage = data.message
            } else if (data.error) {
                if (typeof data.error === 'string') {
                    errorMessage = data.error
                } else if (typeof data.error === 'object' && data.error.message) {
                    errorMessage = data.error.message
                } else {
                    errorMessage = JSON.stringify(data.error)
                }
            }
            // IAM error envelope: { error: { code: "AUTH_1005", message, ... } }
            if (typeof data.error === 'object' && typeof data.error?.code === 'string') {
                errorCode = data.error.code
            }

            return {
                error: errorMessage,
                code: errorCode,
                status: response.status,
            }
        }

        const responseHeaders: Record<string, string> = {}
        // `headers` is always present on a real fetch Response; guarded for
        // partial mocks in tests.
        response.headers?.forEach((value, key) => {
            responseHeaders[key] = value
        })

        return {
            data,
            status: response.status,
            headers: responseHeaders,
        }
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 500,
        }
    }
}

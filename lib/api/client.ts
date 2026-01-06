import { getAuthToken, getStoreSlug, clearAllAuth } from '../utils/storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://quickshop.co.il/api';

// ============ Error Classes ============
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// ============ API Client ============
interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, skipAuth = false, ...fetchOptions } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Platform': 'mobile',
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Add auth token if available and not skipped
  if (!skipAuth) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add store slug for store-specific requests
    const storeSlug = await getStoreSlug();
    if (storeSlug) {
      headers['X-Store-Slug'] = storeSlug;
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle auth errors
    if (response.status === 401) {
      await clearAllAuth();
      throw new AuthError('פג תוקף ההתחברות, נא להתחבר מחדש');
    }

    // Handle other errors
    if (!response.ok) {
      let errorMessage = 'שגיאה בבקשה לשרת';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Use default error message
      }
      throw new ApiError(response.status, errorMessage);
    }

    // Handle empty response
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError || error instanceof AuthError) {
      throw error;
    }
    
    // Network error
    throw new ApiError(0, 'אין חיבור לאינטרנט או שהשרת לא זמין');
  }
}

// ============ Convenience Methods ============
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};


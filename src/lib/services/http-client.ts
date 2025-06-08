/**
 * HTTP client for making API requests with consistent error handling
 */

interface RequestOptions extends RequestInit {
  /** Whether to include credentials in the request */
  withCredentials?: boolean;
  /** Custom headers */
  headers?: Record<string, string>;
}

class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Set default headers for all requests
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Make a GET request
   */
  async get<T>(url: string, fetchFn?: typeof globalThis.fetch = window.fetch, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, fetchFn, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T>(url: string, data?: unknown, fetchFn?: typeof globalThis.fetch = window.fetch, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, fetchFn, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a PUT request
   */
  async put<T>(url: string, data?: unknown, fetchFn?: typeof globalThis.fetch = window.fetch, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, fetchFn, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(url: string, fetchFn?: typeof globalThis.fetch = window.fetch, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(url, fetchFn, { ...options, method: 'DELETE' });
  }

  /**
   * Internal request method with error handling
   */
  private async request<T>(url: string, fetchFn?: typeof globalThis.fetch, options: RequestOptions = {}): Promise<T> {
    const headers = {
      ...this.defaultHeaders,
      ...(options.headers || {}),
    };

    try {
      const response = await fetchFn(`${this.baseUrl}${url}`, {
        ...options,
        headers,
        credentials: options.withCredentials ? 'include' : 'same-origin',
      });

      if (!response.ok) {
        const error = await this.parseError(response);
        throw error;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      return this.parseResponse<T>(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Parse JSON response
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const text = await response.text();
    if (!text) {
      throw new Error('No content in response');
    }
    return JSON.parse(text) as T;
  }

  /**
   * Parse error response
   */
  private async parseError(response: Response): Promise<Error> {
    try {
      const text = await response.text();
      const error = text ? JSON.parse(text) : { message: 'Unknown error occurred' };
      return new Error(error.message || 'Request failed');
    } catch (e) {
      return new Error(`Request failed with status ${response.status}`);
    }
  }
}

// Create a singleton instance
export const httpClient = new HttpClient();

/**
 * Helper function to create query parameters from an object
 */
export function createQueryParams(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }

  return searchParams.toString();
}

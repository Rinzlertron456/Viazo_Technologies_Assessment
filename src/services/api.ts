interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

class Api {
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token')
          ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
          : {}),
      },
    };

    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${path}`, config);
    const json: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new Error(json.message || 'Request failed');
    }

    return json;
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, body);
  }
}

const api = new Api('http://localhost:5000/api');

export default api;
export type { ApiResponse };
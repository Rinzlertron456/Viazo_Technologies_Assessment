const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }

  private async request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { body, params, headers: customHeaders, ...rest } = options;

    const url = this.buildUrl(path, params);

    const headers: Record<string, string> = {
      ...(customHeaders as Record<string, string>),
    };

    if (body && !(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      ...rest,
      headers,
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
      credentials: "include",
    });

    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        const retryResponse = await fetch(url, {
          ...rest,
          headers,
          body:
            body instanceof FormData
              ? body
              : body
                ? JSON.stringify(body)
                : undefined,
          credentials: "include",
        });
        return retryResponse.json();
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || "Something went wrong",
        response.status,
        data.errors,
      );
    }

    return data;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh-token`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  get<T>(path: string, params?: Record<string, string>) {
    return this.request<T>(path, { method: "GET", params });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "POST", body });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "PUT", body });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "PATCH", body });
  }

  delete<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "DELETE", body });
  }
}

export class ApiError extends Error {
  status: number;
  errors?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    status: number,
    errors?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.name = "ApiError";
  }
}

export const api = new ApiClient(API_BASE);

function sanitizeMessage(message: string): string {
  let msg = (message || "").toString().trim();
  if (!msg) return "";
  if (msg.includes("{") || msg.includes("}") || msg.includes("[")) {
    return "";
  }
  msg = msg.replace(/[\n\r]+/g, " ").replace(/\s{2,}/g, " ");
  if (msg.length > 200) msg = msg.slice(0, 200).trim() + "…";
  return msg;
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        return (
          sanitizeMessage(err.message) ||
          "Invalid request. Please check your input."
        );
      case 401:
        return "Invalid email or password.";
      case 403:
        return "You do not have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 409:
        return (
          sanitizeMessage(err.message) || "This record already exists."
        );
      case 422:
        return (
          sanitizeMessage(err.message) ||
          "Some of the information provided is invalid."
        );
      default:
        break;
    }
    if (err.status >= 500) {
      return "Something went wrong on our end. Please try again later.";
    }
    return (
      sanitizeMessage(err.message) ||
      "Something went wrong. Please try again."
    );
  }

  if (err instanceof TypeError) {
    return "Unable to reach the server. Please check your connection.";
  }
  if (err instanceof Error) {
    return (
      sanitizeMessage(err.message) ||
      "Something went wrong. Please try again."
    );
  }
  return "Something went wrong. Please try again.";
}

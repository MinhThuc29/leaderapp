import { ApiResponse } from '@leaderos/shared-types';
import { getSavedLanguage } from '@/lib/i18n';

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { params, headers, ...restOptions } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Language': getSavedLanguage(),
      ...headers,
    },
    credentials: 'include', // Chuẩn bị cho HttpOnly Cookie Session
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorBody) as Record<string, unknown>;
      if (typeof parsed['message'] === 'string') {
        errorMessage = parsed['message'];
      } else if (Array.isArray(parsed['message'])) {
        errorMessage = parsed['message'].join(', ');
      }
    } catch {
      // Giữ errorMessage mặc định nếu parse JSON thất bại
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<ApiResponse<T>>;
}

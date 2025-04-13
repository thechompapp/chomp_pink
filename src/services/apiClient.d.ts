declare module '@/services/apiClient' {
  interface ApiClientOptions {
    params?: Record<string, any>;
    body?: any;
    headers?: Record<string, string>;
  }

  interface ApiResponse<T> {
    data: T;
    status: number;
    statusText: string;
  }

  function apiClient<T = any>(
    endpoint: string,
    description?: string,
    options?: ApiClientOptions
  ): Promise<ApiResponse<T>>;

  export default apiClient;
} 
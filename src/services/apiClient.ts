/* src/services/apiClient.ts */
import useAuthStore from '@/stores/useAuthStore';
import { API_BASE_URL } from '@/config';

interface ApiClientOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
}

export interface ApiResponse<T = any> {
    data: T | null;
    message?: string;
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    success: boolean;
    error?: string;
}

const apiClient = async <T = any>(
    endpoint: string,
    errorContext = 'API Request',
    options: ApiClientOptions = {}
): Promise<ApiResponse<T>> => {
    const { method = 'GET', headers = {}, body, signal } = options;

    let token: string | null = null;
    try {
        token = useAuthStore.getState().token;
    } catch (storeError) {
        console.error(`[apiClient ${errorContext}] Error retrieving token from store:`, storeError);
    }

    const finalEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${finalEndpoint}`;

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
    };

    if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
        console.log(`[apiClient ${errorContext}] Request: ${method} ${url}`, {
            headers: requestHeaders,
            body: body ? '(Body Present)' : '(No Body)',
        });
    }

    try {
        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: method !== 'GET' && method !== 'HEAD' && body ? body : undefined,
            signal,
        });

        const responseText = await response.text();

        if (!response.ok) {
            let errorResponse: ApiResponse<T> = { data: null, success: false };
            let errorMsg = `HTTP error! Status: ${response.status}`;

            try {
                if (responseText) {
                    const parsedError = JSON.parse(responseText);
                    errorResponse = {
                        data: null,
                        success: false,
                        error: parsedError.error || parsedError.message || errorMsg,
                        message: parsedError.message,
                    };
                } else {
                    errorResponse.error = response.statusText || errorMsg;
                }
            } catch (e) {
                errorResponse.error = response.statusText || errorMsg;
            }

            console.error(`[apiClient ${errorContext}] Request failed: ${response.status} "${errorResponse.error}". URL: ${url}. Details:`, responseText);

            if (response.status === 401) {
                console.warn(`[apiClient ${errorContext}] Unauthorized (401). Triggering logout.`);
                try {
                    useAuthStore.getState().logout();
                } catch (logoutError) {
                    console.error(`[apiClient ${errorContext}] Error during logout after 401:`, logoutError);
                }
                errorResponse.error = 'Session expired. Please log in again.';
                const authError = new Error(errorResponse.error);
                authError.name = 'AuthError';
                (authError as any).status = 401;
                (authError as any).response = errorResponse;
                throw authError;
            }

            const httpError = new Error(errorResponse.error);
            (httpError as any).status = response.status;
            (httpError as any).response = errorResponse;
            throw httpError;
        }

        if (response.status === 204 || !responseText) {
            if (import.meta.env.DEV) {
                console.log(`[apiClient ${errorContext}] Success (Status: ${response.status}): ${url}`);
            }
            return { data: null, success: true } as ApiResponse<T>;
        }

        try {
            const jsonData = JSON.parse(responseText);
            const standardizedResponse: ApiResponse<T> = {
                data: jsonData.data ?? jsonData ?? null,
                success: jsonData.success !== false,
                message: jsonData.message || undefined,
                pagination: jsonData.pagination || undefined,
                error: jsonData.error || undefined,
            };

            if (import.meta.env.DEV) {
                console.log(`[apiClient ${errorContext}] Success Response (${response.status} - ${url}):`, standardizedResponse);
            }

            return standardizedResponse;
        } catch (parseError) {
            console.error(`[apiClient ${errorContext}] JSON parse error for success response (${response.status} - ${url}):`, responseText, parseError);
            const formatError = new Error('Invalid server response format.');
            formatError.name = 'ParseError';
            (formatError as any).status = 500;
            (formatError as any).response = { data: null, success: false, error: 'Invalid response format', details: responseText };
            throw formatError;
        }
    } catch (error: unknown) {
        console.error(`[apiClient ${errorContext}] FAILED:`, error);
        const fallbackResponse: ApiResponse<T> = {
            data: null,
            success: false,
            error: error instanceof Error ? error.message : 'Network or processing error',
        };
        if (error instanceof Error) {
            (error as any).response = fallbackResponse;
            throw error;
        }
        const genericError = new Error(`Network or processing error during ${errorContext}: ${String(error)}`);
        (genericError as any).response = fallbackResponse;
        throw genericError;
    }
};

export default apiClient;
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
    data?: T;
    message?: string;
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    success?: boolean;
    error?: string;
    [key: string]: any;
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
        console.log(`[apiClient ${errorContext}] Request: ${method} ${url}`, { headers: requestHeaders, body: body ? '(Body Present)' : '(No Body)' });
    }

    try {
        const response: Response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: method !== 'GET' && method !== 'HEAD' && body ? body : undefined,
            signal,
        });

        const responseText = await response.text();

        if (!response.ok) {
            let parsedError: ApiResponse<any> | null = null;
            let errorMsg = `HTTP error! Status: ${response.status}`;
            let errorDetails: any = responseText;

            try {
                if (responseText) {
                    parsedError = JSON.parse(responseText);
                    errorMsg = parsedError?.error || parsedError?.message || errorMsg;
                    errorDetails = parsedError;
                }
            } catch (e) {
                errorMsg = response.statusText || errorMsg;
            }

            console.error(`[apiClient ${errorContext}] Request failed: ${response.status} "${errorMsg}". URL: ${url}. Details:`, errorDetails);

            if (response.status === 401) {
                console.warn(`[apiClient ${errorContext}] Unauthorized (401). Triggering logout.`);
                try {
                    useAuthStore.getState().logout();
                } catch (logoutError) {
                    console.error(`[apiClient ${errorContext}] Error during logout after 401:`, logoutError);
                }
                const authError = new Error('Session expired. Please log in again.');
                (authError as any).status = 401;
                (authError as any).details = errorDetails;
                throw authError;
            }

            const httpError = new Error(errorMsg);
            (httpError as any).status = response.status;
            (httpError as any).details = errorDetails;
            throw httpError;
        }

        if (response.status === 204 || !responseText) {
            if (import.meta.env.DEV) {
                console.log(`[apiClient ${errorContext}] Success (Status: ${response.status}): ${url}`);
            }
            return { success: true } as ApiResponse<T>;
        }

        try {
            const jsonData: ApiResponse<T> = JSON.parse(responseText);
            if (import.meta.env.DEV) {
                console.log(`[apiClient ${errorContext}] Success Response (${response.status} - ${url}):`, jsonData);
            }
            if (jsonData.success === undefined && (jsonData.data || jsonData.message)) {
                jsonData.success = true;
            }
            return jsonData;
        } catch (parseError) {
            console.error(`[apiClient ${errorContext}] JSON parse error for success response (${response.status} - ${url}):`, responseText, parseError);
            const formatError = new Error('Invalid server response format.');
            (formatError as any).status = 500;
            (formatError as any).details = responseText;
            throw formatError;
        }

    } catch (error: unknown) {
        console.error(`[apiClient ${errorContext}] FAILED:`, error);
        if (error instanceof Error) {
            throw error;
        } else {
            throw new Error(`Network or processing error during ${errorContext}: ${String(error)}`);
        }
    }
};

export default apiClient;
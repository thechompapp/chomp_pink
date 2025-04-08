/* src/services/apiClient.ts */
import useAuthStore from '@/stores/useAuthStore'; // Use global alias
import { API_BASE_URL } from '@/config'; // Use global alias

// Define interface for API options
interface ApiClientOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
}

// Define a more flexible base ApiResponse structure
export interface ApiResponse<T = any> {
    // Standard success fields (optional)
    data?: T;
    message?: string;
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    success?: boolean; // Often used for non-GET mutations

    // Standard error field
    error?: string;

    // Allow other potential top-level keys from specific responses
    [key: string]: any;
}

// Define the apiClient function signature with generics
const apiClient = async <T = any>(
  endpoint: string,
  errorContext = 'API Request',
  options: ApiClientOptions = {}
): Promise<ApiResponse<T>> => { // Return the flexible ApiResponse structure
  const { method = 'GET', headers = {}, body, signal } = options;

  let token: string | null = null;
  try {
    // Use getState() for synchronous access within async function if needed,
    // but accessing directly is fine if store is initialized.
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

    // --- Enhanced Error Handling ---
    if (!response.ok) {
      let parsedError: ApiResponse<any> | null = null;
      let errorMsg = `HTTP error! Status: ${response.status}`;
      let errorDetails: any = responseText; // Default details to raw text

      try {
        if (responseText) { // Only parse if text exists
            parsedError = JSON.parse(responseText);
            // Use standard { error: "..." } field first from parsed JSON
            errorMsg = parsedError?.error || parsedError?.message || errorMsg;
            errorDetails = parsedError; // Keep parsed JSON as details
        }
      } catch (e) {
        // Response wasn't valid JSON, use raw text or status text
        errorMsg = response.statusText || errorMsg;
      }

      console.error(
        `[apiClient ${errorContext}] Request failed: ${response.status} "${errorMsg}". URL: ${url}. Details:`,
        errorDetails // Log potentially parsed error object or raw text
      );

      // Handle 401 Unauthorized - Trigger logout
      if (response.status === 401) {
        console.warn(`[apiClient ${errorContext}] Unauthorized (401). Triggering logout.`);
        // Ensure logout is called safely
        try {
           useAuthStore.getState().logout();
        } catch (logoutError) {
           console.error(`[apiClient ${errorContext}] Error during logout after 401:`, logoutError);
        }
        const authError = new Error('Session expired. Please log in again.');
        (authError as any).status = 401;
        (authError as any).details = errorDetails; // Attach details
        throw authError;
      }

      // Throw standard error object for other failures, attaching status and details
      const httpError = new Error(errorMsg);
      (httpError as any).status = response.status;
      (httpError as any).details = errorDetails;
      throw httpError;
    }

    // --- Enhanced Success Handling ---

    // Handle 204 No Content (often for DELETE) - Return explicit success structure
    if (response.status === 204 || !responseText) {
        if (import.meta.env.DEV) {
             console.log(`[apiClient ${errorContext}] Success (Status: ${response.status}): ${url}`);
        }
      // Return a structure indicating success, usable by mutations
      return { success: true } as ApiResponse<T>; // Ensure correct structure
    }

    // Parse successful JSON response
    try {
      const jsonData: ApiResponse<T> = JSON.parse(responseText);
      // Add dev logging for success
      if (import.meta.env.DEV) {
           console.log(`[apiClient ${errorContext}] Success Response (${response.status} - ${url}):`, jsonData);
      }
      // Ensure success flag if not present but looks like success (e.g., has data/message)
      // Backend should ideally always return consistent structure
       if (jsonData.success === undefined && (jsonData.data || jsonData.message)) {
           jsonData.success = true;
       }
      return jsonData; // Return the parsed JSON
    } catch (parseError) {
      console.error(`[apiClient ${errorContext}] JSON parse error for success response (${response.status} - ${url}):`, responseText, parseError);
      // If parsing fails on a 2xx response, it's a server format issue
      const formatError = new Error('Invalid server response format.');
      (formatError as any).status = 500; // Treat as server error
      (formatError as any).details = responseText;
      throw formatError;
    }

  } catch (error: unknown) { // Catch block handles network errors or thrown errors
    console.error(`[apiClient ${errorContext}] FAILED:`, error);

    // Re-throw the original error (ensure it's an Error object)
    if (error instanceof Error) {
         throw error;
     } else {
         // Create a new error for unknown types
         throw new Error(`Network or processing error during ${errorContext}: ${String(error)}`);
     }
  }
};

export default apiClient;
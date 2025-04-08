/* src/services/apiClient.ts */
import useAuthStore from '@/stores/useAuthStore'; // Use global alias
import { API_BASE_URL } from '@/config'; // Use global alias (now imports from .ts)

// Define interface for API options
interface ApiClientOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
    headers?: Record<string, string>;
    body?: string; // Assuming body is always stringified JSON for this client
    signal?: AbortSignal; // Add signal for AbortController support
}

// Define a generic type for the expected successful response structure from backend
// This attempts to cover common patterns, adjust if needed for specific endpoints.
export interface ApiResponse<T = any> {
    data?: T; // Primarily for GET requests returning single/list data
    error?: string; // Standard error field
    pagination?: { // For paginated GET requests
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    // Specific fields for other operations (add as needed)
    message?: string; // e.g., for POST/PUT success messages
    item?: any; // e.g., for list item add response
    success?: boolean; // e.g., for DELETE confirmation
    // Add other potential top-level keys if applicable
}


// Define the apiClient function signature with generics
const apiClient = async <T = any>( // Generic T for the expected data type within ApiResponse.data or other keys
  endpoint: string,
  errorContext = 'API Request',
  options: ApiClientOptions = {}
): Promise<ApiResponse<T>> => { // Return the full ApiResponse structure
  const { method = 'GET', headers = {}, body, signal } = options;

  let token: string | null = null;
  try {
    // Accessing store state outside components/hooks requires getState()
    token = useAuthStore.getState().token;
  } catch (storeError) {
    console.error(`[apiClient ${errorContext}] Error retrieving token:`, storeError);
    // Decide if this error should prevent the request or proceed without token
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
      signal, // Pass signal for cancellation
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMsg = `HTTP error! Status: ${response.status}`;
      let errorDetails: any = responseText; // Keep detailed response for debugging

      try {
        const errorJson: ApiResponse<any> = JSON.parse(responseText); // Use ApiResponse type
        // Prioritize standard { error: "..." } format
        errorMsg = errorJson.error || errorJson.message || (typeof errorJson === 'string' ? errorJson : errorMsg);
        errorDetails = errorJson; // Keep parsed JSON details
      } catch (e) {
        // If response is not JSON, use status text or default
        errorMsg = response.statusText || errorMsg;
      }

      console.error(
        `[apiClient ${errorContext}] Request failed: ${response.status} "${errorMsg}". URL: ${url}. Details:`,
        errorDetails // Log the details object/string
      );

      // Handle 401 Unauthorized - Trigger logout
      if (response.status === 401) {
        console.warn(`[apiClient ${errorContext}] Unauthorized (401). Triggering logout.`);
        // Ensure logout is called correctly
        useAuthStore.getState().logout();
        // Throw an error that indicates session expiry specifically
        const authError = new Error('Session expired. Please log in again.');
        (authError as any).status = 401; // Add status to error object
        throw authError;
      }

      // Throw standard error object for other failures
      const httpError = new Error(errorMsg);
      (httpError as any).status = response.status; // Add status code
      (httpError as any).details = errorDetails; // Add details if needed
      throw httpError;
    }

    // Handle 204 No Content (often for DELETE)
    if (response.status === 204 || !responseText) {
      // Return structure indicating success for DELETE, or empty object for others
      return { success: true } as ApiResponse<T>; // Cast to satisfy return type, assumes success=true for 204
    }

    // Parse successful JSON response
    try {
      const jsonData: ApiResponse<T> = JSON.parse(responseText);
      // Add dev logging for success
      if (import.meta.env.DEV) {
           console.log(`[apiClient ${errorContext}] Success Response (${url}):`, jsonData);
      }
      // Return the parsed JSON - it should match ApiResponse<T> structure
      return jsonData;
    } catch (parseError) {
      console.error(`[apiClient ${errorContext}] JSON parse error for success response (${url}):`, responseText, parseError);
      throw new Error('Invalid server response format.'); // Throw standard error
    }

  } catch (error: unknown) { // Catch block with typed error as unknown
    // Network errors or errors thrown above
    console.error(`[apiClient ${errorContext}] FAILED:`, error);

    // Re-throw the original error (it might have status/details)
    // Ensure it's an Error object before re-throwing
    if (error instanceof Error) {
         throw error;
     } else {
         // Wrap non-Error throws in a new Error object
         throw new Error(`Network or processing error during ${errorContext}: ${String(error)}`);
     }
  }
};

export default apiClient;
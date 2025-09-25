// client/js/api.js
const API_BASE_URL = 'http://localhost:3000/api';

const apiFetch = async (endpoint, options = {}) => {
    const headers = { ...options.headers };

    let body;
    // Check if body is FormData. If so, let the browser set the Content-Type.
    if (options.body instanceof FormData) {
        body = options.body;
    } else if (options.body) {
        body = JSON.stringify(options.body);
        headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            credentials: 'include', // Ensures cookies are sent with every request
            headers,
            body,
        });

        // Handle empty responses (like 204 No Content for DELETE requests)
        if (response.status === 204) {
            return;
        }

        const responseData = await response.json();

        if (!response.ok) {
            // Use the server's specific error message if it exists
            throw new Error(responseData.message || 'An API error occurred');
        }

        return responseData;
    } catch (error) {
        if (error instanceof SyntaxError) {
            // This catches errors where the server returns something that isn't valid JSON
            console.error("The server returned a non-JSON response. Check the Network tab in your browser's developer tools.");
            throw new Error("Server returned an invalid response.");
        }
        // Re-throw the error to be caught by the function that called the API
        throw error;
    }
};

// Simplified API object. All methods now use the robust apiFetch wrapper.
window.api = {
    get: (endpoint, options) => apiFetch(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: 'POST', body }),
    put: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: 'PUT', body }),
    del: (endpoint, options) => apiFetch(endpoint, { ...options, method: 'DELETE' }),
};
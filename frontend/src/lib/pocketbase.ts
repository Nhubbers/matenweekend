import PocketBase from 'pocketbase';

const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL || 'https://matenweekend.nl';

export const pb = new PocketBase(pocketbaseUrl);

// Disable auto-cancellation for duplicate requests
pb.autoCancellation(false);

// Add a global error interceptor to handle 401 Unauthorized responses
// This ensures users are logged out if their token expires while using the app
// Add a global error interceptor to handle 401 Unauthorized responses
// This ensures users are logged out if their token expires while using the app
const originalSend = pb.send;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
pb.send = async <T = any>(path: string, params: any): Promise<T> => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await originalSend.call(pb, path, params) as T;
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        // Check if the error is a 401 Unauthorized/Token invalid
        if (err?.status === 401) {
            pb.authStore.clear();
        }
        throw err;
    }
};

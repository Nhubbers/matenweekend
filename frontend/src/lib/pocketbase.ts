import PocketBase from 'pocketbase';

const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL || 'https://matenweekend.nl';

export const pb = new PocketBase(pocketbaseUrl);

// Disable auto-cancellation for duplicate requests
pb.autoCancellation(false);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import App from './App';
import './index.css';

// Initialize Sentry client-side error tracking dynamically if DSN is provided
if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
        tracesSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        environment: import.meta.env.MODE,
    });
}

const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error, query) => {
            // Avoid spamming Sentry with expected 401/403/404 errors if desired, or log all
            Sentry.captureException(error, {
                tags: {
                    handler: 'queryCache',
                },
                extra: {
                    queryKey: query.queryKey,
                },
            });
        },
    }),
    mutationCache: new MutationCache({
        onError: (error, variables, _context, mutation) => {
            Sentry.captureException(error, {
                tags: {
                    handler: 'mutationCache',
                },
                extra: {
                    mutationKey: mutation.options.mutationKey,
                    variables,
                },
            });
        },
    }),
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes cache default
            refetchOnWindowFocus: false, // Prevents aggressive mobile refetches on browser tab focus
        },
    },
});

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ToastProvider>
                    <App />
                </ToastProvider>
            </AuthProvider>
        </QueryClientProvider>
    </StrictMode>
);

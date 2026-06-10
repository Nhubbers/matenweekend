import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const show = useCallback((message: string, type: Toast['type']) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            removeToast(id);
        }, 3000);
    }, [removeToast]);

    const success = useCallback((message: string) => show(message, 'success'), [show]);
    const error = useCallback((message: string) => show(message, 'error'), [show]);
    const info = useCallback((message: string) => show(message, 'info'), [show]);
    const warning = useCallback((message: string) => show(message, 'warning'), [show]);

    // Helper to map type to DaisyUI class
    const getAlertClass = (type: Toast['type']) => {
        switch (type) {
            case 'success':
                return 'alert-success text-success-content';
            case 'error':
                return 'alert-error text-error-content';
            case 'warning':
                return 'alert-warning text-warning-content';
            case 'info':
            default:
                return 'alert-info text-info-content';
        }
    };

    // Helper to get emoji/icon for type
    const getIcon = (type: Toast['type']) => {
        switch (type) {
            case 'success':
                return '🎉';
            case 'error':
                return '🚨';
            case 'warning':
                return '⚠️';
            case 'info':
            default:
                return 'ℹ️';
        }
    };

    return (
        <ToastContext.Provider value={{ success, error, info, warning }}>
            {children}
            {toasts.length > 0 && (
                <div className="toast toast-center toast-bottom z-[100] pb-24 px-4 w-full max-w-md pointer-events-none">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={`alert ${getAlertClass(toast.type)} shadow-lg rounded-xl flex items-center gap-3 transition-all duration-300 transform translate-y-0 opacity-100 max-w-sm mx-auto pointer-events-auto`}
                        >
                            <span className="text-lg flex-shrink-0">{getIcon(toast.type)}</span>
                            <span className="text-sm font-semibold text-left break-words flex-1">{toast.message}</span>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="btn btn-ghost btn-circle btn-xs hover:bg-black/10 flex-shrink-0"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

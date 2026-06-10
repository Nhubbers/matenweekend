import { Component, type ErrorInfo, type ReactNode } from 'react';
import { nl } from '@/lib/translations';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center p-6 text-center">
                    <div className="max-w-md w-full bg-base-200 p-8 rounded-2xl shadow-xl flex flex-col items-center gap-6">
                        <span className="text-6xl animate-bounce">⚠️</span>
                        <h1 className="text-2xl font-bold">{nl.error}</h1>
                        <p className="text-sm text-base-content/70">
                            {this.state.error?.message || 'Er is een onverwachte fout opgetreden.'}
                        </p>
                        <button
                            onClick={this.handleRetry}
                            className="btn btn-primary btn-wide rounded-xl shadow-md"
                        >
                            {nl.tryAgain}
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

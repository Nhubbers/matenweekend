import { nl } from '@/lib/translations';

interface EmptyStateProps {
    title?: string;
    message?: string;
    icon?: string;
}

export function EmptyState({
    title = nl.noResults,
    message,
    icon = '📭'
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-6xl mb-4">{icon}</span>
            <h3 className="text-lg font-semibold text-base-content">{title}</h3>
            {message && (
                <p className="text-base-content/70 mt-2 max-w-sm">{message}</p>
            )}
        </div>
    );
}

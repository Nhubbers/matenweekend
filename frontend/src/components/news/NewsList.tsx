import { NewsCard } from './NewsCard';
import { LoadingSpinner, EmptyState, ErrorMessage } from '@/components/common';
import { useNews } from '@/hooks/useNews';
import { nl } from '@/lib/translations';

export function NewsList() {
    const { news, loading, error, refetch } = useNews();

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={error} onRetry={refetch} />;
    }

    if (news.length === 0) {
        return (
            <EmptyState
                icon="📢"
                title="Geen nieuws"
                message="Er zijn nog geen nieuwsberichten."
            />
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <span>📢</span> {nl.news}
            </h2>
            <div className="space-y-3">
                {news.map((item) => (
                    <NewsCard key={item.id} news={item} />
                ))}
            </div>
        </div>
    );
}

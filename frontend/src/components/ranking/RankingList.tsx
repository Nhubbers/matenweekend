import { RankingItem } from './RankingItem';
import { LoadingSpinner, EmptyState, ErrorMessage } from '@/components/common';
import { useRanking } from '@/hooks/useRanking';

export function RankingList() {
    const { rankings, loading, error, refetch } = useRanking();

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

    if (rankings.length === 0) {
        return (
            <EmptyState
                icon="🏆"
                title="Nog geen ranking"
                message="Er zijn nog geen punten verdiend."
            />
        );
    }

    // Find max points for progress bar calculation
    const maxPoints = Math.max(...rankings.map((r) => r.totalPoints), 1);

    return (
        <div className="space-y-3">
            {rankings.map((ranking) => (
                <RankingItem
                    key={ranking.id}
                    ranking={ranking}
                    maxPoints={maxPoints}
                />
            ))}
        </div>
    );
}

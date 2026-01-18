import { RankingItem } from './RankingItem';
import { LoadingSpinner, EmptyState, ErrorMessage } from '@/components/common';
import type { UserRanking } from '@/types';

interface RankingListProps {
    rankings: UserRanking[];
    loading: boolean;
    error: string | null;
    onUserClick?: (ranking: UserRanking) => void;
}

export function RankingList({ rankings, loading, error, onUserClick }: RankingListProps) {
    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={error} />;
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
                    onClick={onUserClick ? () => onUserClick(ranking) : undefined}
                />
            ))}
        </div>
    );
}

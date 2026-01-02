import { pb } from '@/lib/pocketbase';
import { cn } from '@/lib/utils';
import type { UserRanking } from '@/types';

interface RankingItemProps {
    ranking: UserRanking;
    maxPoints: number;
}

export function RankingItem({ ranking, maxPoints }: RankingItemProps) {
    const progressPercentage = maxPoints > 0 ? (ranking.totalPoints / maxPoints) * 100 : 0;

    const getMedal = (rank: number) => {
        switch (rank) {
            case 1:
                return '🥇';
            case 2:
                return '🥈';
            case 3:
                return '🥉';
            default:
                return null;
        }
    };

    const medal = getMedal(ranking.rank);
    const avatarUrl = ranking.avatar
        ? pb.files.getUrl({ collectionId: 'users', collectionName: 'users', id: ranking.id }, ranking.avatar)
        : null;

    return (
        <div
            className={cn(
                'card bg-base-200 p-4',
                ranking.rank <= 3 && 'border-2',
                ranking.rank === 1 && 'border-yellow-500',
                ranking.rank === 2 && 'border-gray-400',
                ranking.rank === 3 && 'border-amber-700'
            )}
        >
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10">
                    {medal ? (
                        <span className="text-2xl">{medal}</span>
                    ) : (
                        <span className="text-lg font-bold text-base-content/70">{ranking.rank}.</span>
                    )}
                </div>

                <div className="avatar placeholder">
                    <div className="w-10 h-10 rounded-full bg-neutral text-neutral-content">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={ranking.name} className="rounded-full" />
                        ) : (
                            <span className="text-sm">{ranking.name.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{ranking.name}</span>
                        <span className="font-bold text-primary">{ranking.totalPoints} pts</span>
                    </div>
                    <div className="mt-1">
                        <progress
                            className="progress progress-primary w-full h-2"
                            value={progressPercentage}
                            max="100"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

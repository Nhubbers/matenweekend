import { Skeleton } from '@/components/common';

export function RankingItemSkeleton() {
    return (
        <div className="card bg-base-200 p-4 border border-base-300/10">
            <div className="flex items-center gap-3">
                {/* Medal/Rank spot */}
                <div className="flex items-center justify-center w-10">
                    <Skeleton className="h-6 w-6 rounded-lg" />
                </div>

                {/* Avatar spot */}
                <Skeleton variant="circle" className="w-10 h-10" />

                {/* Info and Progress bar */}
                <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                        {/* User name skeleton */}
                        <Skeleton className="h-4 w-1/3 rounded-lg" />
                        {/* Points skeleton */}
                        <Skeleton className="h-4 w-12 rounded-lg" />
                    </div>
                    {/* Progress bar skeleton */}
                    <Skeleton className="h-2 w-full rounded-full" />
                </div>
            </div>
        </div>
    );
}

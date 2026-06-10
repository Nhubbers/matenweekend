import { Skeleton } from '@/components/common';

export function NewsCardSkeleton() {
    return (
        <article className="card bg-base-200 p-4 border border-base-300/10 space-y-3">
            <div className="flex justify-between items-start">
                <div className="space-y-2 flex-grow">
                    {/* Title skeleton */}
                    <Skeleton className="h-5 w-1/3 rounded-lg" />
                    {/* Timestamp skeleton */}
                    <Skeleton className="h-3.5 w-24 rounded-lg" />
                </div>
            </div>
            {/* Body text skeletons */}
            <div className="space-y-1.5">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
                <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>
        </article>
    );
}

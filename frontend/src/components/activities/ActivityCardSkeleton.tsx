import { Skeleton } from '@/components/common';

export function ActivityCardSkeleton() {
    return (
        <div className="card bg-base-200 shadow-xl overflow-hidden border border-base-300/20">
            {/* Image Skeleton */}
            <Skeleton className="h-48 w-full rounded-none" />

            <div className="card-body p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                    {/* Title Skeleton */}
                    <Skeleton className="h-6 w-2/3 rounded-xl" />
                    {/* Badge Skeleton */}
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>

                <div className="space-y-2">
                    {/* Date Skeleton */}
                    <div className="flex items-center gap-2">
                        <Skeleton variant="circle" className="h-5 w-5" />
                        <Skeleton className="h-4 w-1/2 rounded-lg" />
                    </div>
                    {/* Creator Skeleton */}
                    <div className="flex items-center gap-2">
                        <Skeleton variant="circle" className="h-6 w-6" />
                        <Skeleton className="h-4 w-1/3 rounded-lg" />
                    </div>
                    {/* Participants Skeleton */}
                    <div className="flex items-center gap-2">
                        <Skeleton variant="circle" className="h-5 w-5" />
                        <Skeleton className="h-4 w-1/4 rounded-lg" />
                    </div>
                    {/* Points Skeleton */}
                    <div className="flex items-center gap-2">
                        <Skeleton variant="circle" className="h-5 w-5" />
                        <Skeleton className="h-4 w-1/5 rounded-lg" />
                    </div>
                </div>

                {/* Button Skeleton */}
                <div className="card-actions justify-end mt-2">
                    <Skeleton className="h-8 w-20 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

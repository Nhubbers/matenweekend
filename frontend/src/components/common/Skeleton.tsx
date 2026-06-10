import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'rect' | 'circle';
}

export function Skeleton({ className, variant = 'rect', ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse bg-base-300',
                variant === 'text' && 'h-4 w-full rounded-md',
                variant === 'circle' && 'rounded-full',
                variant === 'rect' && 'rounded-2xl',
                className
            )}
            {...props}
        />
    );
}

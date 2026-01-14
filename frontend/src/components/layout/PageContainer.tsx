import { useRef, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
    children: ReactNode;
    className?: string;
    onRefresh?: () => Promise<void>; // Keep prop for compatibility but won't use it
}

export function PageContainer({ children, className }: PageContainerProps) {
    const scrollContainerRef = useRef<HTMLElement>(null);

    // Auto-focus scroll container on mount for immediate scroll capability
    useEffect(() => {
        const timer = setTimeout(() => {
            scrollContainerRef.current?.focus({ preventScroll: true });
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    return (
        <main
            ref={scrollContainerRef}
            className={cn(
                'flex-1 overflow-y-auto min-h-0',
                'px-4 py-4 main-content',
                'max-w-2xl mx-auto w-full'
            )}
            tabIndex={-1}
            style={{
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
                outline: 'none',
            }}
        >
            <div className={className}>
                {children}
            </div>
        </main>
    );
}

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
    children: ReactNode;
    className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
    return (
        <main
            className={cn(
                'flex-1 overflow-y-auto px-4 py-4 pb-20',
                'max-w-2xl mx-auto w-full',
                className
            )}
        >
            {children}
        </main>
    );
}

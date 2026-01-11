import type { ReactNode } from 'react';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { cn } from '@/lib/utils';

interface PageContainerProps {
    children: ReactNode;
    className?: string;
    onRefresh?: () => Promise<void>;
}

export function PageContainer({ children, className, onRefresh }: PageContainerProps) {
    const content = (
        <main
            className={cn(
                'flex-1 overflow-y-auto px-4 py-4 main-content',
                'max-w-2xl mx-auto w-full',
                className
            )}
        >
            {children}
        </main>
    );

    if (onRefresh) {
        return (
            <div className="flex-1 flex flex-col overflow-hidden">
                <PullToRefresh
                    onRefresh={onRefresh}
                    className="flex-1 flex flex-col overflow-y-auto"
                    pullingContent={
                        <div className="text-center p-4 text-gray-500 text-sm">
                            Pull to refresh...
                        </div>
                    }
                    refreshingContent={
                        <div className="text-center p-4 text-gray-500 text-sm">
                            Refreshing...
                        </div>
                    }
                >
                    {content}
                </PullToRefresh>
            </div>
        );
    }

    return content;
}

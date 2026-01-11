import type { ReactNode } from 'react';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { cn } from '@/lib/utils';

interface PageContainerProps {
    children: ReactNode;
    className?: string;
    onRefresh?: () => Promise<void>;
}

export function PageContainer({ children, className, onRefresh }: PageContainerProps) {
    const innerContent = (
        <div
            className={cn(
                'px-4 py-4 main-content',
                'max-w-2xl mx-auto w-full',
                className
            )}
        >
            {children}
        </div>
    );

    if (onRefresh) {
        return (
            <main
                className="flex-1 flex flex-col overflow-hidden min-h-0"
                style={{ overscrollBehavior: 'none' }}
            >
                <div
                    className="flex-1 overflow-y-auto"
                    style={{
                        overscrollBehavior: 'contain',
                        WebkitOverflowScrolling: 'touch'
                    }}
                >
                    <PullToRefresh
                        onRefresh={onRefresh}
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
                        {innerContent}
                    </PullToRefresh>
                </div>
            </main>
        );
    }

    return (
        <main
            className={cn(
                'flex-1 overflow-y-auto min-h-0',
                'px-4 py-4 main-content',
                'max-w-2xl mx-auto w-full'
            )}
            style={{
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch'
            }}
        >
            <div className={className}>
                {children}
            </div>
        </main>
    );
}

import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';

interface OverdueAlertProps {
    onViewOverdue: () => void;
    currentFilter: string;
}

export function OverdueAlert({ onViewOverdue, currentFilter }: OverdueAlertProps) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fetchOverdueCount = async () => {
            try {
                const now = new Date().toISOString();
                const result = await pb.collection('activities').getList(1, 1, {
                    filter: `status = "open" && start_time < "${now}"`,
                });
                setCount(result.totalItems);
            } catch (err) {
                console.error('Failed to fetch overdue count:', err);
            }
        };

        fetchOverdueCount();

        // Subscribe to changes
        const unsubscribe = pb.collection('activities').subscribe('*', () => {
            fetchOverdueCount();
        });

        return () => {
            unsubscribe.then(unsub => unsub());
        };
    }, []);

    if (count === 0 || currentFilter === 'overdue') return null;

    return (
        <div className="alert alert-warning shadow-sm mb-4 py-3">
            <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                    <h3 className="font-bold text-sm sm:text-base">
                        Er {count === 1 ? 'is' : 'zijn'} {count} {count === 1 ? 'activiteit' : 'activiteiten'} uit het verleden die nog niet {count === 1 ? 'is' : 'zijn'} afgerond.
                    </h3>
                </div>
                <button 
                    className="btn btn-sm btn-ghost border-warning-content/20 hover:bg-warning-content/10"
                    onClick={onViewOverdue}
                >
                    Bekijk
                </button>
            </div>
        </div>
    );
}

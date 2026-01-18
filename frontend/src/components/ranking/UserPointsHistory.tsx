import { LoadingSpinner, ErrorMessage } from '@/components/common';
import { useUserTransactions } from '@/hooks/useRanking';
import { formatRelativeTime } from '@/lib/utils';

interface UserPointsHistoryProps {
    userId: string;
}

export function UserPointsHistory({ userId }: UserPointsHistoryProps) {
    const { transactions, loading, error } = useUserTransactions(userId);

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (transactions.length === 0) {
        return (
            <p className="text-base-content/70 text-center py-4">
                Nog geen punten verdiend
            </p>
        );
    }

    return (
        <div className="space-y-2">
            {transactions.map((tx) => (
                <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                >
                    <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{tx.reason}</p>
                        <p className="text-sm text-base-content/70">
                            {formatRelativeTime(tx.created)}
                        </p>
                    </div>
                    <span
                        className={`font-bold ${tx.amount >= 0 ? 'text-success' : 'text-error'}`}
                    >
                        {tx.amount >= 0 ? '+' : ''}
                        {tx.amount}
                    </span>
                </div>
            ))}
        </div>
    );
}

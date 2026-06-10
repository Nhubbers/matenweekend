import { useState, useCallback, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import type { PointTransaction, UserRanking } from '@/types';

export function useRanking() {
    const [rankings, setRankings] = useState<UserRanking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRankings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch rankings directly from server-side aggregated view
            const records = await pb.collection('rankings_view').getFullList<UserRanking>({
                sort: '-totalPoints',
            });

            // Assign ranks client-side based on sorted order
            records.forEach((user, index) => {
                user.rank = index + 1;
                // Safe name fallback matching original client logic
                if (!user.name && user.id) {
                    user.name = 'Gebruiker ' + user.id.slice(0, 5);
                }
            });

            setRankings(records);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch rankings');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRankings();
    }, [fetchRankings]);

    return {
        rankings,
        loading,
        error,
        refetch: fetchRankings,
    };
}

export function useUserTransactions(userId: string | undefined) {
    const [transactions, setTransactions] = useState<PointTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const result = await pb.collection('point_transactions').getFullList<PointTransaction>({
                filter: `user = "${userId}"`,
                sort: '-created',
                expand: 'activity',
            });

            setTransactions(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const totalPoints = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    return {
        transactions,
        totalPoints,
        loading,
        error,
        refetch: fetchTransactions,
    };
}

export function useAwardPoints() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const awardPoints = async (
        userId: string,
        amount: number,
        reason: string,
        type: 'bonus' | 'deduction' = amount >= 0 ? 'bonus' : 'deduction'
    ) => {
        try {
            setLoading(true);
            setError(null);

            const transaction = await pb.collection('point_transactions').create<PointTransaction>({
                user: userId,
                amount,
                reason,
                type,
                awarded_by: pb.authStore.record?.id,
            });

            return transaction;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to award points');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        awardPoints,
        loading,
        error,
    };
}

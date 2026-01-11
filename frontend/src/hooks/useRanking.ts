import { useState, useCallback, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import type { PointTransaction, UserRanking, User } from '@/types';

export function useRanking() {
    const [rankings, setRankings] = useState<UserRanking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRankings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all users and transactions in parallel
            const [users, transactions] = await Promise.all([
                pb.collection('users').getFullList<User>(),
                pb.collection('point_transactions').getFullList<PointTransaction>({
                    expand: 'user',
                }),
            ]);

            // Initialize map with all users starting at 0 points
            const pointsMap = new Map<string, UserRanking>();

            users.forEach((user) => {
                pointsMap.set(user.id, {
                    id: user.id,
                    name: user.name || user.email.split('@')[0],
                    avatar: user.avatar,
                    totalPoints: 0,
                    rank: 0,
                });
            });

            // Add points from transactions
            transactions.forEach((tx) => {
                const userId = tx.user; // Use the direct user ID reference
                // Or safely handle if we want to rely on expand, but tx.user is safer if the user might be deleted but tx exists? 
                // Actually, if we are iterating all users from the users collection, we only care about transactions for those users.

                const existing = pointsMap.get(userId);
                if (existing) {
                    existing.totalPoints += tx.amount || 0;
                }
                // If user doesn't exist in pointsMap (e.g. deleted user but transaction remains), we ignore or handle accordingly. 
                // Current requirement implies showing all *active* users.
            });

            // Sort by points descending and assign ranks
            const sorted = Array.from(pointsMap.values()).sort(
                (a, b) => b.totalPoints - a.totalPoints
            );

            sorted.forEach((user, index) => {
                user.rank = index + 1;
            });

            setRankings(sorted);
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

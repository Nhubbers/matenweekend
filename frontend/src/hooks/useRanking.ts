import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import type { PointTransaction, UserRanking } from '@/types';

export function useRanking() {
    const { data: rankings = [], isLoading: loading, error, refetch } = useQuery<UserRanking[]>({
        queryKey: ['rankings'],
        queryFn: async () => {
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

            return records;
        },
    });

    return {
        rankings,
        loading,
        error: error ? error.message : null,
        refetch: async () => {
            await refetch();
        },
    };
}

export function useUserTransactions(userId: string | undefined) {
    const { data: transactions = [], isLoading: loading, error, refetch } = useQuery<PointTransaction[]>({
        queryKey: ['transactions', userId],
        queryFn: async () => {
            if (!userId) return [];
            return await pb.collection('point_transactions').getFullList<PointTransaction>({
                filter: `user = "${userId}"`,
                sort: '-created',
                expand: 'activity',
            });
        },
        enabled: !!userId,
    });

    const totalPoints = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    return {
        transactions,
        totalPoints,
        loading,
        error: error ? error.message : null,
        refetch: async () => {
            await refetch();
        },
    };
}

export function useAwardPoints() {
    const queryClient = useQueryClient();
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

            // Invalidate rankings and user transactions cache
            await queryClient.invalidateQueries({ queryKey: ['rankings'] });
            await queryClient.invalidateQueries({ queryKey: ['transactions', userId] });

            return transaction;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to award points';
            setError(message);
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

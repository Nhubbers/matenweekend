import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import type { Activity } from '@/types';

export function useActivity(id: string | undefined) {
    const queryClient = useQueryClient();
    const queryKey = ['activity', id];

    const { data: activity = null, isLoading: loading, error, refetch } = useQuery<Activity | null>({
        queryKey,
        queryFn: async () => {
            if (!id) return null;
            return await pb.collection('activities').getOne<Activity>(id, {
                expand: 'creator,co_organizers',
            });
        },
        enabled: !!id,
    });

    const setActivity = (newActivity: Activity | null | ((prev: Activity | null) => Activity | null)) => {
        queryClient.setQueryData(queryKey, (prev: Activity | null) => {
            if (typeof newActivity === 'function') {
                return newActivity(prev);
            }
            return newActivity;
        });
    };

    return {
        activity,
        loading,
        error: error ? error.message : null,
        refetch,
        setActivity,
    };
}

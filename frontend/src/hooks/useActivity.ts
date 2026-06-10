import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import type { Activity } from '@/types';

export function useActivity(id: string | undefined) {
    const [activity, setActivity] = useState<Activity | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchActivity = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            setError(null);
            const record = await pb.collection('activities').getOne<Activity>(id, {
                expand: 'creator,co_organizers',
            });
            setActivity(record);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch activity');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchActivity();
    }, [fetchActivity]);

    return {
        activity,
        loading,
        error,
        refetch: fetchActivity,
        setActivity,
    };
}

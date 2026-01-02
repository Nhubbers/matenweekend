import { useState, useCallback, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import type { Participation } from '@/types';

export function useParticipations(activityId?: string) {
    const { user } = useAuth();
    const [participations, setParticipations] = useState<Participation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchParticipations = useCallback(async () => {
        if (!activityId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const result = await pb.collection('participations').getFullList<Participation>({
                filter: `activity = "${activityId}"`,
                expand: 'user',
            });

            setParticipations(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch participations');
        } finally {
            setLoading(false);
        }
    }, [activityId]);

    useEffect(() => {
        fetchParticipations();
    }, [fetchParticipations]);

    const isJoined = participations.some((p) => p.user === user?.id);
    const myParticipation = participations.find((p) => p.user === user?.id);

    const join = async () => {
        if (!activityId) return;

        const participation = await pb.collection('participations').create<Participation>({
            activity: activityId,
        });

        // Refetch to get the expanded user data
        await fetchParticipations();
        return participation;
    };

    const leave = async () => {
        if (!myParticipation) return;

        await pb.collection('participations').delete(myParticipation.id);
        setParticipations((prev) => prev.filter((p) => p.id !== myParticipation.id));
    };

    const removeParticipant = async (participationId: string) => {
        await pb.collection('participations').delete(participationId);
        setParticipations((prev) => prev.filter((p) => p.id !== participationId));
    };

    return {
        participations,
        loading,
        error,
        isJoined,
        myParticipation,
        refetch: fetchParticipations,
        join,
        leave,
        removeParticipant,
    };
}

export function useMyParticipations() {
    const { user } = useAuth();
    const [participations, setParticipations] = useState<Participation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMyParticipations = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const result = await pb.collection('participations').getFullList<Participation>({
                filter: `user = "${user.id}"`,
                expand: 'activity',
            });

            setParticipations(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch participations');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMyParticipations();
    }, [fetchMyParticipations]);

    return {
        participations,
        loading,
        error,
        refetch: fetchMyParticipations,
    };
}

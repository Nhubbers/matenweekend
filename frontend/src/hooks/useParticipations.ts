import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import type { Participation } from '@/types';

export function useParticipations(activityId?: string) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const queryKey = ['participations', activityId];

    const { data: participations = [], isLoading: loading, error, refetch } = useQuery<Participation[]>({
        queryKey,
        queryFn: async () => {
            if (!activityId) return [];
            return await pb.collection('participations').getFullList<Participation>({
                filter: `activity = "${activityId}"`,
                expand: 'user',
            });
        },
        enabled: !!activityId,
    });

    const isJoined = participations.some((p) => p.user === user?.id);
    const myParticipation = participations.find((p) => p.user === user?.id);

    const join = async () => {
        if (!activityId) return;

        const participation = await pb.collection('participations').create<Participation>({
            activity: activityId,
        });

        await queryClient.invalidateQueries({ queryKey });
        return participation;
    };

    const leave = async () => {
        if (!myParticipation) return;

        await pb.collection('participations').delete(myParticipation.id);
        await queryClient.invalidateQueries({ queryKey });
    };

    const addParticipant = async (userId: string) => {
        if (!activityId) return;

        const participation = await pb.collection('participations').create<Participation>({
            activity: activityId,
            user: userId,
        });

        await queryClient.invalidateQueries({ queryKey });
        return participation;
    };

    const removeParticipant = async (participationId: string) => {
        await pb.collection('participations').delete(participationId);
        await queryClient.invalidateQueries({ queryKey });
    };

    const markNoshows = async (noshows: Record<string, boolean>) => {
        // Update each participation with noshow status
        const updates = Object.entries(noshows).map(([participationId, isNoshow]) =>
            pb.collection('participations').update(participationId, { noshow: isNoshow })
        );
        await Promise.all(updates);
        await queryClient.invalidateQueries({ queryKey });
    };

    return {
        participations,
        loading,
        error: error ? error.message : null,
        isJoined,
        myParticipation,
        refetch,
        join,
        leave,
        addParticipant,
        removeParticipant,
        markNoshows,
    };
}

export function useMyParticipations() {
    const { user } = useAuth();

    const { data: participations = [], isLoading: loading, error, refetch } = useQuery<Participation[]>({
        queryKey: ['my-participations', user?.id],
        queryFn: async () => {
            if (!user) return [];
            return await pb.collection('participations').getFullList<Participation>({
                filter: `user = "${user.id}"`,
                expand: 'activity',
            });
        },
        enabled: !!user,
    });

    return {
        participations,
        loading,
        error: error ? error.message : null,
        refetch,
    };
}

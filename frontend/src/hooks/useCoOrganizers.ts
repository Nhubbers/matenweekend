import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import type { User, Activity, Participation } from '@/types';

export function useCoOrganizers(activityId?: string) {
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Add a co-organizer to an activity
    const addCoOrganizer = useCallback(async (userId: string, activity: Activity): Promise<Activity> => {
        if (!activityId) throw new Error('No activity ID');

        setLoading(true);
        setError(null);

        try {
            // Check if user is already a participant
            const participations = await pb.collection('participations').getFullList<Participation>({
                filter: `activity = "${activityId}" && user = "${userId}"`,
            });

            if (participations.length > 0) {
                throw new Error('Verwijder deze gebruiker eerst als deelnemer');
            }

            // Add to co_organizers array
            const currentCoOrganizers = activity.co_organizers || [];
            if (currentCoOrganizers.includes(userId)) {
                throw new Error('Gebruiker is al mede-organisator');
            }

            const updatedCoOrganizers = [...currentCoOrganizers, userId];

            const updated = await pb.collection('activities').update<Activity>(activityId, {
                co_organizers: updatedCoOrganizers,
            }, {
                expand: 'creator,co_organizers',
            });

            await queryClient.invalidateQueries({ queryKey: ['activities'] });
            await queryClient.invalidateQueries({ queryKey: ['activity', activityId] });

            return updated;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to add co-organizer';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [activityId, queryClient]);

    // Remove a co-organizer from an activity
    const removeCoOrganizer = useCallback(async (userId: string, activity: Activity): Promise<Activity> => {
        if (!activityId) throw new Error('No activity ID');

        setLoading(true);
        setError(null);

        try {
            const currentCoOrganizers = activity.co_organizers || [];
            const updatedCoOrganizers = currentCoOrganizers.filter(id => id !== userId);

            const updated = await pb.collection('activities').update<Activity>(activityId, {
                co_organizers: updatedCoOrganizers,
            }, {
                expand: 'creator,co_organizers',
            });

            await queryClient.invalidateQueries({ queryKey: ['activities'] });
            await queryClient.invalidateQueries({ queryKey: ['activity', activityId] });

            return updated;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to remove co-organizer';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [activityId, queryClient]);

    // Get available users (not already organizer or participant)
    const getAvailableUsers = useCallback(async (activity: Activity): Promise<User[]> => {
        if (!activityId) return [];

        try {
            // Get all participations for this activity
            const participations = await pb.collection('participations').getFullList<Participation>({
                filter: `activity = "${activityId}"`,
            });

            const participantIds = participations.map(p => p.user);
            const creatorId = activity.creator;
            const coOrganizerIds = activity.co_organizers || [];

            // Get all users
            const allUsers = await pb.collection('users').getFullList<User>();

            // Filter out creator, co-organizers, and participants
            const excludedIds = [creatorId, ...coOrganizerIds, ...participantIds];
            return allUsers.filter(user => !excludedIds.includes(user.id));
        } catch (err) {
            console.error('Failed to get available users:', err);
            return [];
        }
    }, [activityId]);

    return {
        loading,
        error,
        addCoOrganizer,
        removeCoOrganizer,
        getAvailableUsers,
    };
}

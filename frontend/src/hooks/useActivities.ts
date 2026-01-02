import { useState, useCallback, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import type { Activity, ActivityFilter, CreateActivityData } from '@/types';

export function useActivities(filter: ActivityFilter = 'all') {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchActivities = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let filterQuery = '';
            const now = new Date().toISOString();

            if (filter === 'upcoming') {
                filterQuery = `start_time > "${now}" && status = "open"`;
            } else if (filter === 'completed') {
                filterQuery = 'status = "completed" || status = "cancelled"';
            }

            const result = await pb.collection('activities').getFullList<Activity>({
                sort: '-start_time',
                expand: 'creator',
                filter: filterQuery || undefined,
            });

            setActivities(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch activities');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const createActivity = async (data: CreateActivityData) => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('start_time', data.start_time);
        formData.append('status', 'open');
        formData.append('points_participant', data.points_participant.toString());
        formData.append('points_creator', data.points_creator.toString());
        formData.append('max_participants', data.max_participants.toString());

        if (data.image) {
            formData.append('image', data.image);
        }

        const activity = await pb.collection('activities').create<Activity>(formData);
        setActivities((prev) => [activity, ...prev]);
        return activity;
    };

    const getActivity = async (id: string) => {
        return await pb.collection('activities').getOne<Activity>(id, {
            expand: 'creator',
        });
    };

    const updateActivityStatus = async (id: string, status: Activity['status']) => {
        const updated = await pb.collection('activities').update<Activity>(id, { status });
        setActivities((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status: updated.status } : a))
        );
        return updated;
    };

    const reopenActivity = async (activity: Activity) => {
        // 1. Fetch all participations to know who got points
        const participations = await pb.collection('participations').getFullList({
            filter: `activity = "${activity.id}"`,
        });

        // 2. Create deduction for Creator (if points > 0)
        if (activity.points_creator > 0) {
            await pb.collection('point_transactions').create({
                user: activity.creator,
                amount: -activity.points_creator,
                reason: `Activity Reopened: ${activity.title}`,
                activity: activity.id,
                type: 'deduction',
            });
        }

        // 3. Create deductions for Participants (if points > 0)
        if (activity.points_participant > 0) {
            // Process in parallel
            await Promise.all(
                participations.map((p) =>
                    pb.collection('point_transactions').create({
                        user: p.user,
                        amount: -activity.points_participant,
                        reason: `Activity Reopened: ${activity.title}`,
                        activity: activity.id,
                        type: 'deduction',
                    })
                )
            );
        }

        // 4. Update status to open
        return updateActivityStatus(activity.id, 'open');
    };

    const deleteActivity = async (id: string) => {
        await pb.collection('activities').delete(id);
        setActivities((prev) => prev.filter((a) => a.id !== id));
    };

    return {
        activities,
        loading,
        error,
        createActivity,
        getActivity,
        updateActivityStatus,
        reopenActivity,
        deleteActivity,
    };
}

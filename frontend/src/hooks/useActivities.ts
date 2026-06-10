import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import type { Activity, ActivityFilter, CreateActivityData } from '@/types';

type UpdateActivityData = Partial<
    Pick<
        Activity,
        | 'title'
        | 'description'
        | 'start_time'
        | 'end_time'
        | 'points_participant'
        | 'points_creator'
        | 'points_organizer_per_participant'
        | 'creator'
    >
> & {
    image?: File;
};

export function useActivities(filter: ActivityFilter = 'all') {
    const queryClient = useQueryClient();

    const { data: activities = [], isLoading: loading, error, refetch } = useQuery<Activity[]>({
        queryKey: ['activities', filter],
        queryFn: async () => {
            let filterQuery = '';
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

            if (filter === 'upcoming') {
                filterQuery = `start_time >= "${startOfToday}" && status = "open"`;
            } else if (filter === 'overdue') {
                filterQuery = `start_time < "${now.toISOString()}" && status = "open"`;
            } else if (filter === 'completed') {
                filterQuery = 'status = "completed" || status = "cancelled"';
            }

            return await pb.collection('activities').getFullList<Activity>({
                sort: 'start_time',
                expand: 'creator,co_organizers',
                filter: filterQuery || undefined,
            });
        },
    });

    const createActivity = async (data: CreateActivityData) => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('start_time', data.start_time);
        if (data.end_time) formData.append('end_time', data.end_time);
        formData.append('status', 'open');
        formData.append('points_participant', data.points_participant.toString());
        formData.append('points_creator', data.points_creator.toString());
        formData.append('points_organizer_per_participant', data.points_organizer_per_participant.toString());
        formData.append('max_participants', data.max_participants.toString());
        if (data.creator) {
            formData.append('creator', data.creator);
        }

        if (data.image) {
            formData.append('image', data.image);
        }

        const activity = await pb.collection('activities').create<Activity>(formData, {
            expand: 'creator,co_organizers',
        });
        
        await queryClient.invalidateQueries({ queryKey: ['activities'] });
        return activity;
    };

    const getActivity = async (id: string) => {
        return await pb.collection('activities').getOne<Activity>(id, {
            expand: 'creator,co_organizers',
        });
    };

    const updateActivityStatus = async (id: string, status: Activity['status']) => {
        const updated = await pb.collection('activities').update<Activity>(id, { status });
        await queryClient.invalidateQueries({ queryKey: ['activities'] });
        await queryClient.invalidateQueries({ queryKey: ['activity', id] });
        return updated;
    };

    const updateActivity = async (id: string, data: UpdateActivityData) => {
        const formData = new FormData();
        if (data.title) formData.append('title', data.title);
        if (data.description) formData.append('description', data.description);
        if (data.start_time) formData.append('start_time', data.start_time);
        if (data.end_time) formData.append('end_time', data.end_time);
        if (data.image) formData.append('image', data.image);
        if (data.creator) formData.append('creator', data.creator);
        if (data.points_participant !== undefined) {
            formData.append('points_participant', data.points_participant.toString());
        }
        if (data.points_creator !== undefined) {
            formData.append('points_creator', data.points_creator.toString());
        }
        if (data.points_organizer_per_participant !== undefined) {
            formData.append('points_organizer_per_participant', data.points_organizer_per_participant.toString());
        }

        const updated = await pb.collection('activities').update<Activity>(id, formData, {
            expand: 'creator,co_organizers',
        });
        
        await queryClient.invalidateQueries({ queryKey: ['activities'] });
        await queryClient.invalidateQueries({ queryKey: ['activity', id] });
        return updated;
    };

    const completeActivity = async (activity: Activity, completionImage?: File, isAdmin?: boolean) => {
        const now = new Date();
        const endTime = activity.end_time ? new Date(activity.end_time) : new Date(activity.start_time);

        // Allow admins to bypass the time check for testing
        if (endTime > now && !isAdmin) {
            throw new Error('Deze activiteit is nog niet afgelopen. Je kunt pas afronden nadat de activiteit heeft plaatsgevonden.');
        }

        // Use FormData to send both status update and completion image
        const formData = new FormData();
        formData.append('status', 'completed');
        if (completionImage) {
            formData.append('completion_image', completionImage);
        }

        const updated = await pb.collection('activities').update<Activity>(activity.id, formData);
        await queryClient.invalidateQueries({ queryKey: ['activities'] });
        await queryClient.invalidateQueries({ queryKey: ['activity', activity.id] });
        await queryClient.invalidateQueries({ queryKey: ['rankings'] });
        return updated;
    };

    const reopenActivity = async (activity: Activity) => {
        // Update status to open. 
        // Server-side hooks (main.pb.js) will handle the removal of point transactions.
        const updated = await updateActivityStatus(activity.id, 'open');
        await queryClient.invalidateQueries({ queryKey: ['rankings'] });
        return updated;
    };

    const deleteActivity = async (id: string) => {
        await pb.collection('activities').delete(id);
        await queryClient.invalidateQueries({ queryKey: ['activities'] });
        await queryClient.invalidateQueries({ queryKey: ['activity', id] });
    };

    return {
        activities,
        loading,
        error: error ? error.message : null,
        refetch: async () => {
            await refetch();
        },
        createActivity,
        getActivity,
        updateActivityStatus,
        updateActivity,
        completeActivity,
        reopenActivity,
        deleteActivity,
    };
}

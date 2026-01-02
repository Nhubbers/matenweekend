import { useState, useEffect } from 'react';
import { ActivityCard } from './ActivityCard';
import { LoadingSpinner, EmptyState, ErrorMessage } from '@/components/common';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/contexts/AuthContext';
import { pb } from '@/lib/pocketbase';
import { nl } from '@/lib/translations';
import { cn } from '@/lib/utils';
import type { ActivityFilter, Participation } from '@/types';

interface ActivityListProps {
    filter?: ActivityFilter;
    onFilterChange?: (filter: ActivityFilter) => void;
}

const filterOptions: { value: ActivityFilter; label: string }[] = [
    { value: 'upcoming', label: nl.upcoming },
    { value: 'all', label: nl.all },
    { value: 'completed', label: nl.completed },
];

export function ActivityList({ filter = 'all', onFilterChange }: ActivityListProps) {
    const { user } = useAuth();
    const { activities, loading, error, refetch } = useActivities(filter);
    const [participationsMap, setParticipationsMap] = useState<Map<string, Participation[]>>(new Map());
    const [joinedMap, setJoinedMap] = useState<Map<string, string>>(new Map());
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Fetch participations for all activities
    useEffect(() => {
        const fetchParticipations = async () => {
            if (activities.length === 0) return;

            const activityIds = activities.map((a) => a.id);
            const filterQuery = activityIds.map((id) => `activity = "${id}"`).join(' || ');

            try {
                const participations = await pb.collection('participations').getFullList<Participation>({
                    filter: filterQuery,
                    expand: 'user',
                });

                // Group by activity
                const map = new Map<string, Participation[]>();
                const joined = new Map<string, string>();

                participations.forEach((p) => {
                    const existing = map.get(p.activity) || [];
                    existing.push(p);
                    map.set(p.activity, existing);

                    if (p.user === user?.id) {
                        joined.set(p.activity, p.id);
                    }
                });

                setParticipationsMap(map);
                setJoinedMap(joined);
            } catch (err) {
                console.error('Failed to fetch participations:', err);
            }
        };

        fetchParticipations();
    }, [activities, user?.id]);

    const handleJoin = async (activityId: string) => {
        try {
            setActionLoading(activityId);
            const participation = await pb.collection('participations').create<Participation>({
                activity: activityId,
            });

            // Update local state
            setJoinedMap((prev) => new Map(prev).set(activityId, participation.id));
            setParticipationsMap((prev) => {
                const newMap = new Map(prev);
                const existing = newMap.get(activityId) || [];
                newMap.set(activityId, [...existing, participation]);
                return newMap;
            });
        } catch (err) {
            console.error('Failed to join:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleLeave = async (activityId: string) => {
        const participationId = joinedMap.get(activityId);
        if (!participationId) return;

        try {
            setActionLoading(activityId);
            await pb.collection('participations').delete(participationId);

            // Update local state
            setJoinedMap((prev) => {
                const newMap = new Map(prev);
                newMap.delete(activityId);
                return newMap;
            });
            setParticipationsMap((prev) => {
                const newMap = new Map(prev);
                const existing = newMap.get(activityId) || [];
                newMap.set(activityId, existing.filter((p) => p.id !== participationId));
                return newMap;
            });
        } catch (err) {
            console.error('Failed to leave:', err);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={error} onRetry={refetch} />;
    }

    return (
        <div className="space-y-4">
            {onFilterChange && (
                <div className="tabs tabs-boxed bg-base-200">
                    {filterOptions.map((option) => (
                        <button
                            key={option.value}
                            className={cn('tab', filter === option.value && 'tab-active')}
                            onClick={() => onFilterChange(option.value)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}

            {activities.length === 0 ? (
                <EmptyState
                    icon="📋"
                    title="Geen activiteiten"
                    message="Er zijn nog geen activiteiten in deze categorie."
                />
            ) : (
                <div className="grid gap-4">
                    {activities.map((activity) => (
                        <ActivityCard
                            key={activity.id}
                            activity={activity}
                            participations={participationsMap.get(activity.id) || []}
                            isJoined={joinedMap.has(activity.id)}
                            onJoin={() => handleJoin(activity.id)}
                            onLeave={() => handleLeave(activity.id)}
                            loading={actionLoading === activity.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

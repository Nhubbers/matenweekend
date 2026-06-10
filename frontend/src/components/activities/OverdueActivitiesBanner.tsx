import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { pb } from '@/lib/pocketbase';
import type { Activity } from '@/types';

export function OverdueActivitiesBanner() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [overdueActivities, setOverdueActivities] = useState<Activity[]>([]);

    useEffect(() => {
        if (!user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setOverdueActivities([]);
            return;
        }

        const fetchOverdue = async () => {
            try {
                // Fetch all open activities
                const openActivities = await pb.collection('activities').getFullList<Activity>({
                    filter: 'status = "open"',
                    sort: 'start_time',
                });

                const now = new Date();
                const userOverdue = openActivities.filter((activity) => {
                    const endTime = activity.end_time ? new Date(activity.end_time) : new Date(activity.start_time);
                    if (endTime >= now) return false;

                    const isCreator = activity.creator === user.id;
                    const isCoOrganizer = activity.co_organizers?.includes(user.id) || false;
                    return isCreator || isCoOrganizer;
                });

                setOverdueActivities(userOverdue);
            } catch (err) {
                console.error('Failed to fetch overdue activities:', err);
            }
        };

        fetchOverdue();

        // Subscribe to real-time updates on activities to automatically update the banner status
        let active = true;
        let unsub: (() => void) | undefined;

        pb.collection('activities').subscribe<Activity>('*', () => {
            if (active) fetchOverdue();
        }).then((fn) => {
            if (active) {
                unsub = fn;
            } else {
                fn();
            }
        });

        return () => {
            active = false;
            unsub?.();
        };
    }, [user]);

    if (overdueActivities.length === 0) return null;

    const handleBannerClick = () => {
        if (overdueActivities.length === 1) {
            navigate(`/activities/${overdueActivities[0].id}`);
        } else {
            navigate('/activities', { state: { filter: 'overdue' } });
        }
    };

    return (
        <div
            onClick={handleBannerClick}
            className="bg-warning text-warning-content px-4 py-3 text-center font-medium cursor-pointer hover:bg-warning-focus transition-colors flex items-center justify-center gap-2 text-sm sm:text-base border-b border-warning-content/10 shadow-sm animate-pulse-subtle"
        >
            <span role="img" aria-label="warning">⚠️</span>
            <span>
                {overdueActivities.length === 1 ? (
                    <>
                        Je hebt nog een openstaande activiteit in het verleden om af te ronden: <strong>{overdueActivities[0].title}</strong>. Klik hier om deze te voltooien!
                    </>
                ) : (
                    <>
                        Je hebt nog <strong>{overdueActivities.length}</strong> openstaande activiteiten in het verleden om af te ronden. Klik hier om ze te bekijken!
                    </>
                )}
            </span>
        </div>
    );
}

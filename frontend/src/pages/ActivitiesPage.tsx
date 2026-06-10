import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PageContainer } from '@/components/layout';
import { ActivityList, ActivityFormModal, OverdueAlert } from '@/components/activities';
import { useActivities } from '@/hooks/useActivities';
import { nl } from '@/lib/translations';
import type { ActivityFilter } from '@/types';

export function ActivitiesPage() {
    const location = useLocation();
    const [filter, setFilter] = useState<ActivityFilter>(
        location.state?.filter || (location.state?.showAll ? 'all' : 'upcoming')
    );
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (location.state?.filter) {
            setFilter(location.state.filter);
        } else if (location.state?.showAll) {
            setFilter('all');
        }
    }, [location.state]);

    const { activities, loading, error, refetch } = useActivities(filter);

    return (
        <PageContainer onRefresh={refetch}>
            <div className="mb-4">
                <h1 className="text-2xl font-bold">{nl.activities}</h1>
            </div>

            <OverdueAlert 
                currentFilter={filter}
                onViewOverdue={() => setFilter('overdue')}
            />

            <ActivityList
                filter={filter}
                onFilterChange={setFilter}
                activities={activities}
                loading={loading}
                error={error}
            />

            {/* FAB for creating new activity */}
            <button
                className="btn btn-circle btn-primary btn-lg fixed bottom-20 right-4 shadow-lg z-40"
                onClick={() => setIsModalOpen(true)}
            >
                <span className="text-2xl">+</span>
            </button>

            <ActivityFormModal
                mode="create"
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setFilter('all');
                }}
            />
        </PageContainer>
    );
}

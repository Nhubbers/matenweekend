import { useState } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { LoadingSpinner, ErrorMessage, ConfirmDialog } from '@/components/common';
import { formatDate, getStatusBadgeClass, getStatusLabel, cn } from '@/lib/utils';
import { nl } from '@/lib/translations';
import type { Activity } from '@/types';

export function AdminActivityList() {
    const { activities, loading, error, refetch, updateActivityStatus, deleteActivity } = useActivities('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Activity | null>(null);

    const handleComplete = async (id: string) => {
        try {
            setActionLoading(id);
            await updateActivityStatus(id, 'completed');
        } catch (err) {
            console.error('Failed to complete activity:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async (id: string) => {
        try {
            setActionLoading(id);
            await updateActivityStatus(id, 'cancelled');
        } catch (err) {
            console.error('Failed to cancel activity:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            setActionLoading(deleteConfirm.id);
            await deleteActivity(deleteConfirm.id);
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Failed to delete activity:', err);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={error} onRetry={refetch} />;
    }

    return (
        <>
            <div className="space-y-3">
                <h3 className="font-bold text-lg">{nl.activityManagement}</h3>
                {activities.length === 0 ? (
                    <p className="text-base-content/70">Geen activiteiten</p>
                ) : (
                    <div className="space-y-2">
                        {activities.map((activity) => (
                            <div key={activity.id} className="card bg-base-200 p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium truncate">{activity.title}</h4>
                                        <p className="text-sm text-base-content/70">
                                            {formatDate(activity.start_time)}
                                        </p>
                                        <span className={cn('badge badge-sm mt-1', getStatusBadgeClass(activity.status))}>
                                            {getStatusLabel(activity.status)}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 justify-end">
                                        {activity.status === 'open' && (
                                            <>
                                                <button
                                                    className="btn btn-success btn-xs"
                                                    onClick={() => handleComplete(activity.id)}
                                                    disabled={actionLoading === activity.id}
                                                >
                                                    {actionLoading === activity.id ? (
                                                        <span className="loading loading-spinner loading-xs" />
                                                    ) : (
                                                        nl.complete
                                                    )}
                                                </button>
                                                <button
                                                    className="btn btn-warning btn-xs"
                                                    onClick={() => handleCancel(activity.id)}
                                                    disabled={actionLoading === activity.id}
                                                >
                                                    {nl.cancel}
                                                </button>
                                            </>
                                        )}
                                        <button
                                            className="btn btn-error btn-xs"
                                            onClick={() => setDeleteConfirm(activity)}
                                            disabled={actionLoading === activity.id}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={!!deleteConfirm}
                title={nl.delete}
                message={`${nl.areYouSure} "${deleteConfirm?.title}" verwijderen?`}
                confirmLabel={nl.delete}
                cancelLabel={nl.cancel}
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm(null)}
                variant="danger"
            />
        </>
    );
}

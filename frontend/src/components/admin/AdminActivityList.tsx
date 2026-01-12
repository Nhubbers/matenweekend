import { useState } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { LoadingSpinner, ErrorMessage, ConfirmDialog } from '@/components/common';
import { formatDate, getStatusBadgeClass, getStatusLabel, cn } from '@/lib/utils';
import { nl } from '@/lib/translations';
import type { Activity } from '@/types';

export function AdminActivityList() {
    const { activities, loading, error, refetch, updateActivityStatus, updateActivity, deleteActivity } = useActivities('all');
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
                            <ActivityItem
                                key={activity.id}
                                activity={activity}
                                onComplete={() => handleComplete(activity.id)}
                                onCancel={() => handleCancel(activity.id)}
                                onDelete={() => setDeleteConfirm(activity)}
                                onUpdate={updateActivity}
                                loading={actionLoading === activity.id}
                            />
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

interface ActivityItemProps {
    activity: Activity;
    onComplete: () => void;
    onCancel: () => void;
    onDelete: () => void;
    onUpdate: (id: string, data: Partial<Activity> & { image?: File }) => Promise<Activity>;
    loading: boolean;
}

function ActivityItem({ activity, onComplete, onCancel, onDelete, onUpdate, loading }: ActivityItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({
        points_participant: activity.points_participant,
        points_creator: activity.points_creator,
        points_organizer_per_participant: activity.points_organizer_per_participant,
    });
    const [saveLoading, setSaveLoading] = useState(false);

    const handleSave = async () => {
        try {
            setSaveLoading(true);
            await onUpdate(activity.id, {
                points_participant: editValues.points_participant,
                points_creator: editValues.points_creator,
                points_organizer_per_participant: editValues.points_organizer_per_participant,
            });
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update points:', err);
        } finally {
            setSaveLoading(false);
        }
    };

    if (isEditing) {
        return (
            <div className="card bg-base-200 p-4 space-y-4">
                <div className="flex justify-between items-start">
                    <h4 className="font-medium">{activity.title}</h4>
                    <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => setIsEditing(false)}
                    >
                        ✕
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-control">
                        <label className="label py-1">
                            <span className="label-text text-xs">Deelnemer</span>
                        </label>
                        <input
                            type="number"
                            className="input input-bordered input-sm"
                            value={editValues.points_participant}
                            onChange={(e) => setEditValues({ ...editValues, points_participant: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label py-1">
                            <span className="label-text text-xs">Organisator</span>
                        </label>
                        <input
                            type="number"
                            className="input input-bordered input-sm"
                            value={editValues.points_creator}
                            onChange={(e) => setEditValues({ ...editValues, points_creator: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label py-1">
                            <span className="label-text text-xs">Org. Bonus/Deelnemer</span>
                        </label>
                        <input
                            type="number"
                            className="input input-bordered input-sm"
                            value={editValues.points_organizer_per_participant}
                            onChange={(e) => setEditValues({ ...editValues, points_organizer_per_participant: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setIsEditing(false)}
                        disabled={saveLoading}
                    >
                        Annuleren
                    </button>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleSave}
                        disabled={saveLoading}
                    >
                        {saveLoading ? <span className="loading loading-spinner loading-xs" /> : 'Opslaan'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-base-200 p-3">
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{activity.title}</h4>
                    <p className="text-sm text-base-content/70">
                        {formatDate(activity.start_time)}
                    </p>
                    <div className="flex gap-2 mt-1">
                        <span className={cn('badge badge-sm', getStatusBadgeClass(activity.status))}>
                            {getStatusLabel(activity.status)}
                        </span>
                        <div className="flex gap-1 text-xs text-base-content/60 items-center">
                            <span title="Deelnemer punten">👤 {activity.points_participant}</span>
                            <span title="Organisator punten">👑 {activity.points_creator}</span>
                            <span title="Bonus per deelnemer">📈 {activity.points_organizer_per_participant}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                    <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => setIsEditing(true)}
                        disabled={loading}
                        title="Punten aanpassen"
                    >
                        ✏️
                    </button>
                    {activity.status === 'open' && (
                        <>
                            <button
                                className="btn btn-success btn-xs"
                                onClick={onComplete}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="loading loading-spinner loading-xs" />
                                ) : (
                                    nl.complete
                                )}
                            </button>
                            <button
                                className="btn btn-warning btn-xs"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                {nl.cancel}
                            </button>
                        </>
                    )}
                    <button
                        className="btn btn-error btn-xs"
                        onClick={onDelete}
                        disabled={loading}
                    >
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    );
}

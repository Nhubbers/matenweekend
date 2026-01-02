import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout';
import { ParticipantList } from '@/components/activities';
import { LoadingSpinner, ErrorMessage, Avatar, ConfirmDialog } from '@/components/common';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import { useParticipations } from '@/hooks/useParticipations';
import {
    formatDateFull,
    getActivityImageUrl,
    getDisplayName,
    getStatusBadgeClass,
    getStatusLabel,
    cn,
} from '@/lib/utils';
import { nl } from '@/lib/translations';
import type { Activity } from '@/types';

export function ActivityDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const [activity, setActivity] = useState<Activity | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const {
        participations,
        isJoined,
        join,
        leave,
        removeParticipant,
    } = useParticipations(id);

    useEffect(() => {
        const fetchActivity = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const result = await pb.collection('activities').getOne<Activity>(id, {
                    expand: 'creator',
                });
                setActivity(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load activity');
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [id]);

    const handleJoin = async () => {
        try {
            setActionLoading(true);
            await join();
        } catch (err) {
            console.error('Failed to join:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeave = async () => {
        try {
            setActionLoading(true);
            await leave();
        } catch (err) {
            console.error('Failed to leave:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleComplete = async () => {
        if (!activity) return;
        try {
            setActionLoading(true);
            await pb.collection('activities').update(activity.id, { status: 'completed' });
            setActivity({ ...activity, status: 'completed' });
        } catch (err) {
            console.error('Failed to complete:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!activity) return;
        try {
            setActionLoading(true);
            await pb.collection('activities').update(activity.id, { status: 'cancelled' });
            setActivity({ ...activity, status: 'cancelled' });
        } catch (err) {
            console.error('Failed to cancel:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!activity) return;
        try {
            setActionLoading(true);
            await pb.collection('activities').delete(activity.id);
            navigate('/activities');
        } catch (err) {
            console.error('Failed to delete:', err);
        } finally {
            setActionLoading(false);
            setDeleteConfirm(false);
        }
    };

    if (loading) {
        return (
            <PageContainer>
                <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                </div>
            </PageContainer>
        );
    }

    if (error || !activity) {
        return (
            <PageContainer>
                <ErrorMessage message={error || 'Activity not found'} />
            </PageContainer>
        );
    }

    const creator = activity.expand?.creator;
    const imageUrl = getActivityImageUrl(activity);
    const isOpen = activity.status === 'open';
    const isFull =
        activity.max_participants > 0 && participations.length >= activity.max_participants;

    return (
        <PageContainer>
            <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate(-1)}>
                ← {nl.back}
            </button>

            {activity.image && (
                <div className="rounded-lg overflow-hidden mb-4">
                    <img
                        src={imageUrl}
                        alt={activity.title}
                        className="w-full h-48 object-cover"
                    />
                </div>
            )}

            <h1 className="text-2xl font-bold mb-2">{activity.title}</h1>

            <div className="space-y-2 text-base-content/80 mb-4">
                <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{formatDateFull(activity.start_time)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Avatar user={creator} size="sm" />
                    <span>
                        {nl.createdBy}: {getDisplayName(creator)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span>🏷️</span>
                    <span>Status: </span>
                    <span className={cn('badge', getStatusBadgeClass(activity.status))}>
                        {getStatusLabel(activity.status)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span>⭐</span>
                    <span>{activity.points_participant} punten voor deelnemers</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>⭐</span>
                    <span>{activity.points_creator} punten voor organisator</span>
                </div>
            </div>

            <div className="divider" />

            <div className="mb-4">
                <h2 className="font-semibold mb-2">{nl.description}:</h2>
                <p className="text-base-content/90 whitespace-pre-wrap">{activity.description}</p>
            </div>

            <div className="divider" />

            <ParticipantList
                participations={participations}
                maxParticipants={activity.max_participants}
                onRemove={removeParticipant}
                showRemoveButton={isAdmin}
            />

            {isOpen && (
                <div className="mt-6">
                    {isJoined ? (
                        <button
                            className="btn btn-outline btn-error w-full"
                            onClick={handleLeave}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <span className="loading loading-spinner loading-sm" />
                            ) : (
                                nl.leave
                            )}
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary w-full"
                            onClick={handleJoin}
                            disabled={actionLoading || isFull}
                        >
                            {actionLoading ? (
                                <span className="loading loading-spinner loading-sm" />
                            ) : isFull ? (
                                'Activiteit is vol'
                            ) : (
                                nl.join
                            )}
                        </button>
                    )}
                </div>
            )}

            {isAdmin && (
                <div className="mt-6 space-y-2">
                    <div className="divider">Admin</div>
                    <div className="flex flex-wrap gap-2">
                        {isOpen && (
                            <>
                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={handleComplete}
                                    disabled={actionLoading}
                                >
                                    {nl.complete}
                                </button>
                                <button
                                    className="btn btn-warning btn-sm"
                                    onClick={handleCancel}
                                    disabled={actionLoading}
                                >
                                    {nl.cancel}
                                </button>
                            </>
                        )}
                        <button
                            className="btn btn-error btn-sm"
                            onClick={() => setDeleteConfirm(true)}
                            disabled={actionLoading}
                        >
                            {nl.delete}
                        </button>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteConfirm}
                title={nl.delete}
                message={`${nl.areYouSure} "${activity.title}" verwijderen?`}
                confirmLabel={nl.delete}
                cancelLabel={nl.cancel}
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm(false)}
                variant="danger"
            />
        </PageContainer>
    );
}

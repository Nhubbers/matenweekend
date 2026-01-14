import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout';
import { ParticipantList, EditActivityModal } from '@/components/activities';
import { LoadingSpinner, ErrorMessage, Avatar, ConfirmDialog } from '@/components/common';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import { useParticipations } from '@/hooks/useParticipations';
import { useActivities } from '@/hooks/useActivities';
import {
    formatDateRange,
    getActivityImageUrl,
    getCompletionImageUrl,
    getDisplayName,
    getStatusBadgeClass,
    getStatusLabel,
    cn,
} from '@/lib/utils';
import { downloadActivityIcs } from '@/lib/ics';
import { nl } from '@/lib/translations';
import type { Activity } from '@/types';

export function ActivityDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAdmin, user } = useAuth();

    const [activity, setActivity] = useState<Activity | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [reopenConfirm, setReopenConfirm] = useState(false);
    const [completeConfirm, setCompleteConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // No-show completion mode state
    const [isCompletingMode, setIsCompletingMode] = useState(false);
    const [localNoshows, setLocalNoshows] = useState<Record<string, boolean>>({});

    // Completion image state
    const [completionImage, setCompletionImage] = useState<File | null>(null);
    const [completionImagePreview, setCompletionImagePreview] = useState<string | null>(null);

    const { reopenActivity, completeActivity } = useActivities();

    const {
        participations,
        isJoined,
        join,
        leave,
        removeParticipant,
        markNoshows,
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
        } catch (err: unknown) {
            console.error('Failed to join:', err);
            // Show warning to user if join fails (e.g. backend restriction)
            const message = err instanceof Error ? err.message : nl.cannotJoinYourOwn;
            alert(message);
        } finally {
            setActionLoading(false);
        }
    };

    // Debugging creator check
    useEffect(() => {
        if (activity && user) {
            console.log('Creator Check Debug:', {
                userId: user.id,
                activityCreator: activity.creator,
                isMatch: user.id === activity.creator
            });
        }
    }, [activity, user]);

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

    // Enter completion mode - allows organizer to mark no-shows
    const handleStartComplete = () => {
        if (!activity) return;

        // Check if activity has already happened (end_time or start_time must be in the past)
        // Admins can bypass this check for testing purposes
        const now = new Date();
        const endTime = activity.end_time ? new Date(activity.end_time) : new Date(activity.start_time);

        if (endTime > now && !isAdmin) {
            alert('Kan activiteit niet afronden omdat deze nog niet is afgelopen.');
            return;
        }

        // If no participants, show warning confirmation instead of completion mode
        if (participations.length === 0) {
            setCompleteConfirm(true);
            return;
        }

        // Initialize local noshows state from existing participation data
        const initialNoshows: Record<string, boolean> = {};
        participations.forEach(p => {
            initialNoshows[p.id] = p.noshow || false;
        });
        setLocalNoshows(initialNoshows);
        setIsCompletingMode(true);
    };

    // Toggle no-show status for a participant
    const handleToggleNoshow = (participationId: string, noshow: boolean) => {
        setLocalNoshows(prev => ({
            ...prev,
            [participationId]: noshow
        }));
    };

    // Handle completion image selection
    const handleCompletionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCompletionImage(file);
            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setCompletionImagePreview(previewUrl);
        }
    };

    // Cancel completion mode
    const handleCancelComplete = () => {
        setIsCompletingMode(false);
        setLocalNoshows({});
        setCompletionImage(null);
        setCompletionImagePreview(null);
    };

    // Confirm completion with no-shows marked
    const handleConfirmComplete = async () => {
        if (!activity) return;

        // Require completion image
        if (!completionImage) {
            alert(nl.completionPhotoRequired);
            return;
        }

        try {
            setActionLoading(true);

            // First, save no-show statuses to participations
            await markNoshows(localNoshows);

            // Then complete the activity with proof image (triggers point awarding in backend)
            const updated = await completeActivity(activity, completionImage, isAdmin);

            setActivity({ ...activity, ...updated, status: 'completed' });
            setIsCompletingMode(false);
            setLocalNoshows({});
            setCompletionImage(null);
            setCompletionImagePreview(null);
        } catch (err) {
            console.error('Failed to complete:', err);
            alert(err instanceof Error ? err.message : 'Failed to complete activity');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle completing with no participants - no photo needed since there's nothing to prove
    const handleCompleteNoParticipants = async () => {
        if (!activity) return;

        try {
            setActionLoading(true);
            // No photo required for activities with no participants
            const updated = await completeActivity(activity, undefined, isAdmin);
            setActivity({ ...activity, ...updated, status: 'completed' });
        } catch (err) {
            console.error('Failed to complete:', err);
        } finally {
            setActionLoading(false);
            setCompleteConfirm(false);
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

    const handleReopen = async () => {
        if (!activity) return;
        try {
            setActionLoading(true);
            const updated = await reopenActivity(activity);
            setActivity({ ...activity, status: updated.status });
        } catch (err) {
            console.error('Failed to reopen:', err);
        } finally {
            setActionLoading(false);
            setReopenConfirm(false);
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
    const isCreator = user?.id === activity.creator;
    const canManage = isAdmin || isCreator;

    const imageUrl = getActivityImageUrl(activity);
    const isOpen = activity.status === 'open';
    const isFull =
        activity.max_participants > 0 && participations.length >= activity.max_participants;

    // Count how many are marked as no-show in local state
    const noshowCount = Object.values(localNoshows).filter(Boolean).length;

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
                    <span>{formatDateRange(activity.start_time, activity.end_time)}</span>
                    <button
                        onClick={() => downloadActivityIcs(activity)}
                        className="btn btn-ghost btn-xs text-primary tooltip tooltip-right"
                        data-tip="Zet in agenda"
                    >
                        + 📅
                    </button>
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
                    <span>{activity.points_creator} punten + {activity.points_organizer_per_participant || 0} per deelnemer voor organisator</span>
                </div>
            </div>

            <div className="divider" />

            <div className="mb-4">
                <h2 className="font-semibold mb-2">{nl.description}:</h2>
                <p className="text-base-content/90 whitespace-pre-wrap">{activity.description}</p>
            </div>

            {/* Display proof photo for completed activities */}
            {activity.status === 'completed' && activity.completion_image && (
                <div className="mb-4">
                    <h2 className="font-semibold mb-2">📸 {nl.proofPhoto}</h2>
                    <div className="rounded-lg overflow-hidden">
                        <img
                            src={getCompletionImageUrl(activity)}
                            alt="Bewijs foto"
                            className="w-full object-cover rounded-lg"
                        />
                    </div>
                </div>
            )}

            <div className="divider" />

            {/* Completion mode header */}
            {isCompletingMode && (
                <div className="alert alert-info mb-4">
                    <div>
                        <h3 className="font-bold">🎯 {nl.completingActivity}</h3>
                        <p className="text-sm">{nl.noshowExplanation}</p>
                    </div>
                </div>
            )}

            <ParticipantList
                participations={participations}
                maxParticipants={activity.max_participants}
                onRemove={removeParticipant}
                showRemoveButton={isAdmin && !isCompletingMode}
                isCompletingActivity={isCompletingMode}
                localNoshows={localNoshows}
                onToggleNoshow={handleToggleNoshow}
            />

            {/* Completion mode actions */}
            {isCompletingMode && (
                <div className="mt-6 space-y-3">
                    {noshowCount > 0 && (
                        <div className="alert alert-warning">
                            <span>⚠️ {noshowCount} {noshowCount === 1 ? 'deelnemer' : 'deelnemers'} gemarkeerd als no-show. Zij krijgen -{activity.points_participant} strafpunten.</span>
                        </div>
                    )}

                    {/* Completion photo upload */}
                    <div className="card bg-base-200 p-4">
                        <label className="block font-semibold mb-1">
                            📸 {nl.uploadCompletionPhoto}
                        </label>
                        <p className="text-sm text-base-content/70 mb-3">{nl.completionPhotoHint}</p>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleCompletionImageChange}
                            className="file-input file-input-bordered w-full"
                        />

                        {completionImagePreview && (
                            <div className="mt-3 rounded-lg overflow-hidden">
                                <img
                                    src={completionImagePreview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover"
                                />
                                <p className="text-sm text-success mt-1">✓ {nl.photoSelected}</p>
                            </div>
                        )}

                        {!completionImage && (
                            <p className="text-sm text-error mt-2">* {nl.completionPhotoRequired}</p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            className="btn btn-success flex-1"
                            onClick={handleConfirmComplete}
                            disabled={actionLoading || !completionImage}
                        >
                            {actionLoading ? (
                                <span className="loading loading-spinner loading-sm" />
                            ) : (
                                `✅ ${nl.confirmComplete}`
                            )}
                        </button>
                        <button
                            className="btn btn-ghost"
                            onClick={handleCancelComplete}
                            disabled={actionLoading}
                        >
                            {nl.cancelComplete}
                        </button>
                    </div>
                </div>
            )}

            {/* Normal join/leave buttons (hidden in completion mode) */}
            {isOpen && !isCompletingMode && (
                <div className="mt-6">
                    {isCreator ? (
                        <button className="btn btn-disabled w-full" disabled>
                            {nl.youAreTheOrganizer}
                        </button>
                    ) : isJoined ? (
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

            {/* Management buttons (hidden in completion mode) */}
            {canManage && !isCompletingMode && (
                <div className="mt-6 space-y-2">
                    <div className="divider">Beheer</div>
                    <div className="flex flex-wrap gap-2">
                        {isOpen && (
                            <>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setIsEditing(true)}
                                    disabled={actionLoading}
                                >
                                    ✏️ {nl.edit}
                                </button>
                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={handleStartComplete}
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
                        {!isOpen && activity.status === 'completed' && (
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setReopenConfirm(true)}
                                disabled={actionLoading}
                            >
                                Heropenen
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                className="btn btn-error btn-sm"
                                onClick={() => setDeleteConfirm(true)}
                                disabled={actionLoading}
                            >
                                {nl.delete}
                            </button>
                        )}
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

            <ConfirmDialog
                isOpen={reopenConfirm}
                title="Activiteit Heropenen"
                message="Weet je het zeker? Als je heropent, worden de toegekende punten van alle deelnemers weer ingetrokken!"
                confirmLabel="Heropenen & Punten Intrekken"
                cancelLabel={nl.cancel}
                onConfirm={handleReopen}
                onCancel={() => setReopenConfirm(false)}
                variant="danger"
            />

            <ConfirmDialog
                isOpen={completeConfirm}
                title="Geen deelnemers"
                message="Er zijn geen deelnemers ingeschreven. Als je deze activiteit afrondt, krijgt de organisator GEEN punten. Weet je het zeker?"
                confirmLabel="Toch afronden"
                cancelLabel={nl.cancel}
                onConfirm={handleCompleteNoParticipants}
                onCancel={() => setCompleteConfirm(false)}
                variant="warning"
            />

            {isEditing && (
                <EditActivityModal
                    activity={activity}
                    isOpen={isEditing}
                    onClose={() => setIsEditing(false)}
                    onSuccess={(updated) => {
                        setActivity({ ...activity, ...updated });
                        setIsEditing(false);
                    }}
                />
            )}
        </PageContainer>
    );
}

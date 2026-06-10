import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout';
import {
    ParticipantList,
    ActivityFormModal,
    CoOrganizerManager,
    ActivityDetailHeader,
    ActivityDetailDescription,
    ActivityCompletionMode,
    ActivityManageActions,
} from '@/components/activities';
import { LoadingSpinner, ErrorMessage, ConfirmDialog } from '@/components/common';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useParticipations } from '@/hooks/useParticipations';
import { useActivities } from '@/hooks/useActivities';
import { useActivity } from '@/hooks/useActivity';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { getCompletionImageUrl } from '@/lib/utils';
import { nl } from '@/lib/translations';
import { haptics } from '@/lib/haptics';
import type { Activity, User } from '@/types';

export function ActivityDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAdmin, user } = useAuth();
    const toast = useToast();

    const { activity, loading, error, setActivity } = useActivity(id);
    useSwipeBack();
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [reopenConfirm, setReopenConfirm] = useState(false);
    const [completeConfirm, setCompleteConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);

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
        addParticipant,
        removeParticipant,
        markNoshows,
    } = useParticipations(id);

    // Fetch all users if admin
    useEffect(() => {
        if (isAdmin) {
            const fetchUsers = async () => {
                try {
                    const result = await pb.collection('users').getFullList<User>({
                        sort: 'name',
                    });
                    setAllUsers(result);
                } catch (err) {
                    console.error('Failed to fetch users:', err);
                }
            };
            fetchUsers();
        }
    }, [isAdmin]);

    const handleJoin = async () => {
        try {
            setActionLoading(true);
            await join();
            toast.success('Je doet mee! 🎉');
            haptics.success();
        } catch (err: unknown) {
            console.error('Failed to join:', err);
            const message = err instanceof Error ? err.message : nl.cannotJoinYourOwn;
            toast.error(message);
            haptics.error();
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeave = async () => {
        try {
            setActionLoading(true);
            await leave();
            toast.success('Je bent afgemeld.');
            haptics.medium();
        } catch (err) {
            console.error('Failed to leave:', err);
            toast.error('Afmelden mislukt.');
            haptics.error();
        } finally {
            setActionLoading(false);
        }
    };

    // Enter completion mode - allows organizer to mark no-shows
    const handleStartComplete = () => {
        if (!activity) return;

        const now = new Date();
        const endTime = activity.end_time ? new Date(activity.end_time) : new Date(activity.start_time);

        if (endTime > now && !isAdmin) {
            toast.warning(nl.activityNotYetFinished);
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

    const handleToggleNoshow = (participationId: string, noshow: boolean) => {
        setLocalNoshows(prev => ({
            ...prev,
            [participationId]: noshow
        }));
    };

    const handleCompletionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCompletionImage(file);
            const previewUrl = URL.createObjectURL(file);
            setCompletionImagePreview(previewUrl);
        }
    };

    const handleCancelComplete = () => {
        setIsCompletingMode(false);
        setLocalNoshows({});
        setCompletionImage(null);
        setCompletionImagePreview(null);
    };

    const handleConfirmComplete = async () => {
        if (!activity) return;

        if (!completionImage) {
            toast.warning(nl.completionPhotoRequired);
            haptics.medium();
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
            toast.success('Activiteit succesvol afgerond! 🏆');
            haptics.success();
        } catch (err) {
            console.error('Failed to complete:', err);
            toast.error(err instanceof Error ? err.message : 'Afronden mislukt');
            haptics.error();
        } finally {
            setActionLoading(false);
        }
    };

    const handleCompleteNoParticipants = async () => {
        if (!activity) return;

        try {
            setActionLoading(true);
            const updated = await completeActivity(activity, undefined, isAdmin);
            setActivity({ ...activity, ...updated, status: 'completed' });
            toast.success('Activiteit afgerond zonder deelnemers.');
            haptics.success();
        } catch (err) {
            console.error('Failed to complete:', err);
            toast.error('Afronden mislukt');
            haptics.error();
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
            toast.success('Activiteit geannuleerd.');
        } catch (err) {
            console.error('Failed to cancel:', err);
            toast.error('Annuleren mislukt.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!activity) return;
        try {
            setActionLoading(true);
            await pb.collection('activities').delete(activity.id);
            toast.success('Activiteit verwijderd.');
            navigate('/activities');
        } catch (err) {
            console.error('Failed to delete:', err);
            toast.error('Verwijderen mislukt.');
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
            toast.success('Activiteit heropend.');
        } catch (err) {
            console.error('Failed to reopen:', err);
            toast.error('Heropenen mislukt.');
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

    const isCreator = user?.id === activity.creator;
    const isCoOrganizer = user && (activity.co_organizers || []).includes(user.id);
    const isOrganizer = isCreator || isCoOrganizer;
    const canManage = isAdmin || isOrganizer;

    const isOpen = activity.status === 'open';
    const isFull =
        activity.max_participants > 0 && participations.length >= activity.max_participants;

    return (
        <PageContainer>
            <button className="btn btn-ghost btn-sm mb-4 rounded-xl" onClick={() => navigate(-1)}>
                ← {nl.back}
            </button>

            <div className="space-y-6">
                <ActivityDetailHeader activity={activity} />

                <ActivityDetailDescription description={activity.description} />

                {/* Co-organizers section */}
                <CoOrganizerManager
                    activity={activity}
                    isCreator={isCreator}
                    onUpdate={() => {
                        pb.collection('activities').getOne<Activity>(activity.id, {
                            expand: 'creator,co_organizers',
                        }).then(setActivity);
                    }}
                />

                {/* Display proof photo for completed activities */}
                {activity.status === 'completed' && activity.completion_image && (
                    <div className="bg-base-200/30 border border-base-200 p-5 rounded-2xl shadow-sm">
                        <h2 className="font-bold text-lg mb-3 text-base-content flex items-center gap-2">📸 {nl.proofPhoto}</h2>
                        <div className="rounded-xl overflow-hidden max-h-80 border border-base-300">
                            <img
                                src={getCompletionImageUrl(activity)}
                                alt="Bewijs foto"
                                className="w-full object-cover rounded-xl"
                                loading="lazy"
                            />
                        </div>
                    </div>
                )}

                <div className="divider" />

                <ParticipantList
                    participations={participations}
                    maxParticipants={activity.max_participants}
                    onRemove={removeParticipant}
                    onAdd={addParticipant}
                    allUsers={allUsers}
                    showRemoveButton={isAdmin && !isCompletingMode}
                    isCompletingActivity={isCompletingMode}
                    localNoshows={localNoshows}
                    onToggleNoshow={handleToggleNoshow}
                />

                {/* Completion mode actions */}
                {isCompletingMode && (
                    <ActivityCompletionMode
                        activity={activity}
                        participations={participations}
                        localNoshows={localNoshows}
                        onToggleNoshow={handleToggleNoshow}
                        completionImage={completionImage}
                        completionImagePreview={completionImagePreview}
                        onImageChange={handleCompletionImageChange}
                        onConfirm={handleConfirmComplete}
                        onCancel={handleCancelComplete}
                        actionLoading={actionLoading}
                    />
                )}

                {/* Normal join/leave buttons (hidden in completion mode) */}
                {isOpen && !isCompletingMode && (
                    <div className="mt-6">
                        {isOrganizer ? (
                            <button className="btn btn-disabled w-full rounded-xl" disabled>
                                {isCreator ? nl.youAreTheOrganizer : nl.youAreCoOrganizer}
                            </button>
                        ) : isJoined ? (
                            <button
                                className="btn btn-outline btn-error w-full rounded-xl"
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
                                className="btn btn-primary w-full rounded-xl"
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
                    <ActivityManageActions
                        status={activity.status}
                        actionLoading={actionLoading}
                        isAdmin={isAdmin}
                        onEdit={() => setIsEditing(true)}
                        onComplete={handleStartComplete}
                        onCancel={handleCancel}
                        onReopen={() => setReopenConfirm(true)}
                        onDelete={() => setDeleteConfirm(true)}
                    />
                )}
            </div>

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
                <ActivityFormModal
                    mode="edit"
                    activity={activity}
                    isOpen={isEditing}
                    onClose={() => setIsEditing(false)}
                    onSuccess={(updated) => {
                        if (updated) {
                            setActivity(updated);
                        }
                        setIsEditing(false);
                    }}
                />
            )}
        </PageContainer>
    );
}

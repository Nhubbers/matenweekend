import { useState } from 'react';
import { Avatar, BottomSheet } from '@/components/common';
import { useToast } from '@/contexts/ToastContext';
import { useCoOrganizers } from '@/hooks/useCoOrganizers';
import { getDisplayName } from '@/lib/utils';
import { nl } from '@/lib/translations';
import type { Activity, User } from '@/types';

interface CoOrganizerManagerProps {
    activity: Activity;
    isCreator: boolean;
    onUpdate: (activity: Activity) => void;
}

export function CoOrganizerManager({ activity, isCreator, onUpdate }: CoOrganizerManagerProps) {
    const toast = useToast();
    const [showAddModal, setShowAddModal] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const { loading, addCoOrganizer, removeCoOrganizer, getAvailableUsers } = useCoOrganizers(activity.id);

    const coOrganizers = activity.expand?.co_organizers || [];
    const isOpen = activity.status === 'open';

    const handleOpenAddModal = async () => {
        setLoadingUsers(true);
        setShowAddModal(true);
        try {
            const users = await getAvailableUsers(activity);
            setAvailableUsers(users);
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleAddCoOrganizer = async (userId: string) => {
        try {
            const updated = await addCoOrganizer(userId, activity);
            // Refetch with expanded relations
            onUpdate(updated);
            setShowAddModal(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to add co-organizer');
        }
    };

    const handleRemoveCoOrganizer = async (userId: string) => {
        if (!confirm('Weet je zeker dat je deze mede-organisator wilt verwijderen?')) return;

        try {
            const updated = await removeCoOrganizer(userId, activity);
            onUpdate(updated);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to remove co-organizer');
        }
    };

    // Don't render anything if there are no co-organizers and user is not creator
    if (coOrganizers.length === 0 && !isCreator) {
        return null;
    }

    return (
        <div className="mt-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
                👥 {nl.coOrganizers}
                {coOrganizers.length > 0 && (
                    <span className="badge badge-sm badge-ghost">{coOrganizers.length}</span>
                )}
            </h3>

            {/* List of co-organizers */}
            {coOrganizers.length > 0 ? (
                <div className="space-y-2">
                    {coOrganizers.map((coOrg) => (
                        <div key={coOrg.id} className="flex items-center justify-between bg-base-200 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                                <Avatar user={coOrg} size="sm" />
                                <span>{getDisplayName(coOrg)}</span>
                            </div>
                            {isCreator && isOpen && (
                                <button
                                    className="btn btn-ghost btn-xs text-error"
                                    onClick={() => handleRemoveCoOrganizer(coOrg.id)}
                                    disabled={loading}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-base-content/60">Geen mede-organisatoren</p>
            )}

            {/* Add button - only for creator when activity is open */}
            {isCreator && isOpen && (
                <button
                    className="btn btn-outline btn-sm mt-3"
                    onClick={handleOpenAddModal}
                    disabled={loading}
                >
                    + {nl.addCoOrganizer}
                </button>
            )}

            {/* Add Co-Organizer Modal */}
            <BottomSheet
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title={nl.addCoOrganizer}
            >
                {loadingUsers ? (
                    <div className="flex justify-center py-4">
                        <span className="loading loading-spinner loading-md" />
                    </div>
                ) : availableUsers.length === 0 ? (
                    <p className="text-base-content/60">{nl.noUsersAvailable}</p>
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {availableUsers.map((user) => (
                            <button
                                key={user.id}
                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors text-left"
                                onClick={() => handleAddCoOrganizer(user.id)}
                                disabled={loading}
                            >
                                <Avatar user={user} size="sm" />
                                <span>{getDisplayName(user)}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex justify-end mt-4">
                    <button
                        className="btn btn-ghost"
                        onClick={() => setShowAddModal(false)}
                        disabled={loading}
                    >
                        {nl.close}
                    </button>
                </div>
            </BottomSheet>
        </div>
    );
}

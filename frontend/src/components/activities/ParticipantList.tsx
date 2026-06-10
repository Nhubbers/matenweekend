import { useState } from 'react';
import { Avatar } from '@/components/common';
import { getDisplayName } from '@/lib/utils';
import { nl } from '@/lib/translations';
import { useAuth } from '@/contexts/AuthContext';
import type { Participation, User } from '@/types';

interface ParticipantListProps {
    participations: Participation[];
    maxParticipants?: number;
    onRemove?: (participationId: string) => void;
    onAdd?: (userId: string) => Promise<any>;
    allUsers?: User[];
    showRemoveButton?: boolean;
    // No-show completion mode props
    isCompletingActivity?: boolean;
    localNoshows?: Record<string, boolean>;
    onToggleNoshow?: (participationId: string, noshow: boolean) => void;
}

export function ParticipantList({
    participations,
    maxParticipants = 0,
    onRemove,
    onAdd,
    allUsers = [],
    showRemoveButton = false,
    isCompletingActivity = false,
    localNoshows = {},
    onToggleNoshow,
}: ParticipantListProps) {
    const { isAdmin } = useAuth();
    const [selectedUserId, setSelectedUserId] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const participantUserIds = new Set(participations.map(p => p.user));
    const availableUsers = allUsers.filter(u => !participantUserIds.has(u.id));

    const handleAdd = async () => {
        if (!selectedUserId || !onAdd) return;
        try {
            setIsAdding(true);
            await onAdd(selectedUserId);
            setSelectedUserId('');
        } catch (err) {
            console.error('Failed to add participant:', err);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                    {nl.participants} ({participations.length}
                    {maxParticipants > 0 ? `/${maxParticipants}` : ''}):
                </h3>
            </div>

            {!isCompletingActivity && isAdmin && onAdd && availableUsers.length > 0 && (
                <div className="flex gap-2 items-end bg-base-200 p-3 rounded-lg border border-base-300">
                    <div className="form-control flex-1">
                        <label className="label py-1">
                            <span className="label-text text-xs font-bold">Deelnemer toevoegen</span>
                        </label>
                        <select
                            className="select select-bordered select-sm w-full"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            disabled={isAdding}
                        >
                            <option value="">Selecteer gebruiker...</option>
                            {availableUsers.map(u => (
                                <option key={u.id} value={u.id}>
                                    {getDisplayName(u)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleAdd}
                        disabled={!selectedUserId || isAdding}
                    >
                        {isAdding ? <span className="loading loading-spinner loading-xs" /> : 'Toevoegen'}
                    </button>
                </div>
            )}

            {isCompletingActivity && participations.length > 0 && (
                <div className="alert alert-warning text-sm py-2">
                    <span>⚠️ {nl.noshowExplanation}</span>
                </div>
            )}

            {participations.length === 0 ? (
                <p className="text-base-content/70 text-sm">Nog geen deelnemers</p>
            ) : (
                <div className="space-y-2">
                    {participations.map((participation) => {
                        const user = participation.expand?.user;
                        const isNoshow = localNoshows[participation.id] ?? participation.noshow ?? false;

                        return (
                            <div
                                key={participation.id}
                                className={`flex items-center justify-between gap-2 p-2 rounded-lg ${isCompletingActivity && isNoshow
                                        ? 'bg-error/20 border border-error/30'
                                        : 'bg-base-200'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Avatar user={user} size="sm" />
                                    <span className={`text-sm ${isCompletingActivity && isNoshow ? 'text-error line-through' : ''}`}>
                                        {getDisplayName(user)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* No-show checkbox in completion mode */}
                                    {isCompletingActivity && onToggleNoshow && (
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <span className="text-xs text-error font-medium">{nl.noshow}</span>
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-error checkbox-sm"
                                                checked={isNoshow}
                                                onChange={(e) => onToggleNoshow(participation.id, e.target.checked)}
                                            />
                                        </label>
                                    )}

                                    {/* Remove button (only in normal mode, not completion mode) */}
                                    {!isCompletingActivity && showRemoveButton && isAdmin && onRemove && (
                                        <button
                                            className="btn btn-ghost btn-xs text-error"
                                            onClick={() => onRemove(participation.id)}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

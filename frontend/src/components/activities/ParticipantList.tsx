import { Avatar } from '@/components/common';
import { getDisplayName } from '@/lib/utils';
import { nl } from '@/lib/translations';
import { useAuth } from '@/contexts/AuthContext';
import type { Participation } from '@/types';

interface ParticipantListProps {
    participations: Participation[];
    maxParticipants?: number;
    onRemove?: (participationId: string) => void;
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
    showRemoveButton = false,
    isCompletingActivity = false,
    localNoshows = {},
    onToggleNoshow,
}: ParticipantListProps) {
    const { isAdmin } = useAuth();

    return (
        <div className="space-y-2">
            <h3 className="font-semibold">
                {nl.participants} ({participations.length}
                {maxParticipants > 0 ? `/${maxParticipants}` : ''}):
            </h3>

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

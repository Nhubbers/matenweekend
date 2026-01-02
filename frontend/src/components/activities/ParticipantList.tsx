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
}

export function ParticipantList({
    participations,
    maxParticipants = 0,
    onRemove,
    showRemoveButton = false,
}: ParticipantListProps) {
    const { isAdmin } = useAuth();

    return (
        <div className="space-y-2">
            <h3 className="font-semibold">
                {nl.participants} ({participations.length}
                {maxParticipants > 0 ? `/${maxParticipants}` : ''}):
            </h3>

            {participations.length === 0 ? (
                <p className="text-base-content/70 text-sm">Nog geen deelnemers</p>
            ) : (
                <div className="space-y-2">
                    {participations.map((participation) => {
                        const user = participation.expand?.user;
                        return (
                            <div
                                key={participation.id}
                                className="flex items-center justify-between gap-2 p-2 bg-base-200 rounded-lg"
                            >
                                <div className="flex items-center gap-2">
                                    <Avatar user={user} size="sm" />
                                    <span className="text-sm">{getDisplayName(user)}</span>
                                </div>
                                {showRemoveButton && isAdmin && onRemove && (
                                    <button
                                        className="btn btn-ghost btn-xs text-error"
                                        onClick={() => onRemove(participation.id)}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

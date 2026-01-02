import { Link } from 'react-router-dom';
import { Avatar } from '@/components/common';
import { formatDate, getActivityImageUrl, getDisplayName, getStatusBadgeClass, getStatusLabel, cn } from '@/lib/utils';
import { nl } from '@/lib/translations';
import type { Activity, Participation } from '@/types';

interface ActivityCardProps {
    activity: Activity;
    participations: Participation[];
    isJoined: boolean;
    onJoin?: () => void;
    onLeave?: () => void;
    loading?: boolean;
}

export function ActivityCard({
    activity,
    participations,
    isJoined,
    onJoin,
    onLeave,
    loading,
}: ActivityCardProps) {
    const creator = activity.expand?.creator;
    const imageUrl = getActivityImageUrl(activity, '400x300');
    const participantCount = participations.length;
    const maxParticipants = activity.max_participants || 0;
    const isFull = maxParticipants > 0 && participantCount >= maxParticipants;
    const isOpen = activity.status === 'open';

    return (
        <div className="card bg-base-200 shadow-xl">
            {activity.image && (
                <figure className="h-48">
                    <img
                        src={imageUrl}
                        alt={activity.title}
                        className="w-full h-full object-cover"
                    />
                </figure>
            )}
            <div className="card-body p-4">
                <div className="flex items-start justify-between gap-2">
                    <Link to={`/activities/${activity.id}`} className="flex-1">
                        <h2 className="card-title text-lg hover:text-primary transition-colors">
                            {activity.title}
                        </h2>
                    </Link>
                    <div className={cn('badge', getStatusBadgeClass(activity.status))}>
                        {getStatusLabel(activity.status)}
                    </div>
                </div>

                <div className="text-sm text-base-content/70 space-y-1">
                    <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{formatDate(activity.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Avatar user={creator} size="sm" />
                        <span>{getDisplayName(creator)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>👥</span>
                        <span>
                            {participantCount}
                            {maxParticipants > 0 ? `/${maxParticipants}` : ''} {nl.participants}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>⭐</span>
                        <span>{activity.points_participant} {nl.points}</span>
                    </div>
                </div>

                {isOpen && (
                    <div className="card-actions justify-end mt-2">
                        {isJoined ? (
                            <button
                                className="btn btn-outline btn-error btn-sm"
                                onClick={onLeave}
                                disabled={loading}
                            >
                                {loading ? <span className="loading loading-spinner loading-xs" /> : nl.leave}
                            </button>
                        ) : (
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={onJoin}
                                disabled={loading || isFull}
                            >
                                {loading ? (
                                    <span className="loading loading-spinner loading-xs" />
                                ) : isFull ? (
                                    'Vol'
                                ) : (
                                    nl.join
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

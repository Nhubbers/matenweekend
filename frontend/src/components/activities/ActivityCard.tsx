import { Link } from 'react-router-dom';
import { Avatar } from '@/components/common';
import { formatDateRange, getActivityImageUrl, getDisplayName, getStatusBadgeClass, getStatusLabel, cn } from '@/lib/utils';
import { downloadActivityIcs } from '@/lib/ics';
import { nl } from '@/lib/translations';
import { useAuth } from '@/contexts/AuthContext';
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
    const { user } = useAuth();
    const creator = activity.expand?.creator;
    const imageUrl = getActivityImageUrl(activity, '400x300');
    const participantCount = participations.length;
    const maxParticipants = activity.max_participants || 0;
    const isFull = maxParticipants > 0 && participantCount >= maxParticipants;
    const isOpen = activity.status === 'open';

    const isCreator = user?.id === activity.creator;
    const isCoOrganizer = user && (activity.co_organizers || []).includes(user.id);
    const isOrganizer = isCreator || isCoOrganizer;

    return (
        <div className="card bg-base-200 shadow-xl">
            {activity.image && (
                <figure className="h-48">
                    <img
                        src={imageUrl}
                        alt={activity.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
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
                        <span>{formatDateRange(activity.start_time, activity.end_time)}</span>
                        <button
                            onClick={(e) => {
                                e.preventDefault(); // Prevent navigating to detail page if inside a Link
                                downloadActivityIcs(activity);
                            }}
                            className="btn btn-ghost btn-xs text-primary tooltip tooltip-right px-1 min-h-0 h-6"
                            data-tip="Zet in agenda"
                        >
                            + 📅
                        </button>
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
                        {isOrganizer ? (
                            <button
                                className="btn btn-ghost btn-sm text-base-content/50 cursor-default"
                                disabled
                            >
                                {isCreator ? 'Organisator' : 'Mede-organisator'}
                            </button>
                        ) : isJoined ? (
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

import { Avatar } from '@/components/common';
import { formatDateRange, getActivityImageUrl, getStatusBadgeClass, getStatusLabel, cn, getDisplayName } from '@/lib/utils';
import { downloadActivityIcs } from '@/lib/ics';
import { nl } from '@/lib/translations';
import type { Activity } from '@/types';

interface ActivityDetailHeaderProps {
    activity: Activity;
}

export function ActivityDetailHeader({ activity }: ActivityDetailHeaderProps) {
    const creator = activity.expand?.creator;
    const imageUrl = getActivityImageUrl(activity);

    return (
        <div className="space-y-4">
            {activity.image && (
                <div className="rounded-2xl overflow-hidden shadow-md max-h-56 relative group">
                    <img
                        src={imageUrl}
                        alt={activity.title}
                        className="w-full h-48 sm:h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60 pointer-events-none" />
                </div>
            )}

            <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-base-content mb-3">
                    {activity.title}
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-base-content/80 bg-base-200/50 p-4 rounded-2xl border border-base-200">
                    <div className="flex items-center gap-3">
                        <span className="text-lg">📅</span>
                        <div className="flex flex-col">
                            <span className="font-semibold text-base-content">Datum & Tijd</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs sm:text-sm">{formatDateRange(activity.start_time, activity.end_time)}</span>
                                <button
                                    onClick={() => downloadActivityIcs(activity)}
                                    className="btn btn-ghost btn-circle btn-xs text-primary hover:bg-primary/10"
                                    title="Zet in agenda"
                                >
                                    📅
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Avatar user={creator} size="sm" className="ring-2 ring-primary/20" />
                        <div className="flex flex-col">
                            <span className="font-semibold text-base-content">{nl.organizer}</span>
                            <span className="text-xs sm:text-sm">{getDisplayName(creator)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-lg">🏷️</span>
                        <div className="flex flex-col">
                            <span className="font-semibold text-base-content">Status</span>
                            <span className={cn('badge badge-sm mt-0.5 font-bold', getStatusBadgeClass(activity.status))}>
                                {getStatusLabel(activity.status)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-lg">⭐</span>
                        <div className="flex flex-col">
                            <span className="font-semibold text-base-content">Punten</span>
                            <span className="text-xs sm:text-sm">
                                {activity.points_participant} pt ({activity.points_creator} + {activity.points_organizer_per_participant || 0}/deelnemer voor org.)
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { format, formatDistanceToNow, isAfter, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { pb } from './pocketbase';
import type { Activity, User } from '@/types';

// Format a date string for display
export function formatDate(dateString: string): string {
    const date = parseISO(dateString);
    return format(date, 'd MMM yyyy, HH:mm', { locale: nl });
}

// Format a date string with full weekday
export function formatDateFull(dateString: string): string {
    const date = parseISO(dateString);
    return format(date, "EEEE d MMMM yyyy, HH:mm", { locale: nl });
}

// Format relative time (e.g., "2 uur geleden")
export function formatRelativeTime(dateString: string): string {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: nl });
}

// Check if an activity is in the future
export function isUpcoming(activity: Activity): boolean {
    return isAfter(parseISO(activity.start_time), new Date());
}

// Get activity image URL with thumbnail
export function getActivityImageUrl(activity: Activity, thumb?: string): string {
    if (!activity.image) {
        return '/placeholder-activity.jpg';
    }
    return pb.files.getUrl(activity, activity.image, thumb ? { thumb } : undefined);
}

// Get user avatar URL
export function getUserAvatarUrl(user: User | undefined): string | null {
    if (!user?.avatar) {
        return null;
    }
    return pb.files.getUrl(user, user.avatar);
}

// Get display name for a user (name or email)
export function getDisplayName(user: User | undefined): string {
    if (!user) return 'Onbekend';
    return user.name || user.email.split('@')[0];
}

// Get status badge color class
export function getStatusBadgeClass(status: Activity['status']): string {
    switch (status) {
        case 'open':
            return 'badge-success';
        case 'completed':
            return 'badge-neutral';
        case 'cancelled':
            return 'badge-error';
        default:
            return 'badge-neutral';
    }
}

// Get status label in Dutch
export function getStatusLabel(status: Activity['status']): string {
    switch (status) {
        case 'open':
            return 'Open';
        case 'completed':
            return 'Afgerond';
        case 'cancelled':
            return 'Geannuleerd';
        default:
            return status;
    }
}

// Classnames utility - simple version
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ');
}

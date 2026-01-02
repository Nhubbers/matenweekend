import { cn, getUserAvatarUrl, getDisplayName } from '@/lib/utils';
import type { User } from '@/types';

interface AvatarProps {
    user: User | undefined;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
};

export function Avatar({ user, size = 'md', className }: AvatarProps) {
    const avatarUrl = getUserAvatarUrl(user);
    const displayName = getDisplayName(user);

    return (
        <div className={cn('avatar placeholder', className)}>
            <div
                className={cn(
                    'rounded-full',
                    sizeClasses[size],
                    !avatarUrl && 'bg-neutral text-neutral-content'
                )}
            >
                {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="rounded-full" />
                ) : (
                    <span className={cn(size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg')}>
                        {displayName.charAt(0).toUpperCase()}
                    </span>
                )}
            </div>
        </div>
    );
}

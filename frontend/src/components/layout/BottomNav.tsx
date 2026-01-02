import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { nl } from '@/lib/translations';

const navItems = [
    { to: '/', icon: '🏠', label: nl.home },
    { to: '/activities', icon: '📋', label: nl.activities },
    { to: '/ranking', icon: '🏆', label: nl.ranking },
    { to: '/profile', icon: '👤', label: nl.profile },
];

export function BottomNav() {
    return (
        <nav className="btm-nav btm-nav-md bg-base-200 border-t border-base-300">
            {navItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                        cn(
                            'flex flex-col items-center justify-center',
                            isActive && 'active text-primary'
                        )
                    }
                >
                    <span className="text-xl">{item.icon}</span>
                    <span className="btm-nav-label text-xs">{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
}

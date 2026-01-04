import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/common';

export function Header() {
    const { isAdmin } = useAuth();

    return (
        <header className="navbar bg-base-200 border-b border-base-300 sticky top-0 z-50">
            <div className="flex-1">
                <Link to="/" className="btn btn-ghost text-xl font-bold">
                    <span className="text-2xl">🎉</span>
                    <span className="hidden sm:inline">Matenweekend</span>
                </Link>
            </div>
            <div className="flex-none gap-2">
                <ThemeToggle />
                {isAdmin && (
                    <Link to="/admin" className="btn btn-ghost btn-sm">
                        ⚙️ Admin
                    </Link>
                )}
                <Link to="/profile" className="btn btn-ghost btn-circle">
                    <span className="text-xl">👤</span>
                </Link>
            </div>
        </header>
    );
}

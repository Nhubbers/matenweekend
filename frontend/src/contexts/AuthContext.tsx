import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { pb } from '@/lib/pocketbase';
import type { User } from '@/types';

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
    showFirstLoginModal: boolean;
    dismissFirstLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Helper to get localStorage key for first login popup
const getFirstLoginKey = (userId: string) => `matenweekend_first_login_shown_${userId}`;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(pb.authStore.record as User | null);
    const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
    // Auth is checked synchronously from localStorage, so no loading state needed
    const isLoading = false;

    // Check if we should show first login modal
    const checkFirstLoginModal = async (userId: string) => {
        const key = getFirstLoginKey(userId);
        const alreadyShown = localStorage.getItem(key);

        if (alreadyShown) {
            return; // Already shown the popup in this browser
        }

        try {
            // Check if this user has a 'First Login' point transaction
            const transactions = await pb.collection('point_transactions').getList(1, 1, {
                filter: `user = "${userId}" && reason = "First Login"`,
            });

            if (transactions.totalItems > 0) {
                // User got first login bonus (just now from backend hook), show the modal
                setShowFirstLoginModal(true);
            }
        } catch (error) {
            console.error('Failed to check first login status:', error);
        }
    };

    useEffect(() => {
        // Listen for auth changes
        const unsubscribe = pb.authStore.onChange((_, record) => {
            setUser(record as User | null);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        const authData = await pb.collection('users').authWithPassword(email, password);
        setUser(authData.record as User);
        // Check for first login after successful login
        await checkFirstLoginModal(authData.record.id);
    };

    const logout = () => {
        pb.authStore.clear();
        setUser(null);
        setShowFirstLoginModal(false);
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
    };

    const dismissFirstLoginModal = () => {
        if (user) {
            localStorage.setItem(getFirstLoginKey(user.id), 'true');
        }
        setShowFirstLoginModal(false);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAdmin: user?.isAdmin ?? false,
                isLoading,
                login,
                logout,
                updateUser,
                showFirstLoginModal,
                dismissFirstLoginModal,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

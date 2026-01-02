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
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(pb.authStore.record as User | null);
    // Auth is checked synchronously from localStorage, so no loading state needed
    const isLoading = false;

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
    };

    const logout = () => {
        pb.authStore.clear();
        setUser(null);
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
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

import { PageContainer } from '@/components/layout';
import { Avatar } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { pb } from '@/lib/pocketbase';
import { useRanking, useUserTransactions } from '@/hooks/useRanking';
import { UserPointsHistory } from '@/components/ranking';
import type { User } from '@/types';
import { nl } from '@/lib/translations';
import { useEffect } from 'react';

export function ProfilePage() {
    const { user, logout, updateUser } = useAuth();
    const { totalPoints } = useUserTransactions(user?.id);
    const { rankings } = useRanking();
    const toast = useToast();

    // Fetch fresh user data to ensure we have the latest email_notifications value
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            try {
                const freshUser = await pb.collection('users').getOne<User>(user.id);
                updateUser(freshUser);
            } catch (err) {
                console.error('Failed to fetch user data:', err);
            }
        };
        fetchUserData();
    }, [user, updateUser]); // Only run when user changes

    const userRank = rankings.find((r) => r.id === user?.id)?.rank || '-';

    return (
        <PageContainer>
            <h1 className="text-2xl font-bold mb-4">{nl.profile}</h1>

            <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                    <Avatar user={user || undefined} size="lg" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <span className="text-white text-xs">Wijzigen</span>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !user) return;

                                try {
                                    const formData = new FormData();
                                    formData.append('avatar', file);

                                    const updatedUser = await pb.collection('users').update<User>(user.id, formData);
                                    updateUser(updatedUser);
                                    toast.success('Profielfoto succesvol bijgewerkt! 📸');
                                } catch (err) {
                                    console.error('Failed to update avatar:', err);
                                    toast.error('Kon profielfoto niet uploaden. Probeer het later opnieuw.');
                                }
                            }}
                        />
                    </label>
                </div>
                <h2 className="text-xl font-bold mt-3">{user?.name || user?.email}</h2>
                <p className="text-base-content/70">{user?.email}</p>

                <div className="stats stats-horizontal bg-base-200 mt-4">
                    <div className="stat place-items-center py-2 px-4">
                        <div className="stat-title text-xs">🏆 {nl.totalPoints}</div>
                        <div className="stat-value text-lg text-primary">{totalPoints}</div>
                    </div>
                    <div className="stat place-items-center py-2 px-4">
                        <div className="stat-title text-xs">📊 {nl.rank}</div>
                        <div className="stat-value text-lg">#{userRank}</div>
                    </div>
                </div>

                <div className="form-control w-full max-w-xs mt-4">
                    <label className="label cursor-pointer">
                        <span className="label-text">E-mail notificaties bij nieuwe activiteiten</span>
                        <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={user?.email_notifications ?? false} // Default to false (opt-in)
                            onChange={async (e) => {
                                if (!user) return;
                                try {
                                    const newValue = e.target.checked;
                                    const updatedUser = await pb.collection('users').update<User>(user.id, {
                                        email_notifications: newValue
                                    });
                                    updateUser(updatedUser);
                                    toast.success('Voorkeuren opgeslagen.');
                                } catch (err) {
                                    console.error('Failed to update email preferences:', err);
                                    toast.error('Kon instellingen niet opslaan.');
                                }
                            }}
                        />
                    </label>
                </div>
            </div>

            <div className="divider" />

            <h3 className="font-bold mb-3">{nl.pointsHistory}:</h3>

            {/* Replaced inline logic with component */}
            {user && <UserPointsHistory userId={user.id} />}

            <div className="divider" />

            <button className="btn btn-outline btn-error w-full" onClick={logout}>
                {nl.logout}
            </button>
        </PageContainer>
    );
}

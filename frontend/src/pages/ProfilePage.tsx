import { PageContainer } from '@/components/layout';
import { Avatar, LoadingSpinner, ErrorMessage } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { pb } from '@/lib/pocketbase';
import { useUserTransactions, useRanking } from '@/hooks/useRanking';
import type { User } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { nl } from '@/lib/translations';

export function ProfilePage() {
    const { user, logout, updateUser } = useAuth();
    const { transactions, totalPoints, loading, error } = useUserTransactions(user?.id);
    const { rankings } = useRanking();

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
                                } catch (err) {
                                    console.error('Failed to update avatar:', err);
                                    alert('Kon profielfoto niet uploaden. Probeer het later opnieuw.');
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
            </div>

            <div className="divider" />

            <h3 className="font-bold mb-3">{nl.pointsHistory}:</h3>

            {loading ? (
                <div className="flex justify-center py-8">
                    <LoadingSpinner />
                </div>
            ) : error ? (
                <ErrorMessage message={error} />
            ) : transactions.length === 0 ? (
                <p className="text-base-content/70 text-center py-4">
                    Nog geen punten verdiend
                </p>
            ) : (
                <div className="space-y-2 mb-6">
                    {transactions.map((tx) => (
                        <div
                            key={tx.id}
                            className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{tx.reason}</p>
                                <p className="text-sm text-base-content/70">
                                    {formatRelativeTime(tx.created)}
                                </p>
                            </div>
                            <span
                                className={`font-bold ${tx.amount >= 0 ? 'text-success' : 'text-error'}`}
                            >
                                {tx.amount >= 0 ? '+' : ''}
                                {tx.amount}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="divider" />

            <button className="btn btn-outline btn-error w-full" onClick={logout}>
                {nl.logout}
            </button>
        </PageContainer>
    );
}

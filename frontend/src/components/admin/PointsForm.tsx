import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAwardPoints } from '@/hooks/useRanking';
import { nl } from '@/lib/translations';
import type { User } from '@/types';

export function PointsForm() {
    const { awardPoints, loading, error } = useAwardPoints();
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [success, setSuccess] = useState(false);

    const [selectedUser, setSelectedUser] = useState('');
    const [points, setPoints] = useState(0);
    const [reason, setReason] = useState('');

    // Fetch all users by getting all point transactions and extracting unique users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const transactions = await pb.collection('point_transactions').getFullList({
                    expand: 'user',
                });

                const userMap = new Map<string, User>();
                transactions.forEach((tx) => {
                    const user = tx.expand?.user as User | undefined;
                    if (user && !userMap.has(user.id)) {
                        userMap.set(user.id, user);
                    }
                });

                setUsers(Array.from(userMap.values()));
            } catch (err) {
                console.error('Failed to fetch users:', err);
            } finally {
                setLoadingUsers(false);
            }
        };

        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || points === 0 || !reason) return;

        try {
            await awardPoints(selectedUser, points, reason);
            setSuccess(true);
            setSelectedUser('');
            setPoints(0);
            setReason('');
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to award points:', err);
        }
    };

    return (
        <div className="space-y-3">
            <h3 className="font-bold text-lg">{nl.pointsManagement}</h3>

            {success && (
                <div className="alert alert-success">
                    <span>Punten zijn toegekend!</span>
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="card bg-base-200 p-4 space-y-4">
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">{nl.user}</span>
                    </label>
                    <select
                        className="select select-bordered"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        disabled={loadingUsers}
                        required
                    >
                        <option value="">Selecteer gebruiker</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name || user.email}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">{nl.points} (+/-)</span>
                    </label>
                    <input
                        type="number"
                        className="input input-bordered"
                        value={points}
                        onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                        required
                    />
                    <label className="label">
                        <span className="label-text-alt text-base-content/70">
                            Gebruik negatief voor aftrek
                        </span>
                    </label>
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">{nl.reason}</span>
                    </label>
                    <input
                        type="text"
                        className="input input-bordered"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="bijv. Bonus: Beste activiteit"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !selectedUser || points === 0 || !reason}
                >
                    {loading ? (
                        <span className="loading loading-spinner loading-sm" />
                    ) : (
                        nl.awardPoints
                    )}
                </button>
            </form>
        </div>
    );
}

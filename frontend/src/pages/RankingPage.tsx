import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import { RankingList, UserPointsHistory } from '@/components/ranking';
import { useRanking } from '@/hooks/useRanking';
import { nl } from '@/lib/translations';
import type { UserRanking } from '@/types';
import { pb } from '@/lib/pocketbase';

export function RankingPage() {
    const { rankings, loading, error, refetch } = useRanking();
    const [selectedUser, setSelectedUser] = useState<UserRanking | null>(null);

    return (
        <PageContainer onRefresh={refetch}>
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>🏆</span> {nl.ranking}
            </h1>
            <RankingList
                rankings={rankings}
                loading={loading}
                error={error}
                onUserClick={setSelectedUser}
            />

            {/* Modal for User Points History */}
            {selectedUser && (
                <dialog className="modal modal-open" onClick={() => setSelectedUser(null)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <form method="dialog">
                            <button
                                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                                onClick={() => setSelectedUser(null)}
                            >
                                ✕
                            </button>
                        </form>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="avatar">
                                <div className="w-12 h-12 rounded-full">
                                    {selectedUser.avatar ? (
                                        <img
                                            src={pb.files.getUrl({ collectionId: 'users', collectionName: 'users', id: selectedUser.id }, selectedUser.avatar)}
                                            alt={selectedUser.name}
                                        />
                                    ) : (
                                        <div className="bg-neutral text-neutral-content w-full h-full flex items-center justify-center text-xl">
                                            {selectedUser.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{selectedUser.name}</h3>
                                <p className="text-sm text-base-content/70">
                                    {selectedUser.totalPoints} punten
                                </p>
                            </div>
                        </div>

                        <h4 className="font-bold mb-3">{nl.pointsHistory}:</h4>
                        <UserPointsHistory userId={selectedUser.id} />
                    </div>
                </dialog>
            )}
        </PageContainer>
    );
}

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import { HintCard } from '@/components/hints/HintCard';
import { GuessFormModal } from '@/components/hints/GuessFormModal';
import { useHints } from '@/hooks/useHints';
import { useAuth } from '@/contexts/AuthContext';
import { useUserTransactions } from '@/hooks/useRanking';
import { nl } from '@/lib/translations';

export function HintsPage() {
    const { hints, userGuess, saveGuess, nextLockedHint, pendingWagerPoints } = useHints();
    const { user } = useAuth();
    const { totalPoints: userPointsBalance } = useUserTransactions(user?.id);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const activeUnlockedHint = [...hints].reverse().find((h) => h.isUnlocked);
    const activeRoundNumber = activeUnlockedHint ? activeUnlockedHint.roundNumber : 1;
    const finalRoundNumber = hints.reduce((max, h) => Math.max(max, h.roundNumber), 0) || 1;
    const activeBasePoints = activeUnlockedHint?.potentialPoints ?? 0;
    const activeIsFinalRound = activeRoundNumber === finalRoundNumber;

    // Available balance for a new wager = settled points minus points already locked
    // in unresolved wagers. This prevents wagering the same points twice (double spending).
    const availablePoints = Math.max(0, userPointsBalance - pendingWagerPoints);

    return (
        <PageContainer>
            <div className="space-y-5 pb-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-extrabold flex items-center gap-2">
                        <span>🕵️</span> {nl.hintsTitle}
                    </h1>
                    <p className="text-xs text-base-content/70 mt-0.5">Ontrafel het mysterie vóór 1 oktober 2026!</p>
                </div>

                {/* Current Guess Status Banner */}
                <div className="bg-gradient-to-br from-base-200 to-base-100 border border-primary/20 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3 border-b border-base-300 pb-2">
                        <span className="font-bold text-sm flex items-center gap-1.5 text-primary">
                            🎯 {nl.currentGuess}
                        </span>
                        {userGuess && (
                            <span className="badge badge-sm badge-success font-semibold gap-1 text-white">
                                ✓ Ronde #{userGuess.roundNumber} Opslagen
                            </span>
                        )}
                    </div>

                    {userGuess ? (
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-base-100 p-2.5 rounded-xl border border-base-200">
                                <span className="text-[10px] text-base-content/60 uppercase block font-semibold">
                                    📍 Land
                                </span>
                                <span className="font-bold text-sm truncate block text-primary">
                                    {userGuess.locationCountry}
                                </span>
                            </div>
                            <div className="bg-base-100 p-2.5 rounded-xl border border-base-200">
                                <span className="text-[10px] text-base-content/60 uppercase block font-semibold">
                                    🎭 Guest
                                </span>
                                <span className="font-bold text-sm truncate block text-secondary">
                                    {userGuess.mysteryGuestName}
                                </span>
                            </div>
                            <div className="bg-base-100 p-2.5 rounded-xl border border-base-200">
                                <span className="text-[10px] text-base-content/60 uppercase block font-semibold">
                                    🎲 Inzet
                                </span>
                                <span className="font-bold text-sm block text-accent">{userGuess.wagerPoints} pts</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-2">
                            <p className="text-xs text-base-content/70">
                                Nog geen voorspelling doorgegeven. Klik hieronder in de actieve hintronde om je antwoord
                                in te vullen!
                            </p>
                        </div>
                    )}
                </div>

                {/* Hint Cards Timeline */}
                <div className="space-y-3">
                    <h2 className="text-sm font-extrabold uppercase tracking-wider text-base-content/60 px-1">
                        📜 Hint Timeline (5 Rondes)
                    </h2>
                    {hints.map((hint) => (
                        <HintCard
                            key={hint.id}
                            hint={hint}
                            isNextToUnlock={hint.id === nextLockedHint?.id}
                            onOpenGuessModal={() => setIsModalOpen(true)}
                            userGuess={userGuess}
                        />
                    ))}
                </div>
            </div>

            {/* Modal Form */}
            <GuessFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                currentGuess={userGuess}
                userPoints={availablePoints}
                activeRoundNumber={activeRoundNumber}
                basePoints={activeBasePoints}
                isFinalRound={activeIsFinalRound}
                onSaveGuess={saveGuess}
            />
        </PageContainer>
    );
}

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import { HintCard } from '@/components/hints/HintCard';
import { GuessFormModal } from '@/components/hints/GuessFormModal';
import { useHints } from '@/hooks/useHints';
import { useAuth } from '@/contexts/AuthContext';
import { useUserTransactions } from '@/hooks/useRanking';
import { nl } from '@/lib/translations';

export function HintsPage() {
    const { hints, userGuess, saveGuess, nextLockedHint, pendingWagerPoints, myPredictions } = useHints();
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

    // Map each round number to the user's prediction for that round.
    const guessByRound: Record<number, (typeof myPredictions)[number]> = {};
    myPredictions.forEach((g) => {
        guessByRound[g.roundNumber] = g;
    });
    const sortedPredictions = [...myPredictions].sort((a, b) => a.roundNumber - b.roundNumber);

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

                {/* My Predictions Banner */}
                <div className="bg-gradient-to-br from-base-200 to-base-100 border border-primary/20 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3 border-b border-base-300 pb-2">
                        <span className="font-bold text-sm flex items-center gap-1.5 text-primary">
                            🎯 {nl.myGuesses}
                        </span>
                        {myPredictions.length > 0 && (
                            <span className="badge badge-sm badge-success font-semibold gap-1 text-white">
                                ✓ {myPredictions.length} ingediend
                            </span>
                        )}
                    </div>

                    {sortedPredictions.length > 0 ? (
                        <div className="space-y-2">
                            {sortedPredictions.map((g) => (
                                <div
                                    key={g.roundNumber}
                                    className="bg-base-100 rounded-xl border border-base-200 p-2.5 flex items-center gap-2"
                                >
                                    <span className="badge badge-primary badge-sm font-bold shrink-0">
                                        #{g.roundNumber}
                                    </span>
                                    <div className="flex-1 min-w-0 text-xs">
                                        <span className="font-bold text-primary block truncate">
                                            📍 {g.locationCountry}
                                        </span>
                                        <span className="font-bold text-secondary block truncate">
                                            🎭 {g.mysteryGuestName}
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-accent shrink-0">
                                        🎲 {g.wagerPoints} pts
                                    </span>
                                </div>
                            ))}
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
                            userGuess={guessByRound[hint.roundNumber] ?? null}
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

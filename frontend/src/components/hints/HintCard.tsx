import { useState, useEffect } from 'react';
import type { Hint, UserGuess } from '@/types';
import { nl } from '@/lib/translations';
import { CountdownTimer } from './CountdownTimer';
import { SubmissionWindowTimer } from './SubmissionWindowTimer';

interface HintCardProps {
    hint: Hint;
    isNextToUnlock?: boolean;
    onOpenGuessModal?: () => void;
    userGuess?: UserGuess | null;
}

export function HintCard({ hint, isNextToUnlock, onOpenGuessModal, userGuess }: HintCardProps) {
    // Tick every second so the submission window lock reacts immediately when it expires.
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const formattedReleaseDate = new Date(hint.releaseDate).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    const isWindowActive = new Date(hint.windowEndDate).getTime() > now;

    if (!hint.isUnlocked) {
        return (
            <div
                className={`card ${isNextToUnlock ? 'bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 border-primary/40' : 'bg-base-200/60 border-base-300'} border shadow-sm relative overflow-hidden transition-all duration-200`}
            >
                <div className="card-body p-5 flex flex-col items-center text-center justify-center min-h-[160px]">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-10 h-10 rounded-full bg-base-300/80 flex items-center justify-center text-xl shadow-inner">
                            🔒
                        </div>
                        {isNextToUnlock && (
                            <span className="badge badge-primary font-bold text-xs">⏳ Volgende Hint</span>
                        )}
                    </div>

                    <h3 className="font-bold text-base text-base-content/80">Hint #{hint.roundNumber}</h3>

                    {/* Embedded Countdown Timer for Next Upcoming Hint */}
                    {isNextToUnlock ? (
                        <div className="w-full my-2">
                            <CountdownTimer targetDate={hint.releaseDate} />
                        </div>
                    ) : (
                        <p className="text-xs text-base-content/50 mt-1">
                            {nl.lockedHint}:{' '}
                            <span className="font-semibold text-base-content/80">{formattedReleaseDate}</span>
                        </p>
                    )}

                    <div className="badge badge-ghost badge-sm mt-2 gap-1 font-medium">
                        🏆 Max {hint.potentialPoints} {nl.points} te winnen
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-base-100 border border-primary/20 shadow-md hover:shadow-lg transition-all duration-200">
            <div className="card-body p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="badge badge-primary font-bold">Ronde #{hint.roundNumber}</span>
                    <span className="badge badge-accent font-semibold gap-1">
                        🏆 {hint.potentialPoints} {nl.points}
                    </span>
                </div>

                <h3 className="card-title text-lg font-bold">Hint #{hint.roundNumber}</h3>

                {/* Media Content */}
                {hint.type === 'image' && hint.mediaUrl && (
                    <div className="rounded-xl overflow-hidden border border-base-200 bg-black/5 aspect-video relative group">
                        <img
                            src={hint.mediaUrl}
                            alt={hint.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1">
                            🔍 <span>Bekijk details in foto</span>
                        </div>
                    </div>
                )}

                {hint.type === 'audio' && hint.mediaUrl && (
                    <div className="bg-base-200/70 p-4 rounded-xl border border-base-300">
                        <p className="text-xs font-semibold text-base-content/70 mb-2 flex items-center gap-1.5">
                            🔊 <span>Afspelen Stemvervorming Fragment:</span>
                        </p>
                        <audio controls className="w-full rounded-lg h-10">
                            <source src={hint.mediaUrl} type="audio/mp3" />
                            Je browser ondersteunt dit geluidsfragment niet.
                        </audio>
                    </div>
                )}

                {/* Text Content */}
                <div className="space-y-2 text-sm text-base-content/80">
                    {hint.contentLocation && hint.contentMysteryGuest ? (
                        <>
                            <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                                <strong className="text-primary font-semibold block text-xs uppercase tracking-wider mb-1">
                                    📍 Locatie Hint:
                                </strong>
                                <p>{hint.contentLocation}</p>
                            </div>
                            <div className="bg-secondary/5 p-3 rounded-xl border border-secondary/10">
                                <strong className="text-secondary font-semibold block text-xs uppercase tracking-wider mb-1">
                                    🎭 Mystery Guest Hint:
                                </strong>
                                <p>{hint.contentMysteryGuest}</p>
                            </div>
                        </>
                    ) : (
                        (hint.contentLocation || hint.contentMysteryGuest) && (
                            <div className="bg-base-200/60 p-4 rounded-xl border border-base-300">
                                <p className="whitespace-pre-line leading-relaxed italic">
                                    {hint.contentLocation || hint.contentMysteryGuest}
                                </p>
                            </div>
                        )
                    )}
                </div>

                {/* Submission Window Timer (hidden once this round's prediction is submitted) */}
                {!userGuess && <SubmissionWindowTimer windowEndDate={hint.windowEndDate} />}

                {/* Prediction Action Section inside Card */}
                {onOpenGuessModal && (
                    <div className="pt-2 border-t border-base-200 flex flex-col gap-2">
                        {userGuess ? (
                            <div className="bg-base-200/80 p-3 rounded-xl border border-base-300 flex items-center gap-2">
                                <div className="text-xs space-y-0.5 min-w-0">
                                    <p className="font-semibold text-base-content/70 flex items-center gap-1">
                                        <span>🎯 Jouw Voorspelling:</span>
                                    </p>
                                    <p className="truncate font-bold text-base-content">
                                        📍 {userGuess.locationCountry} • 🎭 {userGuess.mysteryGuestName}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            isWindowActive && (
                                <button
                                    onClick={onOpenGuessModal}
                                    className="btn btn-primary w-full rounded-xl font-bold shadow-md gap-2"
                                >
                                    <span>🎯</span>
                                    <span>Voorspelling Invullen voor Ronde #{hint.roundNumber}</span>
                                </button>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

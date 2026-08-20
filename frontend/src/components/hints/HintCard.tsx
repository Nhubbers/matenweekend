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

function isAudioUrl(url?: string): boolean {
    if (!url) return false;
    const clean = url.split('?')[0].toLowerCase();
    return (
        clean.endsWith('.mp3') ||
        clean.endsWith('.wav') ||
        clean.endsWith('.ogg') ||
        clean.endsWith('.m4a') ||
        clean.includes('audio')
    );
}

function isImageUrl(url?: string): boolean {
    if (!url) return false;
    const clean = url.split('?')[0].toLowerCase();
    return (
        clean.endsWith('.png') ||
        clean.endsWith('.jpg') ||
        clean.endsWith('.jpeg') ||
        clean.endsWith('.webp') ||
        clean.endsWith('.gif') ||
        clean.endsWith('.heic') ||
        clean.includes('image') ||
        clean.includes('picture') ||
        clean.includes('photo')
    );
}

export function HintCard({ hint, isNextToUnlock, onOpenGuessModal, userGuess }: HintCardProps) {
    // Tick every second so the submission window lock reacts immediately when it expires.
    const [now, setNow] = useState(() => Date.now());
    const [previewImage, setPreviewImage] = useState<string | null>(null);

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

    // Determine media sources smartly
    const locationAudio =
        hint.locationMediaUrl ||
        (isAudioUrl(hint.mediaUrl) ? hint.mediaUrl : undefined) ||
        (hint.type === 'audio' ? hint.mediaUrl : undefined);

    const mysteryGuestImage =
        hint.mysteryGuestMediaUrl ||
        (isImageUrl(hint.mediaUrl) ? hint.mediaUrl : undefined) ||
        (hint.type === 'image' ? hint.mediaUrl : undefined);

    const hasDualContent = Boolean(hint.contentLocation && hint.contentMysteryGuest);

    return (
        <div className="card bg-base-100 border border-primary/20 shadow-md hover:shadow-lg transition-all duration-200">
            <div className="card-body p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="badge badge-primary font-bold">Ronde #{hint.roundNumber}</span>
                    <span className="badge badge-accent font-semibold gap-1">
                        🏆 {hint.potentialPoints} {nl.points}
                    </span>
                </div>

                <h3 className="card-title text-lg font-bold">Hint #{hint.roundNumber}</h3>

                {/* Render Side-by-Side dual hint layout if both Location and Mystery Guest content/media exist */}
                {hasDualContent ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Location Hint Card Column */}
                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/15 flex flex-col justify-between space-y-3">
                            <div className="space-y-2">
                                <strong className="text-primary font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                                    <span>📍</span> Locatie Hint
                                </strong>
                                {hint.contentLocation && (
                                    <p className="text-sm text-base-content/90 font-medium whitespace-pre-line leading-relaxed">
                                        {hint.contentLocation}
                                    </p>
                                )}
                            </div>

                            {/* Location Audio Media */}
                            {locationAudio && (
                                <div className="bg-base-100/90 p-3 rounded-xl border border-primary/10 space-y-1.5 shadow-sm mt-2">
                                    <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                                        🔊 <span>Beluister vogelgeluid (Locatie hint):</span>
                                    </p>
                                    <audio controls className="w-full rounded-lg h-9">
                                        <source src={locationAudio} type="audio/mpeg" />
                                        <source src={locationAudio} type="audio/mp3" />
                                        Je browser ondersteunt dit geluidsfragment niet.
                                    </audio>
                                </div>
                            )}
                        </div>

                        {/* Mystery Guest Hint Card Column */}
                        <div className="bg-secondary/5 p-4 rounded-2xl border border-secondary/15 flex flex-col justify-between space-y-3">
                            <div className="space-y-2">
                                <strong className="text-secondary font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                                    <span>🎭</span> Mystery Guest Hint
                                </strong>
                                {hint.contentMysteryGuest && (
                                    <p className="text-sm text-base-content/90 font-medium whitespace-pre-line leading-relaxed">
                                        {hint.contentMysteryGuest}
                                    </p>
                                )}
                            </div>

                            {/* Mystery Guest Image Media */}
                            {mysteryGuestImage && (
                                <div
                                    onClick={() => setPreviewImage(mysteryGuestImage)}
                                    className="rounded-xl overflow-hidden border border-secondary/15 aspect-video relative group bg-black/5 cursor-pointer shadow-sm mt-2"
                                >
                                    <img
                                        src={mysteryGuestImage}
                                        alt="Babyfoto Mystery Guest"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1">
                                        👶 <span>Klik voor vergroting</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Single hint layout fallback */
                    <div className="space-y-3">
                        {hint.type === 'image' && hint.mediaUrl && (
                            <div
                                onClick={() => setPreviewImage(hint.mediaUrl!)}
                                className="rounded-xl overflow-hidden border border-base-200 bg-black/5 aspect-video relative group cursor-pointer"
                            >
                                <img
                                    src={hint.mediaUrl}
                                    alt={hint.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1">
                                    🔍 <span>Bekijk foto in volledig scherm</span>
                                </div>
                            </div>
                        )}

                        {hint.type === 'audio' && hint.mediaUrl && (
                            <div className="bg-base-200/70 p-4 rounded-xl border border-base-300">
                                <p className="text-xs font-semibold text-base-content/70 mb-2 flex items-center gap-1.5">
                                    🔊 <span>Afspelen Geluidsfragment:</span>
                                </p>
                                <audio controls className="w-full rounded-lg h-10">
                                    <source src={hint.mediaUrl} type="audio/mpeg" />
                                    <source src={hint.mediaUrl} type="audio/mp3" />
                                    Je browser ondersteunt dit geluidsfragment niet.
                                </audio>
                            </div>
                        )}

                        {(hint.contentLocation || hint.contentMysteryGuest) && (
                            <div className="bg-base-200/60 p-4 rounded-xl border border-base-300">
                                <p className="whitespace-pre-line leading-relaxed italic text-sm">
                                    {hint.contentLocation || hint.contentMysteryGuest}
                                </p>
                            </div>
                        )}
                    </div>
                )}

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

            {/* Lightbox / Fullscreen Image Modal */}
            {previewImage && (
                <dialog className="modal modal-open bg-black/80 backdrop-blur-md" onClick={() => setPreviewImage(null)}>
                    <div
                        className="modal-box max-w-3xl p-2 bg-transparent shadow-none relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="btn btn-circle btn-sm btn-ghost text-white absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/80"
                        >
                            ✕
                        </button>
                        <img
                            src={previewImage}
                            alt="Vergrote Hint Foto"
                            className="w-full h-auto max-h-[85vh] object-contain rounded-2xl"
                        />
                    </div>
                </dialog>
            )}
        </div>
    );
}

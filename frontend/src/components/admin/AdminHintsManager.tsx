import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useHints, useAllGuesses, useRoundAnswers } from '@/hooks/useHints';
import { pb } from '@/lib/pocketbase';
import { EUROPEAN_COUNTRIES } from '@/data/mockHints';
import { calculatePayout } from '@/lib/guessPayout';
import { getErrorMessage } from '@/lib/errors';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmDialog } from '@/components/common';
import type { Hint, Submission } from '@/types';

export function AdminHintsManager() {
    const queryClient = useQueryClient();
    const toast = useToast();
    const { hints, saveHint } = useHints();
    const { guesses: submissions, refetch: refetchSubmissions } = useAllGuesses();
    const { roundAnswers, upsertRoundAnswer } = useRoundAnswers();
    const [selectedHint, setSelectedHint] = useState<Hint | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSavingHint, setIsSavingHint] = useState(false);
    const [isAwarded, setIsAwarded] = useState(false);
    const [isAwarding, setIsAwarding] = useState(false);
    const [deletingGuess, setDeletingGuess] = useState<Submission | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSavingAnswers, setIsSavingAnswers] = useState(false);
    // Editable per-round correct answers, keyed by round number.
    const [answersByRound, setAnswersByRound] = useState<Record<number, { country: string; guest: string }>>({});

    // Populate the editable per-round answers from the backend once loaded.
    useEffect(() => {
        if (!roundAnswers.length) return;
        const map: Record<number, { country: string; guest: string }> = {};
        roundAnswers.forEach((a) => {
            map[a.roundNumber] = { country: a.correctCountry, guest: a.correctGuest };
        });
        setAnswersByRound(map);
    }, [roundAnswers]);

    const getRoundAnswer = (roundNumber: number) => {
        const stored = roundAnswers.find((a) => a.roundNumber === roundNumber);
        const edited = answersByRound[roundNumber];
        return {
            country: edited?.country ?? stored?.correctCountry ?? '',
            guest: edited?.guest ?? stored?.correctGuest ?? '',
        };
    };

    const setRoundAnswer = (roundNumber: number, field: 'country' | 'guest', value: string) => {
        setAnswersByRound((prev) => ({
            ...prev,
            [roundNumber]: { ...(prev[roundNumber] ?? getRoundAnswer(roundNumber)), [field]: value },
        }));
    };

    const handleSaveAnswers = async () => {
        setIsSavingAnswers(true);
        try {
            for (const h of hints) {
                const a = answersByRound[h.roundNumber];
                if (!a || !a.country || !a.guest) continue;
                await upsertRoundAnswer(h.roundNumber, a.country, a.guest);
            }
            toast.success('Antwoorden per ronde opgeslagen!');
        } catch {
            toast.error('Opslaan van antwoorden mislukt.');
        } finally {
            setIsSavingAnswers(false);
        }
    };

    const handleSaveHint = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHint || isSavingHint) return;

        setIsSavingHint(true);
        try {
            await saveHint(selectedHint, selectedFile);
            toast.success(`Hint #${selectedHint.roundNumber} opgeslagen!`);
            setSelectedHint(null);
            setSelectedFile(null);
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setIsSavingHint(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && selectedHint) {
            // Store the actual File for upload; show a local object-URL preview only.
            setSelectedFile(file);
            setSelectedHint({ ...selectedHint, mediaUrl: URL.createObjectURL(file) });
        }
    };

    const handleAwardPoints = async () => {
        if (isAwarding) return;
        setIsAwarding(true);
        try {
            let awardedCount = 0;
            let resolvedCount = 0;

            const finalRoundNumber = hints.reduce((max, h) => Math.max(max, h.roundNumber), 0) || 5;

            for (const sub of submissions) {
                if (sub.resolved) continue; // never double-award

                const isFinalRound = sub.roundNumber === finalRoundNumber;
                const hint = hints.find((h) => h.roundNumber === sub.roundNumber);
                const basePoints = hint?.potentialPoints ?? 0;
                const answer = getRoundAnswer(sub.roundNumber);
                const locationCorrect =
                    sub.locationCountry.trim().toLowerCase() === answer.country.trim().toLowerCase();
                const guestCorrect = sub.mysteryGuestName.trim().toLowerCase() === answer.guest.trim().toLowerCase();

                // Base points are always earned when at least one answer is correct;
                // the x1.5 / x3 multiplier applies ONLY to the wagered points.
                // The +50 combo bonus only applies on the final round.
                const payout = calculatePayout(
                    basePoints,
                    sub.wagerPoints,
                    locationCorrect,
                    guestCorrect,
                    isFinalRound
                );

                // Record the payout (win or loss); skip only when it nets to zero.
                if (payout !== 0) {
                    await pb.collection('point_transactions').create({
                        user: sub.userId,
                        amount: payout,
                        reason:
                            payout > 0
                                ? `Hint ronde #${sub.roundNumber} voorspelling (winst)`
                                : `Hint ronde #${sub.roundNumber} voorspelling (inzet verloren)`,
                        type: payout > 0 ? 'bonus' : 'deduction',
                        awarded_by: pb.authStore.record?.id,
                    });
                    awardedCount++;
                }

                await pb.collection('guesses').update(sub.id, {
                    resolved: true,
                    awarded_points: payout,
                });
                resolvedCount++;
            }

            // Reflect the changes everywhere (admin feed, user balance, rankings).
            await refetchSubmissions();
            await queryClient.invalidateQueries({ queryKey: ['rankings'] });
            await queryClient.invalidateQueries({ queryKey: ['hints'] });
            await queryClient.invalidateQueries({ queryKey: ['transactions'] });

            if (resolvedCount === 0) {
                toast.info('Geen nieuwe voorspellingen om uit te keren.');
            } else {
                toast.success(`${awardedCount} puntuitkering(en) bijgeschreven (${resolvedCount} verwerkt).`);
                setIsAwarded(true);
                setTimeout(() => setIsAwarded(false), 4000);
            }
        } catch {
            toast.error('Punten uitkeren mislukt. Controleer de verbinding.');
        } finally {
            setIsAwarding(false);
        }
    };

    // Admin-only: delete a participant's prediction so they can try again (predictions are one-time).
    const handleDeleteGuess = async () => {
        if (!deletingGuess || isDeleting) return;
        setIsDeleting(true);
        try {
            await pb.collection('guesses').delete(deletingGuess.id);
            await refetchSubmissions();
            // Invalidate any cached participant guess so they can immediately fill in again.
            await queryClient.invalidateQueries({ queryKey: ['guess'] });
            toast.success(`Voorspelling van ${deletingGuess.userName} verwijderd.`);
            setDeletingGuess(null);
        } catch {
            toast.error('Verwijderen mislukt. Controleer de verbinding.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-base-200 p-4 rounded-2xl border border-base-300 flex items-center justify-between">
                <div>
                    <h2 className="font-extrabold text-lg flex items-center gap-2">
                        <span>🕵️</span> Hints & Voorspellingen Beheer
                    </h2>
                    <p className="text-xs text-base-content/70">
                        Beheer de 5 hints, upload foto's/audio en stel de winnende antwoorden in.
                    </p>
                </div>
            </div>

            {/* Official Answers & Payout Settings */}
            <div className="card bg-base-100 border border-primary/20 shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-base flex items-center gap-2 text-primary">
                    <span>🏆</span> Winnende Antwoorden per Ronde (Officiële Uitslag)
                </h3>

                <div className="space-y-3">
                    {hints.map((h) => {
                        const answer = getRoundAnswer(h.roundNumber);
                        return (
                            <div
                                key={h.id}
                                className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr] items-end gap-3 p-3 rounded-xl border border-base-300 bg-base-200/50"
                            >
                                <div className="font-extrabold text-sm text-primary whitespace-nowrap md:pb-2">
                                    Ronde #{h.roundNumber}
                                    {h.roundNumber > 1 && (
                                        <span className="badge badge-ghost badge-xs ml-1.5 text-base-content/60">
                                            placeholder
                                        </span>
                                    )}
                                </div>
                                <div className="form-control">
                                    <label className="label py-0.5">
                                        <span className="label-text font-semibold text-xs">📍 Officiële Locatie</span>
                                    </label>
                                    <select
                                        value={answer.country}
                                        onChange={(e) => setRoundAnswer(h.roundNumber, 'country', e.target.value)}
                                        className="select select-bordered select-sm rounded-xl"
                                    >
                                        <option value="">Selecteer land...</option>
                                        {EUROPEAN_COUNTRIES.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-control">
                                    <label className="label py-0.5">
                                        <span className="label-text font-semibold text-xs">
                                            🎭 Officiële Mystery Guest
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={answer.guest}
                                        onChange={(e) => setRoundAnswer(h.roundNumber, 'guest', e.target.value)}
                                        placeholder="Volledige naam..."
                                        className="input input-bordered input-sm rounded-xl"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSaveAnswers}
                            disabled={isSavingAnswers}
                            className="btn btn-primary btn-sm rounded-xl font-bold gap-2 shadow-md"
                        >
                            <span>💾</span> {isSavingAnswers ? 'Opslaan...' : 'Antwoorden Opslaan'}
                        </button>
                        <button
                            onClick={handleAwardPoints}
                            disabled={isAwarding}
                            className="btn btn-accent btn-sm rounded-xl font-bold gap-2 shadow-md"
                        >
                            <span>⚡</span> {isAwarding ? 'Bezig met uitkeren...' : 'Keer Punten Uit aan Leaderboard'}
                        </button>
                    </div>
                </div>

                {isAwarded && (
                    <div className="alert alert-success py-2 px-3 text-xs font-semibold rounded-xl text-white">
                        ✓ Punten succesvol berekend en bijgeschreven op de ranking!
                    </div>
                )}
            </div>

            {/* Hints List Table */}
            <div className="space-y-3">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-base-content/60">
                    📜 Overzicht van de 5 Hints
                </h3>
                <div className="overflow-x-auto bg-base-100 rounded-2xl border border-base-300">
                    <table className="table table-zebra w-full text-sm">
                        <thead>
                            <tr className="bg-base-200">
                                <th>Ronde</th>
                                <th>Titel & Type</th>
                                <th>Media</th>
                                <th>Releasedatum</th>
                                <th>Base Payout</th>
                                <th>Status</th>
                                <th className="text-right">Actie</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hints.map((hint) => (
                                <tr key={hint.id}>
                                    <td className="font-bold">#{hint.roundNumber}</td>
                                    <td>
                                        <div className="font-bold">Hint #{hint.roundNumber}</div>
                                        <div className="text-xs text-base-content/60 uppercase">{hint.type}</div>
                                    </td>
                                    <td>
                                        {hint.type === 'image' && hint.mediaUrl ? (
                                            <div className="avatar">
                                                <div className="w-10 h-10 rounded-lg border border-base-300">
                                                    <img src={hint.mediaUrl} alt="Thumbnail" />
                                                </div>
                                            </div>
                                        ) : hint.type === 'audio' ? (
                                            <span className="badge badge-sm badge-outline gap-1">🎙️ Audio</span>
                                        ) : (
                                            <span className="text-xs text-base-content/40">-</span>
                                        )}
                                    </td>
                                    <td className="text-xs">
                                        {new Date(hint.releaseDate).toLocaleDateString('nl-NL', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </td>
                                    <td>
                                        <span className="badge badge-sm badge-ghost font-bold">
                                            {hint.potentialPoints} pts
                                        </span>
                                    </td>
                                    <td>
                                        {hint.isUnlocked ? (
                                            <span className="badge badge-sm badge-success text-white font-semibold">
                                                Ontgrendeld
                                            </span>
                                        ) : (
                                            <span className="badge badge-sm badge-ghost text-base-content/60">
                                                Vergrendeld
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-right">
                                        <button
                                            onClick={() => {
                                                setSelectedFile(null);
                                                setSelectedHint(hint);
                                            }}
                                            className="btn btn-ghost btn-xs text-primary font-bold"
                                        >
                                            Bewerken ✏️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Live Participant Submissions Stream */}
            <div className="space-y-3">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-base-content/60">
                    👥 Ingezonden Voorspellingen van Deelnemers
                </h3>
                <div className="overflow-x-auto bg-base-100 rounded-2xl border border-base-300">
                    <table className="table w-full text-sm">
                        <thead>
                            <tr className="bg-base-200">
                                <th>Deelnemer</th>
                                <th>Ronde</th>
                                <th>Gekozen Land</th>
                                <th>Gekozen Guest</th>
                                <th>Inzet (Wager)</th>
                                <th>Tijdstip</th>
                                <th>Status</th>
                                <th>Acties</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center text-xs text-base-content/50 py-6">
                                        Nog geen voorspellingen ingezonden door deelnemers.
                                    </td>
                                </tr>
                            ) : (
                                submissions.map((sub) => (
                                    <tr key={sub.id}>
                                        <td className="font-bold">{sub.userName}</td>
                                        <td>
                                            <span className="badge badge-sm badge-outline">
                                                Ronde #{sub.roundNumber}
                                            </span>
                                        </td>
                                        <td className="text-primary font-medium">{sub.locationCountry}</td>
                                        <td className="text-secondary font-medium">{sub.mysteryGuestName}</td>
                                        <td className="font-mono text-xs font-bold text-accent">
                                            {sub.wagerPoints} pts
                                        </td>
                                        <td className="text-xs text-base-content/60">
                                            {sub.submittedAt
                                                ? new Date(sub.submittedAt).toLocaleString('nl-NL', {
                                                      day: 'numeric',
                                                      month: 'short',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                  })
                                                : '-'}
                                        </td>
                                        <td>
                                            {sub.resolved ? (
                                                <span className="badge badge-sm badge-success text-white font-semibold">
                                                    ✓ {sub.awardedPoints ?? 0} pts
                                                </span>
                                            ) : (
                                                <span className="badge badge-sm badge-ghost text-base-content/60">
                                                    Open
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                onClick={() => setDeletingGuess(sub)}
                                                className="btn btn-ghost btn-xs text-error font-bold"
                                                title="Verwijder voorspelling (zodat deelnemer opnieuw kan invullen)"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Hint Modal */}
            {selectedHint && (
                <dialog className="modal modal-open bg-black/60 backdrop-blur-sm">
                    <div className="modal-box max-w-lg p-6 rounded-2xl">
                        <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2">
                            <span>✏️</span> Hint #{selectedHint.roundNumber} Bewerken
                        </h3>
                        <form onSubmit={handleSaveHint} className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold text-xs">Titel</span>
                                </label>
                                <input
                                    type="text"
                                    value={selectedHint.title}
                                    onChange={(e) => setSelectedHint({ ...selectedHint, title: e.target.value })}
                                    className="input input-bordered input-sm rounded-xl"
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold text-xs">Release Datum & Tijd</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={selectedHint.releaseDate.slice(0, 16)}
                                    onChange={(e) =>
                                        setSelectedHint({
                                            ...selectedHint,
                                            releaseDate: new Date(e.target.value).toISOString(),
                                        })
                                    }
                                    className="input input-bordered input-sm rounded-xl"
                                    required
                                />
                            </div>

                            {/* Photo Upload Section for Image Hints */}
                            {selectedHint.type === 'image' && (
                                <div className="form-control bg-base-200/60 p-4 rounded-xl border border-base-300">
                                    <label className="label p-0 mb-2">
                                        <span className="label-text font-bold text-xs flex items-center gap-1.5 text-primary">
                                            🖼️ Upload Foto voor Hint #{selectedHint.roundNumber}
                                        </span>
                                    </label>

                                    {/* Preview */}
                                    {selectedHint.mediaUrl ? (
                                        <div className="relative rounded-xl overflow-hidden border border-base-300 aspect-video bg-black/5 mb-3">
                                            <img
                                                src={selectedHint.mediaUrl}
                                                alt="Hint Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedFile(null);
                                                    setSelectedHint({ ...selectedHint, mediaUrl: '' });
                                                }}
                                                className="btn btn-circle btn-xs btn-error absolute top-2 right-2 text-white shadow-md"
                                                title="Verwijder foto"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : null}

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="file-input file-input-bordered file-input-primary file-input-sm w-full rounded-xl"
                                    />
                                    <p className="text-[11px] text-base-content/60 mt-1.5">
                                        Kies een bestand van je telefoon/computer of vul hieronder een direct URL-adres
                                        in.
                                    </p>
                                </div>
                            )}

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold text-xs">📍 Locatie Hint Tekst</span>
                                </label>
                                <textarea
                                    value={selectedHint.contentLocation || ''}
                                    onChange={(e) =>
                                        setSelectedHint({ ...selectedHint, contentLocation: e.target.value })
                                    }
                                    className="textarea textarea-bordered rounded-xl text-sm"
                                    rows={2}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold text-xs">
                                        🎭 Mystery Guest Hint Tekst
                                    </span>
                                </label>
                                <textarea
                                    value={selectedHint.contentMysteryGuest || ''}
                                    onChange={(e) =>
                                        setSelectedHint({ ...selectedHint, contentMysteryGuest: e.target.value })
                                    }
                                    className="textarea textarea-bordered rounded-xl text-sm"
                                    rows={2}
                                />
                            </div>

                            {selectedHint.type !== 'text' && (
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold text-xs">
                                            Media URL (Afbeelding of Audio URL)
                                        </span>
                                    </label>
                                    <input
                                        type="url"
                                        value={selectedHint.mediaUrl || ''}
                                        onChange={(e) => setSelectedHint({ ...selectedHint, mediaUrl: e.target.value })}
                                        className="input input-bordered input-sm rounded-xl"
                                        placeholder="https://..."
                                    />
                                </div>
                            )}

                            <div className="modal-action mt-6">
                                <button
                                    type="button"
                                    className="btn btn-ghost rounded-xl"
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setSelectedHint(null);
                                    }}
                                >
                                    Annuleren
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary rounded-xl font-bold px-6"
                                    disabled={isSavingHint}
                                >
                                    {isSavingHint ? '🔄 Opslaan...' : 'Opslaan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </dialog>
            )}

            {/* Delete prediction confirmation (admin-only, so the user can try again) */}
            <ConfirmDialog
                isOpen={!!deletingGuess}
                title="Voorspelling verwijderen?"
                message={
                    deletingGuess
                        ? `Weet je zeker dat je de voorspelling van ${deletingGuess.userName} voor ronde #${deletingGuess.roundNumber} wilt verwijderen? De deelnemer kan daarna een nieuwe voorspelling invullen.`
                        : ''
                }
                confirmLabel={isDeleting ? 'Verwijderen...' : 'Verwijderen'}
                onConfirm={handleDeleteGuess}
                onCancel={() => setDeletingGuess(null)}
                variant="danger"
            />
        </div>
    );
}

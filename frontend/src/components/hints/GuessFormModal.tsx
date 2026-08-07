import { useState, useEffect } from 'react';
import { EUROPEAN_COUNTRIES } from '@/data/mockHints';
import { nl } from '@/lib/translations';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmDialog } from '@/components/common';
import { calculatePayout } from '@/lib/guessPayout';
import { getErrorMessage } from '@/lib/errors';
import type { UserGuess } from '@/types';

interface GuessFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentGuess: UserGuess | null;
    userPoints: number;
    activeRoundNumber: number;
    /** Base points on offer for the current round (earned when at least one answer is correct). */
    basePoints: number;
    /** Whether the current round is the final (last) round - only then the +50 combo bonus applies. */
    isFinalRound: boolean;
    onSaveGuess: (guess: {
        locationCountry: string;
        mysteryGuestName: string;
        wagerPoints: number;
    }) => void | Promise<void>;
}

export function GuessFormModal({
    isOpen,
    onClose,
    currentGuess,
    userPoints,
    activeRoundNumber,
    basePoints,
    isFinalRound,
    onSaveGuess,
}: GuessFormModalProps) {
    const toast = useToast();
    const [locationCountry, setLocationCountry] = useState('');
    const [mysteryGuestName, setMysteryGuestName] = useState('');
    const [wagerPoints, setWagerPoints] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (currentGuess) {
            setLocationCountry(currentGuess.locationCountry || '');
            setMysteryGuestName(currentGuess.mysteryGuestName || '');
            setWagerPoints(currentGuess.wagerPoints || 0);
        }
    }, [currentGuess, isOpen]);

    if (!isOpen) return null;

    // Live potential payout based on the current wager (multiplier applies only to wagered points).
    const maxWager = Math.max(0, Math.floor(userPoints));
    const effectiveWager = Math.min(Math.max(0, Math.floor(Number(wagerPoints) || 0)), maxWager);
    const potentialOneCorrect = calculatePayout(basePoints, effectiveWager, true, false, isFinalRound);
    const potentialBothCorrect = calculatePayout(basePoints, effectiveWager, true, true, isFinalRound);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        // Ask for confirmation: predictions can only be saved once and not altered afterwards.
        setShowConfirm(true);
    };

    const handleConfirmSave = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSaveGuess({
                locationCountry,
                mysteryGuestName,
                wagerPoints: effectiveWager,
            });
            toast.success(nl.guessSavedSuccess);
            setShowConfirm(false);
            onClose();
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <dialog className="modal modal-open bg-black/60 backdrop-blur-sm">
            <div className="modal-box max-w-lg p-6 rounded-2xl">
                <form method="dialog">
                    <button
                        type="button"
                        className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </form>

                <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🕵️</span>
                    <div>
                        <h3 className="font-extrabold text-xl">{nl.guessHeader}</h3>
                        <p className="text-xs text-base-content/70">
                            Ronde #{activeRoundNumber} - Vul je antwoorden in
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {/* Location Country Selection */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-bold flex items-center gap-1.5 text-primary">
                                📍 {nl.locationGuess}
                            </span>
                        </label>
                        <select
                            value={locationCountry}
                            onChange={(e) => setLocationCountry(e.target.value)}
                            required
                            className="select select-bordered w-full rounded-xl bg-base-100 font-medium"
                        >
                            <option value="" disabled>
                                {nl.selectCountry}
                            </option>
                            {EUROPEAN_COUNTRIES.map((country) => (
                                <option key={country} value={country}>
                                    {country}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Mystery Guest Free Text Input */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-bold flex items-center gap-1.5 text-secondary">
                                🎭 {nl.mysteryGuestGuess}
                            </span>
                        </label>
                        <input
                            type="text"
                            value={mysteryGuestName}
                            onChange={(e) => setMysteryGuestName(e.target.value)}
                            placeholder={nl.enterFullName}
                            required
                            className="input input-bordered w-full rounded-xl bg-base-100 font-medium"
                        />
                    </div>

                    {/* Wager Points Input */}
                    <div className="form-control bg-base-200/60 p-4 rounded-xl border border-base-300">
                        <label className="label p-0 mb-2">
                            <span className="label-text font-bold flex items-center gap-1.5">🎲 {nl.wagerPoints}</span>
                            <span className="label-text-alt text-xs font-semibold text-primary">
                                Saldo: {userPoints} pts
                            </span>
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min={0}
                                max={Math.max(userPoints, 0)}
                                step={5}
                                value={Math.min(wagerPoints, userPoints)}
                                onChange={(e) => setWagerPoints(Number(e.target.value))}
                                className="range range-primary range-sm flex-1"
                                disabled={userPoints <= 0}
                            />
                            <div className="badge badge-primary font-mono font-bold text-sm px-3 py-3">
                                {Math.min(wagerPoints, Math.max(userPoints, 0))} pts
                            </div>
                        </div>

                        {/* Multiplier info (collapsible) + compact potential payout */}
                        <div className="mt-3 space-y-2">
                            <button
                                type="button"
                                onClick={() => setShowInfo((v) => !v)}
                                className="btn btn-ghost btn-xs rounded-lg font-semibold gap-1 text-base-content/70 px-1"
                            >
                                <span>ℹ️</span>
                                {showInfo ? 'Verberg uitleg' : 'Hoe werkt de inzet?'}
                            </button>

                            {showInfo && (
                                <p className="text-[11px] text-base-content/60 leading-relaxed p-2 rounded-lg border border-base-300 bg-base-100">
                                    Je zet punten in vanuit je saldo. De vermenigvuldiger geldt alleen op je ingezette
                                    punten en nooit op de base punten. Bij ten minste één goed antwoord krijg je de
                                    volledige base punten ({basePoints} pts) erbovenop. ❌ 0 goed: je verliest je inzet
                                    ({effectiveWager} pts).
                                    {isFinalRound ? ' 🏆 +50 Combo bonus bij 2 goed (finale ronde)!' : ''}
                                </p>
                            )}

                            <div className="flex items-center gap-2">
                                <span className="badge badge-ghost badge-sm gap-1.5 px-2" title="1 antwoord goed">
                                    <span className="text-[11px] text-secondary font-semibold">1 goed</span>
                                    <span className="font-mono text-[11px] font-bold text-secondary">
                                        +{potentialOneCorrect}
                                    </span>
                                </span>
                                <span className="badge badge-ghost badge-sm gap-1.5 px-2" title="2 antwoorden goed">
                                    <span className="text-[11px] text-success font-semibold">2 goed</span>
                                    <span className="font-mono text-[11px] font-bold text-success">
                                        +{potentialBothCorrect}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="modal-action mt-6">
                        <button
                            type="button"
                            className="btn btn-ghost rounded-xl"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            {nl.cancel}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary rounded-xl px-6 font-bold shadow-md"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '🔄 Opslaan...' : currentGuess ? nl.updateGuess : nl.submitGuess}
                        </button>
                    </div>
                </form>

                <ConfirmDialog
                    isOpen={showConfirm}
                    title={nl.confirmSaveTitle}
                    message={nl.confirmSaveMessage}
                    confirmLabel={nl.submitGuess}
                    onConfirm={handleConfirmSave}
                    onCancel={() => setShowConfirm(false)}
                    variant="warning"
                />
            </div>
        </dialog>
    );
}

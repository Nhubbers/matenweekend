import React from 'react';
import { nl } from '@/lib/translations';
import type { Activity, Participation } from '@/types';

interface ActivityCompletionModeProps {
    activity: Activity;
    participations: Participation[];
    localNoshows: Record<string, boolean>;
    onToggleNoshow: (participationId: string, noshow: boolean) => void;
    completionImage: File | null;
    completionImagePreview: string | null;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onConfirm: () => void;
    onCancel: () => void;
    actionLoading: boolean;
}

export function ActivityCompletionMode({
    activity,
    localNoshows,
    completionImage,
    completionImagePreview,
    onImageChange,
    onConfirm,
    onCancel,
    actionLoading,
}: ActivityCompletionModeProps) {
    const noshowCount = Object.values(localNoshows).filter(Boolean).length;

    return (
        <div className="mt-6 space-y-4">
            <div className="alert alert-info rounded-2xl shadow-sm py-3 px-4">
                <div>
                    <h3 className="font-bold text-sm sm:text-base">🎯 {nl.completingActivity}</h3>
                    <p className="text-xs sm:text-sm">{nl.noshowExplanation}</p>
                </div>
            </div>

            {noshowCount > 0 && (
                <div className="alert alert-warning rounded-2xl shadow-sm py-3 px-4">
                    <span className="text-xs sm:text-sm font-semibold">
                        ⚠️ {noshowCount} {noshowCount === 1 ? 'deelnemer' : 'deelnemers'} gemarkeerd als no-show. Zij krijgen -{activity.points_participant} strafpunten.
                    </span>
                </div>
            )}

            {/* Completion photo upload */}
            <div className="card bg-base-200 border border-base-300 p-4 rounded-2xl shadow-sm">
                <label className="block font-bold mb-1 text-sm sm:text-base">
                    📸 {nl.uploadCompletionPhoto}
                </label>
                <p className="text-xs sm:text-sm text-base-content/70 mb-3">{nl.completionPhotoHint}</p>

                <input
                    type="file"
                    accept="image/*"
                    onChange={onImageChange}
                    className="file-input file-input-bordered w-full rounded-xl file-input-sm sm:file-input-md"
                />

                {completionImagePreview && (
                    <div className="mt-3 rounded-xl overflow-hidden relative border border-base-300">
                        <img
                            src={completionImagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-success text-success-content text-xs font-bold px-2 py-1 rounded-lg shadow">
                            ✓ {nl.photoSelected}
                        </div>
                    </div>
                )}

                {!completionImage && (
                    <p className="text-xs text-error mt-2 font-semibold">* {nl.completionPhotoRequired}</p>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    className="btn btn-success flex-1 rounded-xl"
                    onClick={onConfirm}
                    disabled={actionLoading || !completionImage}
                >
                    {actionLoading ? (
                        <span className="loading loading-spinner loading-sm" />
                    ) : (
                        `✅ ${nl.confirmComplete}`
                    )}
                </button>
                <button
                    className="btn btn-ghost rounded-xl"
                    onClick={onCancel}
                    disabled={actionLoading}
                >
                    {nl.cancelComplete}
                </button>
            </div>
        </div>
    );
}

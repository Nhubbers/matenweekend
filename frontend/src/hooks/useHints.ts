import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import type { Hint, RoundAnswer, Submission, User, UserGuess } from '@/types';

/* -------------------------------------------------------------------------- */
/*  PocketBase record <-> domain mapping helpers                              */
/* -------------------------------------------------------------------------- */

interface HintRecord {
    id: string;
    collectionId: string;
    collectionName: string;
    round_number?: number;
    title?: string;
    release_date?: string;
    window_end_date?: string;
    type?: string;
    content_location?: string;
    content_mystery_guest?: string;
    media_url?: string;
    media_file?: string;
    media_url_location?: string;
    media_file_location?: string;
    media_url_mystery_guest?: string;
    media_file_mystery_guest?: string;
    potential_points?: number;
}

function toHint(rec: HintRecord, now: Date): Hint {
    const releaseDate = rec.release_date || new Date().toISOString();
    // Prefer an uploaded file (resolved to a PocketBase file URL), else an external URL.
    const mediaUrl = rec.media_file ? pb.files.getUrl(rec, rec.media_file) : rec.media_url || undefined;
    const locationMediaUrl = rec.media_file_location
        ? pb.files.getUrl(rec, rec.media_file_location)
        : rec.media_url_location || (rec.type === 'audio' ? mediaUrl : undefined);
    const mysteryGuestMediaUrl = rec.media_file_mystery_guest
        ? pb.files.getUrl(rec, rec.media_file_mystery_guest)
        : rec.media_url_mystery_guest || (rec.type === 'image' ? mediaUrl : undefined);

    return {
        id: rec.id,
        roundNumber: rec.round_number ?? 0,
        title: rec.title || '',
        releaseDate,
        windowEndDate: rec.window_end_date || '',
        type: (rec.type as Hint['type']) || 'text',
        contentLocation: rec.content_location || undefined,
        contentMysteryGuest: rec.content_mystery_guest || undefined,
        mediaUrl,
        locationMediaUrl,
        mysteryGuestMediaUrl,
        potentialPoints: rec.potential_points ?? 0,
        isUnlocked: new Date(releaseDate) <= now,
    };
}

interface GuessRecord {
    id: string;
    user?: string;
    round_number?: number;
    location_country?: string;
    mystery_guest_name?: string;
    wager_points?: number;
    submitted_at?: string;
    resolved?: boolean;
    awarded_points?: number;
    created?: string;
    expand?: { user?: User };
}

function toGuess(rec: GuessRecord): UserGuess {
    return {
        id: rec.id,
        userId: rec.user || '',
        roundNumber: rec.round_number ?? 0,
        locationCountry: rec.location_country || '',
        mysteryGuestName: rec.mystery_guest_name || '',
        wagerPoints: rec.wager_points ?? 0,
        submittedAt: rec.submitted_at || rec.created || new Date().toISOString(),
    };
}

function toSubmission(rec: GuessRecord): Submission {
    return {
        id: rec.id,
        userId: rec.user || '',
        userName: rec.expand?.user?.name || 'Onbekende gebruiker',
        roundNumber: rec.round_number ?? 0,
        locationCountry: rec.location_country || '',
        mysteryGuestName: rec.mystery_guest_name || '',
        wagerPoints: rec.wager_points ?? 0,
        submittedAt: rec.submitted_at || rec.created || '',
        resolved: !!rec.resolved,
        awardedPoints: rec.awarded_points,
    };
}

/* -------------------------------------------------------------------------- */
/*  Hooks                                                                      */
/* -------------------------------------------------------------------------- */

export function useHints() {
    const queryClient = useQueryClient();
    const userId = pb.authStore.record?.id;

    // Fetch hints from PocketBase - the backend is the single source of truth
    // (no local/seed fallback). Managed via the admin panel / migrations.
    const { data: hints = [], isLoading } = useQuery<Hint[]>({
        queryKey: ['hints'],
        queryFn: async () => {
            try {
                const records = await pb.collection('hints').getFullList<HintRecord>({
                    sort: 'round_number',
                });
                return records.map((r) => toHint(r, new Date()));
            } catch {
                // backend unreachable - show nothing rather than stale local data
                return [];
            }
        },
    });

    // The active round is the most recently unlocked hint (highest round unlocked).
    const activeHint = useMemo(() => [...hints].reverse().find((h) => h.isUnlocked), [hints]);
    const activeRoundNumber = activeHint ? activeHint.roundNumber : 1;

    // Fetch the logged-in user's guess for the active round (from PocketBase only).
    const { data: userGuess = null } = useQuery<UserGuess | null>({
        queryKey: ['guess', userId, activeRoundNumber],
        queryFn: async () => {
            if (!userId || !activeRoundNumber) return null;
            try {
                const records = await pb.collection('guesses').getFullList<GuessRecord>({
                    filter: `user = "${userId}" && round_number = ${activeRoundNumber}`,
                    limit: 1,
                });
                if (records.length) return toGuess(records[0]);
            } catch {
                // backend unreachable - treat as no guess yet
            }
            return null;
        },
        enabled: !!userId && !!activeRoundNumber,
    });

    // All of the current user's guesses - used to compute how many points are
    // currently "at risk" (wagered but not yet resolved) to prevent double spending.
    const { data: myGuesses = [] } = useQuery<GuessRecord[]>({
        queryKey: ['my-guesses', userId],
        queryFn: async () => {
            if (!userId) return [];
            try {
                return await pb.collection('guesses').getFullList<GuessRecord>({
                    filter: `user = "${userId}"`,
                });
            } catch {
                return [];
            }
        },
        enabled: !!userId,
    });

    // Points currently locked in unresolved wagers. A user's available balance is
    // totalPoints - pendingWagerPoints, so already-wagered points cannot be wagered twice.
    const pendingWagerPoints = myGuesses.filter((g) => !g.resolved).reduce((sum, g) => sum + (g.wager_points ?? 0), 0);

    // The user's submitted predictions across all rounds (mapped to domain objects).
    const myPredictions: UserGuess[] = myGuesses.map(toGuess);

    /**
     * Saves (upserts) the active round guess for the logged-in user in PocketBase.
     * Predictions are NEVER stored locally - if the server write fails, this throws
     * so the caller can surface the error to the user.
     */
    const saveGuess = async (guessData: {
        locationCountry: string;
        mysteryGuestName: string;
        wagerPoints: number;
    }): Promise<void> => {
        if (!userId || !activeRoundNumber) {
            throw new Error('Je moet ingelogd zijn om een voorspelling op te slaan.');
        }

        const payload = {
            user: userId,
            round_number: activeRoundNumber,
            location_country: guessData.locationCountry,
            mystery_guest_name: guessData.mysteryGuestName,
            wager_points: guessData.wagerPoints,
            submitted_at: new Date().toISOString(),
        };

        const existing = await pb.collection('guesses').getFullList<GuessRecord>({
            filter: `user = "${userId}" && round_number = ${activeRoundNumber}`,
            limit: 1,
        });
        if (existing.length) {
            await pb.collection('guesses').update(existing[0].id, payload);
        } else {
            await pb.collection('guesses').create(payload);
        }
        await queryClient.invalidateQueries({ queryKey: ['guess', userId, activeRoundNumber] });
        await queryClient.invalidateQueries({ queryKey: ['my-guesses', userId] });
    };

    /**
     * Saves a single hint (admin management) into the PocketBase hints collection.
     * Supports an optional image/audio file upload (stored in the `media_file` file
     * field). Throws on failure so the admin sees the error.
     */
    const saveHint = async (hint: Hint, file?: File | null) => {
        const formData = new FormData();
        formData.append('round_number', String(hint.roundNumber));
        formData.append('title', hint.title);
        formData.append('type', hint.type);
        formData.append('content_location', hint.contentLocation || '');
        formData.append('content_mystery_guest', hint.contentMysteryGuest || '');
        formData.append('release_date', hint.releaseDate);
        formData.append('window_end_date', hint.windowEndDate);
        formData.append('potential_points', String(hint.potentialPoints));

        if (file) {
            // Upload a real file to the media_file field.
            formData.append('media_file', file);
        } else if (hint.mediaUrl && !hint.mediaUrl.includes('/api/files/')) {
            // External media URL (e.g. Unsplash/SoundHelix/static path). Skip blob previews and
            // already-resolved PocketBase file URLs so existing uploads are preserved.
            formData.append('media_url', hint.mediaUrl);
        }

        if (hint.locationMediaUrl) {
            formData.append('media_url_location', hint.locationMediaUrl);
        }
        if (hint.mysteryGuestMediaUrl) {
            formData.append('media_url_mystery_guest', hint.mysteryGuestMediaUrl);
        }

        const existing = await pb
            .collection('hints')
            .getFirstListItem(`round_number = ${hint.roundNumber}`)
            .catch(() => null);
        if (existing) {
            await pb.collection('hints').update(existing.id, formData);
        } else {
            await pb.collection('hints').create(formData);
        }
        await queryClient.invalidateQueries({ queryKey: ['hints'] });
    };

    // Next locked hint (target of the countdown)
    const nextLockedHint = hints.find((h) => !h.isUnlocked);

    return {
        hints,
        userGuess,
        loading: isLoading,
        saveGuess,
        saveHint,
        nextLockedHint,
        activeRoundNumber,
        activeHint,
        pendingWagerPoints,
        myPredictions,
    };
}

/**
 * Reads all submitted user guesses (admin-only view), expanded with the
 * submitting user's name, ready for the payout calculations.
 */
export function useAllGuesses() {
    const {
        data: guesses = [],
        isLoading,
        refetch,
    } = useQuery<Submission[]>({
        queryKey: ['all-guesses'],
        queryFn: async () => {
            const records = await pb.collection('guesses').getFullList<GuessRecord>({
                sort: 'created',
                expand: 'user',
            });
            return records.map(toSubmission);
        },
    });

    return {
        guesses,
        loading: isLoading,
        refetch: async () => {
            await refetch();
        },
    };
}

/* -------------------------------------------------------------------------- */
/*  Per-round correct answers (admin-only)                                    */
/* -------------------------------------------------------------------------- */

interface RoundAnswerRecord {
    id: string;
    round?: number;
    correct_country?: string;
    correct_guest?: string;
}

function toRoundAnswer(rec: RoundAnswerRecord): RoundAnswer {
    return {
        id: rec.id,
        roundNumber: rec.round ?? 0,
        correctCountry: rec.correct_country || '',
        correctGuest: rec.correct_guest || '',
    };
}

/**
 * Reads the admin-managed correct answer for every round (admin-only collection).
 * Returns the answers plus an `upsertRoundAnswer` helper to save per-round answers.
 */
export function useRoundAnswers() {
    const queryClient = useQueryClient();

    const {
        data: roundAnswers = [],
        isLoading,
        refetch,
    } = useQuery<RoundAnswer[]>({
        queryKey: ['round-answers'],
        queryFn: async () => {
            const records = await pb.collection('round_answers').getFullList<RoundAnswerRecord>({
                sort: 'round',
            });
            return records.map(toRoundAnswer);
        },
    });

    /** Upserts the correct answer for a single round. */
    const upsertRoundAnswer = async (roundNumber: number, correctCountry: string, correctGuest: string) => {
        const payload = {
            round: roundNumber,
            correct_country: correctCountry,
            correct_guest: correctGuest,
        };
        const existing = await pb
            .collection('round_answers')
            .getFirstListItem(`round = ${roundNumber}`)
            .catch(() => null);
        if (existing) {
            await pb.collection('round_answers').update(existing.id, payload);
        } else {
            await pb.collection('round_answers').create(payload);
        }
        await queryClient.invalidateQueries({ queryKey: ['round-answers'] });
    };

    return {
        roundAnswers,
        loading: isLoading,
        upsertRoundAnswer,
        refetch: async () => {
            await refetch();
        },
    };
}

// Pure payout-calculation helpers for the Hints & Mysteries feature.
// Kept free of React/PocketBase so it can be unit-tested directly.

/** Bonus awarded only on the FINAL round when BOTH answers are correct. */
export const COMBO_BONUS = 50;

export interface RoundMultiplier {
    both: number;
    one: number;
}

/**
 * Multipliers applied to wagered points based on the hint round:
 * Earlier rounds carry higher multipliers due to greater uncertainty.
 */
export const ROUND_MULTIPLIERS: Record<number, RoundMultiplier> = {
    1: { both: 4.0, one: 1.75 },
    2: { both: 3.0, one: 1.5 },
    3: { both: 2.5, one: 1.25 },
    4: { both: 2.0, one: 1.1 },
    5: { both: 1.5, one: 1.0 },
};

export const DEFAULT_ROUND_MULTIPLIER: RoundMultiplier = { both: 1.5, one: 1.0 };

export function getRoundMultiplier(roundNumber?: number): RoundMultiplier {
    if (!roundNumber || !(roundNumber in ROUND_MULTIPLIERS)) {
        return DEFAULT_ROUND_MULTIPLIER;
    }
    return ROUND_MULTIPLIERS[roundNumber];
}

/** Fallback wager multiplier applied when BOTH answers are correct (legacy). */
export const MULTIPLIER_BOTH_CORRECT = 3;

/** Fallback wager multiplier applied when exactly ONE answer is correct (legacy). */
export const MULTIPLIER_ONE_CORRECT = 1.5;

/**
 * Returns the maximum wager a user is allowed to place given their available
 * saldo, or `0` when they have nothing available. This is the single source of
 * truth used to guarantee a wager can never exceed the user's balance.
 */
export function maxAllowedWager(availablePoints: number): number {
    if (!Number.isFinite(availablePoints) || availablePoints <= 0) return 0;
    return Math.floor(availablePoints);
}

/**
 * Clamps a requested wager to the user's available saldo. Never returns a value
 * higher than `availablePoints`, and always returns a non-negative integer.
 */
export function clampWagerToAvailable(requestedWager: number, availablePoints: number): number {
    const req = Number.isFinite(requestedWager) ? Math.floor(requestedWager) : 0;
    return Math.min(Math.max(0, req), maxAllowedWager(availablePoints));
}

/**
 * Sums raw point amounts into a finite total, ignoring missing/non-numeric values.
 *
 * PocketBase numbers can arrive as strings (or be missing entirely) in a stale cache
 * payload, so a naive `sum + (value || 0)` can produce `NaN`. A `NaN` balance would
 * silently propagate into the wager payload, and `JSON.stringify` turns `NaN` into
 * `null` - which PocketBase rejects with `validation_required` ("Het veld
 * wager_points is verplicht."). This helper guarantees a usable, finite total.
 */
export function sumPoints(values: unknown[]): number {
    return values.reduce<number>((sum, value) => {
        const amount = Number(value);
        return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);
}

export function countCorrect(locationCorrect: boolean, guestCorrect: boolean): number {
    return (locationCorrect ? 1 : 0) + (guestCorrect ? 1 : 0);
}

export function isGuessCorrect(locationCorrect: boolean, guestCorrect: boolean): boolean {
    return countCorrect(locationCorrect, guestCorrect) === 2;
}

/**
 * Calculates the final payout for a submitted guess.
 *
 * The base points are ONLY earned when BOTH answers are correct. The round multiplier
 * applies ONLY to the WAGERED points (the amount taken from the participant's point balance),
 * never to the base.
 *
 * - Both correct:  Base + Wager * roundMultiplier.both (plus the 50pt Combo Bonus on the final round)
 * - One correct:   Wager * roundMultiplier.one (NO base points)
 * - Both wrong:    -Wager (the participant loses all of their wagered points)
 */
export function calculatePayout(
    basePoints: number,
    wagerPoints: number,
    locationCorrect: boolean,
    guestCorrect: boolean,
    isFinalRound: boolean,
    roundNumber?: number
): number {
    const correct = countCorrect(locationCorrect, guestCorrect);
    const effectiveRound = roundNumber ?? (isFinalRound ? 5 : 1);
    const multiplier = getRoundMultiplier(effectiveRound);

    if (correct === 2) {
        return basePoints + wagerPoints * multiplier.both + (isFinalRound ? COMBO_BONUS : 0);
    }
    if (correct === 1) {
        return wagerPoints * multiplier.one;
    }
    return -wagerPoints;
}

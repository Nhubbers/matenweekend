// Pure payout-calculation helpers for the Hints & Mysteries feature.
// Kept free of React/PocketBase so it can be unit-tested directly.

/** Bonus awarded only on the FINAL round when BOTH answers are correct. */
export const COMBO_BONUS = 50;

/** Wager multiplier applied when BOTH answers are correct. */
export const MULTIPLIER_BOTH_CORRECT = 3;

/** Wager multiplier applied when exactly ONE answer is correct. */
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

export function countCorrect(locationCorrect: boolean, guestCorrect: boolean): number {
    return (locationCorrect ? 1 : 0) + (guestCorrect ? 1 : 0);
}

export function isGuessCorrect(locationCorrect: boolean, guestCorrect: boolean): boolean {
    return countCorrect(locationCorrect, guestCorrect) === 2;
}

/**
 * Calculates the final payout for a submitted guess.
 *
 * The base points are ONLY earned when BOTH answers are correct. The x1.5 / x3
 * multiplier applies ONLY to the WAGERED points (the amount taken from the
 * participant's point balance), never to the base.
 *
 * - Both correct:  Base + Wager * 3 (plus the 50pt Combo Bonus on the final round)
 * - One correct:   Wager * 1.5 (NO base points)
 * - Both wrong:    -Wager (the participant loses all of their wagered points)
 */
export function calculatePayout(
    basePoints: number,
    wagerPoints: number,
    locationCorrect: boolean,
    guestCorrect: boolean,
    isFinalRound: boolean
): number {
    const correct = countCorrect(locationCorrect, guestCorrect);

    if (correct === 2) {
        return basePoints + wagerPoints * MULTIPLIER_BOTH_CORRECT + (isFinalRound ? COMBO_BONUS : 0);
    }
    if (correct === 1) {
        return wagerPoints * MULTIPLIER_ONE_CORRECT;
    }
    return -wagerPoints;
}

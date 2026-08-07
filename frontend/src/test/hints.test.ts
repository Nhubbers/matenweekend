import { describe, it, expect } from 'vitest';
import { INITIAL_HINTS, EUROPEAN_COUNTRIES } from '../data/mockHints';
import { calculatePayout, COMBO_BONUS } from '../lib/guessPayout';

describe('Hints Feature Data & Logic', () => {
    it('should contain 5 scheduled hints', () => {
        expect(INITIAL_HINTS.length).toBe(5);
    });

    it('should have Hint 1 as unlocked image clue and Hint 2 as audio clue', () => {
        const hint1 = INITIAL_HINTS[0];
        const hint2 = INITIAL_HINTS[1];

        expect(hint1.type).toBe('image');
        expect(hint1.isUnlocked).toBe(true);

        expect(hint2.type).toBe('audio');
    });

    it('should have placeholders for hints 3 and 4', () => {
        const placeholders = [INITIAL_HINTS[2], INITIAL_HINTS[3]];
        placeholders.forEach((h) => {
            expect(h.contentLocation).toContain('Placeholder');
        });
    });

    it('should provide a list of European countries for location selection', () => {
        expect(EUROPEAN_COUNTRIES).toContain('Spanje');
        expect(EUROPEAN_COUNTRIES).toContain('Portugal');
        expect(EUROPEAN_COUNTRIES.length).toBeGreaterThan(10);
    });
});

describe('Guess Payout Calculation', () => {
    it('awards full Base + (Wager * 3) when both answers are correct (non-final round)', () => {
        expect(calculatePayout(75, 20, true, true, false)).toBe(75 + 20 * 3);
    });

    it('awards full Base + (Wager * 3) plus the 50pt combo bonus on the final round when both are correct', () => {
        expect(calculatePayout(75, 20, true, true, true)).toBe(75 + 20 * 3 + COMBO_BONUS);
    });

    it('awards only (Wager * 1.5) and NO base when exactly one answer is correct', () => {
        expect(calculatePayout(75, 20, true, false, false)).toBe(20 * 1.5);
        expect(calculatePayout(75, 20, false, true, false)).toBe(20 * 1.5);
    });

    it('makes the participant lose all wagered points (and no base) when both answers are wrong', () => {
        expect(calculatePayout(75, 20, false, false, false)).toBe(-20);
    });

    it('never applies the combo bonus outside the final round', () => {
        expect(calculatePayout(10, 10, true, true, false)).toBe(10 + 10 * 3); // no +50
        expect(calculatePayout(10, 10, true, true, true)).toBe(10 + 10 * 3 + COMBO_BONUS); // +50
    });

    it('the multiplier only scales the wagered points, never the base', () => {
        // base stays flat (10) regardless of the wager multiplier
        expect(calculatePayout(10, 10, true, true, false)).toBe(10 + 10 * 3);
        expect(calculatePayout(10, 20, true, true, false)).toBe(10 + 20 * 3);
        // one correct -> no base, only the wagered points scaled
        expect(calculatePayout(10, 10, true, false, false)).toBe(10 * 1.5);
    });
});

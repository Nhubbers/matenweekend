import { describe, it, expect } from 'vitest';
import { INITIAL_HINTS, EUROPEAN_COUNTRIES } from '../data/mockHints';
import {
    calculatePayout,
    COMBO_BONUS,
    ROUND_MULTIPLIERS,
    getRoundMultiplier,
    clampWagerToAvailable,
    maxAllowedWager,
    sumPoints,
} from '../lib/guessPayout';
import { detectMediaKind, detectFileMediaKind } from '../lib/hintMedia';

describe('Hints Feature Data & Logic', () => {
    it('should contain 5 scheduled hints', () => {
        expect(INITIAL_HINTS.length).toBe(5);
    });

    it('should have Hint 1 as unlocked image clue and Hint 2 as combined audio/image clue', () => {
        const hint1 = INITIAL_HINTS[0];
        const hint2 = INITIAL_HINTS[1];

        expect(hint1.type).toBe('image');
        expect(hint1.isUnlocked).toBe(true);

        expect(hint2.type).toBe('combined');
        expect(hint2.contentLocation).toBeDefined();
        expect(hint2.contentMysteryGuest).toBeDefined();
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

describe('Round Multipliers Configuration', () => {
    it('defines the correct multiplier schedule for all 5 rounds', () => {
        expect(ROUND_MULTIPLIERS[1]).toEqual({ both: 4.0, one: 1.75 });
        expect(ROUND_MULTIPLIERS[2]).toEqual({ both: 3.0, one: 1.5 });
        expect(ROUND_MULTIPLIERS[3]).toEqual({ both: 2.5, one: 1.25 });
        expect(ROUND_MULTIPLIERS[4]).toEqual({ both: 2.0, one: 1.1 });
        expect(ROUND_MULTIPLIERS[5]).toEqual({ both: 1.5, one: 1.0 });
    });

    it('getRoundMultiplier falls back to round 5 / default for unknown rounds', () => {
        expect(getRoundMultiplier(99)).toEqual({ both: 1.5, one: 1.0 });
        expect(getRoundMultiplier(undefined)).toEqual({ both: 1.5, one: 1.0 });
    });
});

describe('Guess Payout Calculation per Round', () => {
    it('Round 1 applies 4.0x for both correct and 1.75x for one correct', () => {
        // Both correct: Base (75) + 20 * 4.0
        expect(calculatePayout(75, 20, true, true, false, 1)).toBe(75 + 20 * 4.0);
        // One correct: 20 * 1.75 (no base)
        expect(calculatePayout(75, 20, true, false, false, 1)).toBe(20 * 1.75);
        expect(calculatePayout(75, 20, false, true, false, 1)).toBe(20 * 1.75);
    });

    it('Round 2 applies 3.0x for both correct and 1.50x for one correct', () => {
        expect(calculatePayout(60, 20, true, true, false, 2)).toBe(60 + 20 * 3.0);
        expect(calculatePayout(60, 20, true, false, false, 2)).toBe(20 * 1.5);
    });

    it('Round 3 applies 2.5x for both correct and 1.25x for one correct', () => {
        expect(calculatePayout(45, 20, true, true, false, 3)).toBe(45 + 20 * 2.5);
        expect(calculatePayout(45, 20, true, false, false, 3)).toBe(20 * 1.25);
    });

    it('Round 4 applies 2.0x for both correct and 1.10x for one correct', () => {
        expect(calculatePayout(30, 20, true, true, false, 4)).toBe(30 + 20 * 2.0);
        expect(calculatePayout(30, 20, true, false, false, 4)).toBe(20 * 1.1);
    });

    it('Round 5 applies 1.5x for both correct (+50 combo) and 1.00x (break-even) for one correct', () => {
        expect(calculatePayout(15, 20, true, true, true, 5)).toBe(15 + 20 * 1.5 + COMBO_BONUS);
        expect(calculatePayout(15, 20, true, false, true, 5)).toBe(20 * 1.0);
    });

    it('makes the participant lose all wagered points (and no base) when both answers are wrong', () => {
        expect(calculatePayout(75, 20, false, false, false, 1)).toBe(-20);
        expect(calculatePayout(15, 20, false, false, true, 5)).toBe(-20);
    });

    it('never applies the combo bonus outside the final round', () => {
        expect(calculatePayout(10, 10, true, true, false, 5)).toBe(10 + 10 * 1.5); // no +50
        expect(calculatePayout(10, 10, true, true, true, 5)).toBe(10 + 10 * 1.5 + COMBO_BONUS); // +50
    });

    it('the multiplier only scales the wagered points, never the base', () => {
        // base stays flat (10) regardless of the wager amount
        expect(calculatePayout(10, 10, true, true, false, 1)).toBe(10 + 10 * 4.0);
        expect(calculatePayout(10, 20, true, true, false, 1)).toBe(10 + 20 * 4.0);
        // one correct -> no base, only the wagered points scaled
        expect(calculatePayout(10, 10, true, false, false, 1)).toBe(10 * 1.75);
    });
});

describe('Hint media kind detection', () => {
    it('classifies audio URLs (including query strings) as audio', () => {
        expect(detectMediaKind('https://cdn.example/clip.mp3')).toBe('audio');
        expect(detectMediaKind('https://cdn.example/voix.wav?token=abc')).toBe('audio');
        expect(detectMediaKind('https://cdn.example/audio/teaser')).toBe('audio');
    });

    it('classifies both classic image extensions and CDN-style image URLs as images', () => {
        expect(detectMediaKind('https://cdn.example/photo.jpg')).toBe('image');
        expect(detectMediaKind('https://cdn.example/pic/round3.png')).toBe('image');
        expect(detectMediaKind('https://images.unsplash.com/photo-1488646953014?auto=format')).toBe('image');
    });

    it('correctly handles either role holding either media kind', () => {
        // audio for the location, image for the mystery guest
        expect(detectMediaKind('https://cdn.example/location-birdsong.mp3')).toBe('audio');
        expect(detectMediaKind('https://cdn.example/mystery-guest-baby.png')).toBe('image');
        // image for the location, audio for the mystery guest (the reverse)
        expect(detectMediaKind('https://cdn.example/location-photo.webp')).toBe('image');
        expect(detectMediaKind('https://cdn.example/mystery-guest-voice.mp3')).toBe('audio');
    });

    it('returns none for empty, unknown or query-only values', () => {
        expect(detectMediaKind(undefined)).toBe('none');
        expect(detectMediaKind('')).toBe('none');
        expect(detectMediaKind('https://cdn.example/file.xyz')).toBe('none');
    });

    it('maps browser File MIME types for the live preview blob URLs', () => {
        const audioFile = new File([''], 'clip.mp3', { type: 'audio/mpeg' });
        const imageFile = new File([''], 'photo.png', { type: 'image/png' });
        const fallbackFile = new File([''], 'voice.wav', { type: '' });
        expect(detectFileMediaKind(audioFile)).toBe('audio');
        expect(detectFileMediaKind(imageFile)).toBe('image');
        expect(detectFileMediaKind(fallbackFile)).toBe('audio'); // from file name
        expect(detectFileMediaKind(null)).toBe('none');
    });
});

describe('Wager vs saldo (fool-proof invariant)', () => {
    it('never allows a wager above the available saldo', () => {
        expect(clampWagerToAvailable(50, 30)).toBe(30);
        expect(clampWagerToAvailable(100, 30)).toBe(30);
        expect(clampWagerToAvailable(30, 30)).toBe(30);
    });

    it('clamps to 0 when the user has no available saldo, or for negative/NaN input', () => {
        expect(maxAllowedWager(0)).toBe(0);
        expect(maxAllowedWager(-5)).toBe(0);
        expect(maxAllowedWager(Number.NaN)).toBe(0);
        expect(clampWagerToAvailable(50, 0)).toBe(0);
        expect(clampWagerToAvailable(NaN, 30)).toBe(0);
        expect(clampWagerToAvailable(-10, 30)).toBe(0);
    });

    it('rounds available balance down so a fractional saldo cannot be over-wagered', () => {
        expect(maxAllowedWager(23.7)).toBe(23);
        expect(clampWagerToAvailable(99, 23.7)).toBe(23);
    });

    it('still allows a 0-point prediction when the participant has no saldo (regression)', () => {
        // A participant with 0 saldo must be able to submit an answer with a 0 wager.
        // PocketBase rejects the value 0 for a *number* field marked `required`
        // ("Required will require the field value to be non-zero"), so `wager_points`
        // is optional in the schema and the payload must simply carry 0.
        const wager = clampWagerToAvailable(0, 0);
        expect(wager).toBe(0);
        expect(JSON.stringify({ wager_points: wager })).toBe('{"wager_points":0}');
    });

    it('never emits NaN/Infinity as the wager, even when the saldo is broken', () => {
        // JSON.stringify turns NaN into null, which PocketBase rejects with
        // "Het veld wager_points is verplicht." - so the wager must always be finite.
        [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY].forEach((balance) => {
            const wager = clampWagerToAvailable(50, balance);
            expect(Number.isFinite(wager)).toBe(true);
            expect(wager).toBe(0);
        });
    });
});

describe('sumPoints (finite point totals)', () => {
    it('sums numeric amounts and numeric strings', () => {
        expect(sumPoints([10, 5, -3])).toBe(12);
        expect(sumPoints(['10', '5'])).toBe(15);
    });

    it('ignores missing/non-numeric values so a balance can never become NaN', () => {
        expect(sumPoints([])).toBe(0);
        expect(sumPoints([undefined, null, Number.NaN, 20])).toBe(20);
        expect(sumPoints([Number.NaN])).toBe(0);
        expect(Number.isFinite(sumPoints([{}, Number.POSITIVE_INFINITY]))).toBe(true);
    });
});

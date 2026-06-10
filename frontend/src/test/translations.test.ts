import { describe, it, expect } from 'vitest';
import { nl } from '@/lib/translations';

describe('Translations Completeness', () => {
    it('should have a defined translations object', () => {
        expect(nl).toBeDefined();
        expect(typeof nl).toBe('object');
    });

    it('should contain key UI and error translations', () => {
        expect(nl.home).toBe('Home');
        expect(nl.activities).toBe('Activiteiten');
        expect(nl.ranking).toBe('Ranking');
        expect(nl.profile).toBe('Profiel');
        expect(nl.login).toBe('Inloggen');
    });

    it('should not contain any empty translation values', () => {
        Object.entries(nl).forEach(([_, value]) => {
            expect(value).toBeDefined();
            expect(typeof value).toBe('string');
            expect(value.trim().length).toBeGreaterThan(0);
        });
    });
});

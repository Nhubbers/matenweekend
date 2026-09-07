import { describe, it, expect } from 'vitest';
import { ClientResponseError } from 'pocketbase';
import { getErrorMessage } from '../lib/errors';

/**
 * A helper that mimics how the pocketbase SDK wraps an HTTP error body:
 * `err.data` returns the parsed response body (see ClientResponseError#get data()).
 */
function makeError(body: unknown, status = 400): ClientResponseError {
    return new ClientResponseError({ status, data: body });
}

describe('getErrorMessage', () => {
    it('surfaces the real field name for a nested validation error (the reported bug)', () => {
        const err = makeError({
            status: 400,
            message: 'Failed to create record.',
            data: {
                wager_points: { code: 'validation_min', message: 'Must be between 0 and 100.' },
            },
        });
        expect(getErrorMessage(err)).toBe('Must be between 0 and 100.');
        expect(getErrorMessage(err)).not.toContain('data');
    });

    it('maps validation_required to a clear Dutch required-field message', () => {
        const err = makeError({
            status: 400,
            message: 'Failed to create record.',
            data: {
                location_country: { code: 'validation_required', message: 'A value is required.' },
            },
        });
        expect(getErrorMessage(err)).toBe('Het veld location_country is verplicht.');
    });

    it('maps validation_not_unique to a Dutch uniqueness message', () => {
        const err = makeError({
            status: 400,
            message: 'Failed to create record.',
            data: {
                email: { code: 'validation_not_unique', message: 'Already exists.' },
            },
        });
        expect(getErrorMessage(err)).toBe('Dit veld (email) bestaat al en moet uniek zijn.');
    });

    it('shows the top-level message for hook-thrown BadRequestErrors (e.g. the wager-balance guard)', () => {
        const err = makeError({
            status: 400,
            message: 'Inzet (30 pts) is hoger dan je beschikbare saldo (20 pts).',
            data: {},
        });
        expect(getErrorMessage(err)).toBe('Inzet (30 pts) is hoger dan je beschikbare saldo (20 pts).');
    });

    it('falls back to a status-code message when the body has no details', () => {
        const forbidden = makeError({ message: '', data: {} }, 403);
        expect(getErrorMessage(forbidden)).toBe('Je hebt geen rechten om deze actie uit te voeren.');

        const generic = new Error('Netwerkfout');
        expect(getErrorMessage(generic)).toBe('Netwerkfout');
    });
});

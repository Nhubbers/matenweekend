import { describe, it, expect } from 'vitest';
import { formatDate, formatDateRange, getDisplayName, getStatusBadgeClass, getStatusLabel } from '@/lib/utils';
import type { User } from '@/types';

describe('Utility Functions', () => {
    describe('formatDate', () => {
        it('should format a date string properly', () => {
            const dateStr = '2026-06-10T12:00:00.000Z';
            // Output depends on the local timezone or UTC since it uses parseISO
            const result = formatDate(dateStr);
            expect(result).toContain('2026');
            expect(result).toContain('jun');
        });
    });

    describe('formatDateRange', () => {
        it('should format single date when end date is missing', () => {
            const startStr = '2026-06-10T12:00:00.000Z';
            const result = formatDateRange(startStr);
            expect(result).toContain('2026');
        });

        it('should format range on the same day concisely', () => {
            const startStr = '2026-06-10T12:00:00.000Z';
            const endStr = '2026-06-10T15:00:00.000Z';
            const result = formatDateRange(startStr, endStr);
            expect(result).toContain('-');
        });
    });

    describe('getDisplayName', () => {
        it('should fallback to Onbekend when user is undefined', () => {
            expect(getDisplayName(undefined)).toBe('Onbekend');
        });

        it('should return user name if available', () => {
            const user = { name: 'John Doe', email: 'john@example.com' } as User;
            expect(getDisplayName(user)).toBe('John Doe');
        });

        it('should return email username if name is empty', () => {
            const user = { name: '', email: 'alice@example.com' } as User;
            expect(getDisplayName(user)).toBe('alice');
        });
    });

    describe('getStatusBadgeClass', () => {
        it('should return correct badge class for open', () => {
            expect(getStatusBadgeClass('open')).toBe('badge-success');
        });

        it('should return correct badge class for completed', () => {
            expect(getStatusBadgeClass('completed')).toBe('badge-neutral');
        });

        it('should return correct badge class for cancelled', () => {
            expect(getStatusBadgeClass('cancelled')).toBe('badge-error');
        });
    });

    describe('getStatusLabel', () => {
        it('should translate statuses to Dutch', () => {
            expect(getStatusLabel('open')).toBe('Open');
            expect(getStatusLabel('completed')).toBe('Afgerond');
            expect(getStatusLabel('cancelled')).toBe('Geannuleerd');
        });
    });
});

import { describe, it, expect } from 'vitest';
import { generateIcsContent } from '@/lib/ics';
import type { Activity } from '@/types';

describe('ICS Calendar Generation', () => {
    it('should generate valid basic ICS calendar file format', () => {
        const dummyActivity: Activity = {
            id: 'test-123',
            title: 'Matenweekend Borrel',
            description: 'Gezellig bieren met de maten, tot snel!',
            start_time: '2026-06-10T20:00:00.000Z',
            end_time: '2026-06-10T23:00:00.000Z',
            status: 'open',
            points_participant: 5,
            points_creator: 10,
            points_organizer_per_participant: 1,
            max_participants: 20,
            creator: 'user-1',
            co_organizers: [],
            image: '',
            completion_image: '',
            created: '2026-06-10T12:00:00.000Z',
            updated: '2026-06-10T12:00:00.000Z',
            collectionId: 'activities',
            collectionName: 'activities',
        };

        const icsContent = generateIcsContent(dummyActivity);

        expect(icsContent).toContain('BEGIN:VCALENDAR');
        expect(icsContent).toContain('VERSION:2.0');
        expect(icsContent).toContain('PRODID:-//Matenweekend//Activity//NL');
        expect(icsContent).toContain('BEGIN:VEVENT');
        expect(icsContent).toContain('UID:activity-test-123@matenweekend.nl');
        expect(icsContent).toContain('SUMMARY:Matenweekend Borrel');
        expect(icsContent).toContain('DESCRIPTION:Gezellig bieren met de maten\\, tot snel!');
        expect(icsContent).toContain('STATUS:CONFIRMED');
        expect(icsContent).toContain('END:VEVENT');
        expect(icsContent).toContain('END:VCALENDAR');
    });
});

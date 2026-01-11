import type { Activity } from '@/types';
import { parseISO } from 'date-fns';

export function generateIcsContent(activity: Activity): string {
    const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startTime = formatDate(parseISO(activity.start_time));
    const endTime = activity.end_time ? formatDate(parseISO(activity.end_time)) : startTime;

    // Escape special characters in text fields
    const escapeText = (text: string) => {
        return text
            .replace(/\\/g, '\\\\')
            .replace(/;/g, '\\;')
            .replace(/,/g, '\\,')
            .replace(/\n/g, '\\n');
    };

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Matenweekend//Activity//NL',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `UID:activity-${activity.id}@matenweekend.nl`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${startTime}`,
        `DTEND:${endTime}`,
        `SUMMARY:${escapeText(activity.title)}`,
        `DESCRIPTION:${escapeText(activity.description)}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
    ];

    return lines.join('\r\n');
}

export function downloadActivityIcs(activity: Activity) {
    const content = generateIcsContent(activity);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);

    // Create a temporary link and click it
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activity.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

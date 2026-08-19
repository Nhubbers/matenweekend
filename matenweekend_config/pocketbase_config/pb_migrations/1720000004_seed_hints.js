// Migration: Seed the 5 hint rounds into the `hints` collection so they are managed
// entirely from the backend (no local/seed fallback in the app). Idempotent - any
// round that already exists (by round_number) is left untouched, so existing admin
// edits / uploaded media are preserved.
migrate(
    (app) => {
        const hints = app.findCollectionByNameOrId('hints');

        const seeds = [
            {
                round_number: 1,
                title: 'Hint #1',
                type: 'image',
                content_location:
                    'Blik op het portret,\ngeen heilig boontje,\nzwart geld in de kluis.\n\nBerekenend stram,\nleider of lijder in nood,\nkoud achter het stuur.\n\nTrap niet in de truc,\nnaar zijn schimmige belangen:\ngo Ajax, hu is box hangen',
                content_mystery_guest: '',
                release_date: '2026-08-06 12:00:00',
                window_end_date: '2026-08-13 23:59:59',
                potential_points: 75,
            },
            {
                round_number: 2,
                title: 'Hint #2',
                type: 'combined',
                content_location: 'Eentje voor de vogelaars onder ons!',
                content_mystery_guest: 'Herken jij de MG op deze schattige babyfoto?!',
                release_date: '2026-08-20 00:00:00',
                window_end_date: '2026-08-27 23:59:59',
                potential_points: 60,
            },
            {
                round_number: 3,
                title: 'Hint #3',
                type: 'text',
                content_location: '[Placeholder] Deze hint wordt nog ingevuld door de organisatie.',
                content_mystery_guest: '[Placeholder] Deze hint wordt nog ingevuld door de organisatie.',
                release_date: '2026-09-03 12:00:00',
                window_end_date: '2026-09-10 23:59:59',
                potential_points: 45,
            },
            {
                round_number: 4,
                title: 'Hint #4',
                type: 'text',
                content_location: '[Placeholder] Deze hint wordt nog ingevuld door de organisatie.',
                content_mystery_guest: '[Placeholder] Deze hint wordt nog ingevuld door de organisatie.',
                release_date: '2026-09-17 12:00:00',
                window_end_date: '2026-09-24 23:59:59',
                potential_points: 30,
            },
            {
                round_number: 5,
                title: 'Hint #5',
                type: 'combined',
                content_location: 'De allerlaatste kans om je definitieve land te kiezen uit het keuzemenu!',
                content_mystery_guest: 'Vul de exacte volledige naam van de Mystery Guest in!',
                release_date: '2026-09-24 12:00:00',
                window_end_date: '2026-10-01 12:00:00',
                potential_points: 15,
            },
        ];

        seeds.forEach((s) => {
            const existing = app.findRecordsByFilter('hints', 'round_number = ' + s.round_number);
            if (existing.length > 0) return; // already present - do not overwrite

            const record = new Record(hints);
            record.set('round_number', s.round_number);
            record.set('title', s.title);
            record.set('type', s.type);
            record.set('content_location', s.content_location);
            record.set('content_mystery_guest', s.content_mystery_guest);
            record.set('release_date', s.release_date);
            record.set('window_end_date', s.window_end_date);
            record.set('potential_points', s.potential_points);
            app.save(record);
        });
    },
    (app) => {
        // no-op: seed data is additive and intentionally left in place
    }
);

// Migration: Add `hints`, `guesses` and `hint_schedules` collections
// Additive - only creates new collections, leaves existing data untouched.
migrate(
    (app) => {
        const hints = new Collection({
            id: 'pbc_hints',
            name: 'hints',
            type: 'base',
            listRule: "@request.auth.id != ''",
            viewRule: "@request.auth.id != ''",
            fields: [
                { name: 'round_number', type: 'number', required: true, min: 1, onlyInt: true },
                { name: 'title', type: 'text', required: true },
                { name: 'type', type: 'select', required: true, values: ['image', 'audio', 'text', 'combined'] },
                { name: 'media_url', type: 'url' },
                { name: 'content_location', type: 'text' },
                { name: 'content_mystery_guest', type: 'text' },
                { name: 'release_date', type: 'date', required: true },
                { name: 'window_end_date', type: 'date', required: true },
                { name: 'potential_points', type: 'number', min: 0, onlyInt: true },
            ],
        });
        app.save(hints);

        const guesses = new Collection({
            id: 'pbc_guesses',
            name: 'guesses',
            type: 'base',
            listRule: 'user = @request.auth.id || @request.auth.isAdmin = true',
            viewRule: 'user = @request.auth.id || @request.auth.isAdmin = true',
            createRule: '@request.auth.id = user',
            updateRule: 'user = @request.auth.id && resolved = false || @request.auth.isAdmin = true',
            deleteRule: '@request.auth.isAdmin = true',
            fields: [
                {
                    name: 'user',
                    type: 'relation',
                    relationCollectionName: 'users',
                    relationMaxSelect: 1,
                    required: true,
                },
                { name: 'round_number', type: 'number', required: true, min: 1, onlyInt: true },
                { name: 'location_country', type: 'text', required: true },
                { name: 'mystery_guest_name', type: 'text', required: true },
                { name: 'wager_points', type: 'number', required: true, min: 0, onlyInt: true },
                { name: 'submitted_at', type: 'date' },
                { name: 'resolved', type: 'bool' },
                { name: 'awarded_points', type: 'number', onlyInt: true },
            ],
        });
        app.save(guesses);

        const schedules = new Collection({
            id: 'pbc_hint_schedules',
            name: 'hint_schedules',
            type: 'base',
            listRule: "@request.auth.id != ''",
            viewRule: "@request.auth.id != ''",
            fields: [
                { name: 'round', type: 'number', required: true, min: 1, onlyInt: true },
                { name: 'hint', type: 'relation', relationCollectionName: 'hints', relationMaxSelect: 1 },
                { name: 'release_at', type: 'date', required: true },
                { name: 'window_end_at', type: 'date', required: true },
            ],
        });
        app.save(schedules);
    },
    (app) => {
        ['hint_schedules', 'guesses', 'hints'].forEach((name) => {
            try {
                const c = app.findCollectionByNameOrId(name);
                if (c) app.delete(c);
            } catch (err) {
                // collection already absent - ignore
            }
        });
    }
);

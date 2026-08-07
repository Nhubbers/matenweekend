// Migration: Add `round_answers` collection (admin-only per-round correct answers).
// Additive - only creates a new collection, leaves existing data untouched.
migrate(
    (app) => {
        const roundAnswers = new Collection({
            id: 'pbc_round_answers',
            name: 'round_answers',
            type: 'base',
            listRule: '@request.auth.isAdmin = true',
            viewRule: '@request.auth.isAdmin = true',
            createRule: '@request.auth.isAdmin = true',
            updateRule: '@request.auth.isAdmin = true',
            deleteRule: '@request.auth.isAdmin = true',
            fields: [
                { name: 'round', type: 'number', required: true, min: 1, onlyInt: true },
                { name: 'correct_country', type: 'text', required: true },
                { name: 'correct_guest', type: 'text', required: true },
            ],
        });
        app.save(roundAnswers);
    },
    (app) => {
        try {
            const c = app.findCollectionByNameOrId('round_answers');
            if (c) app.delete(c);
        } catch (err) {
            // collection already absent - ignore
        }
    }
);

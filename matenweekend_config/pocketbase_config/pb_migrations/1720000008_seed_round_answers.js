// Migration: Seed official answers into `round_answers` collection
// Location: Albanië
// Mystery Guest: Max Derks
migrate(
    (app) => {
        const roundAnswers = app.findCollectionByNameOrId('round_answers');

        const rounds = [1, 2, 3, 4, 5];
        rounds.forEach((roundNumber) => {
            const existing = app.findRecordsByFilter('round_answers', 'round = ' + roundNumber);
            if (existing.length > 0) {
                const record = existing[0];
                record.set('correct_country', 'Albanië');
                record.set('correct_guest', 'Max Derks');
                app.save(record);
            } else {
                const record = new Record(roundAnswers);
                record.set('round', roundNumber);
                record.set('correct_country', 'Albanië');
                record.set('correct_guest', 'Max Derks');
                app.save(record);
            }
        });
    },
    (app) => {
        // no-op
    }
);

// Migration: Add the standard `created`/`updated` autodate fields to the
// hints/guesses/hint_schedules/round_answers collections. The initial creation
// migration only added `id` + custom fields, so these collections were missing
// created/updated - which broke any query that sorts by `created`.
migrate(
    (app) => {
        ['hints', 'guesses', 'hint_schedules', 'round_answers'].forEach((name) => {
            try {
                const c = app.findCollectionByNameOrId(name);
                c.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }));
                c.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }));
                app.save(c);
            } catch (err) {
                console.log('autodate add skipped for ' + name + ': ' + err);
            }
        });
    },
    (app) => {
        ['hints', 'guesses', 'hint_schedules', 'round_answers'].forEach((name) => {
            try {
                const c = app.findCollectionByNameOrId(name);
                c.fields.removeByName('created');
                c.fields.removeByName('updated');
                app.save(c);
            } catch (err) {}
        });
    }
);

// Migration: make `guesses.wager_points` OPTIONAL so a 0-point prediction can be saved.
//
// Why: PocketBase treats a *number* field with `required: true` as "must be non-zero"
// (core/field_number.go: "Required will require the field value to be non-zero").
// A participant with no available saldo must still be able to submit an answer with a
// 0-point wager, but that write is rejected server-side with `validation_required` on
// `wager_points`, which surfaces in the UI as "Het veld wager_points is verplicht.".
//
// The field keeps `min: 0` (never negative) and `onlyInt`, and the underlying column is
// `NUMERIC DEFAULT 0 NOT NULL`, so a missing value is stored as 0. The real upper bound
// (the participant's available saldo) is enforced by the `guesses` onRecordCreate /
// onRecordUpdate hooks in pb_hooks/main.pb.js.
migrate(
    (app) => {
        const guesses = app.findCollectionByNameOrId('guesses');
        const wagerField = guesses.fields.getByName('wager_points');
        if (wagerField) wagerField.required = false;
        app.save(guesses);
    },
    (app) => {
        const guesses = app.findCollectionByNameOrId('guesses');
        const wagerField = guesses.fields.getByName('wager_points');
        if (wagerField) wagerField.required = true;
        app.save(guesses);
    }
);

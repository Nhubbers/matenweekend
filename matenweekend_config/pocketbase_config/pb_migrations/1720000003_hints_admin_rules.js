// Migration: Grant app admins (users with isAdmin = true) write access to the
// `hints` and `hint_schedules` collections. Previously these were superuser-only,
// which made in-app admin saves fail with 403/400.
migrate(
    (app) => {
        const hints = app.findCollectionByNameOrId('hints');
        hints.createRule = '@request.auth.isAdmin = true';
        hints.updateRule = '@request.auth.isAdmin = true';
        hints.deleteRule = '@request.auth.isAdmin = true';
        app.save(hints);

        const schedules = app.findCollectionByNameOrId('hint_schedules');
        schedules.createRule = '@request.auth.isAdmin = true';
        schedules.updateRule = '@request.auth.isAdmin = true';
        schedules.deleteRule = '@request.auth.isAdmin = true';
        app.save(schedules);
    },
    (app) => {
        const hints = app.findCollectionByNameOrId('hints');
        hints.createRule = null;
        hints.updateRule = null;
        hints.deleteRule = null;
        app.save(hints);

        const schedules = app.findCollectionByNameOrId('hint_schedules');
        schedules.createRule = null;
        schedules.updateRule = null;
        schedules.deleteRule = null;
        app.save(schedules);
    }
);

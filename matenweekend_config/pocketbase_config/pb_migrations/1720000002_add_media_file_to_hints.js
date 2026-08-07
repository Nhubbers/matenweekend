// Migration: Add a `media_file` file field to the `hints` collection so admins can
// upload an actual image/audio file (instead of only an external URL). Additive.
migrate(
    (app) => {
        const hints = app.findCollectionByNameOrId('hints');
        hints.fields.add(
            new FileField({
                name: 'media_file',
                maxSelect: 1,
                maxSize: 15728640, // 15MB
                mimeTypes: [
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                    'image/gif',
                    'image/heic',
                    'audio/mpeg',
                    'audio/mp3',
                    'audio/wav',
                    'audio/ogg',
                    'audio/m4a',
                ],
            })
        );
        app.save(hints);
    },
    (app) => {
        const hints = app.findCollectionByNameOrId('hints');
        hints.fields.removeByName('media_file');
        app.save(hints);
    }
);

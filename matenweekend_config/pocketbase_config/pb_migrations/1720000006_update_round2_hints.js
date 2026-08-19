// Migration: Add dual media file and URL fields to the `hints` collection
// (media_file_location, media_file_mystery_guest, media_url_location, media_url_mystery_guest)
// and set Round #2 metadata ready for media upload via PocketBase Admin / API.
migrate(
    (app) => {
        const hintsCollection = app.findCollectionByNameOrId('hints');

        const allowedMimeTypes = [
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
        ];

        if (!hintsCollection.fields.getByName('media_file_location')) {
            hintsCollection.fields.add(
                new FileField({
                    name: 'media_file_location',
                    maxSelect: 1,
                    maxSize: 15728640,
                    mimeTypes: allowedMimeTypes,
                })
            );
        }
        if (!hintsCollection.fields.getByName('media_file_mystery_guest')) {
            hintsCollection.fields.add(
                new FileField({
                    name: 'media_file_mystery_guest',
                    maxSelect: 1,
                    maxSize: 15728640,
                    mimeTypes: allowedMimeTypes,
                })
            );
        }
        if (!hintsCollection.fields.getByName('media_url_location')) {
            hintsCollection.fields.add(
                new TextField({
                    name: 'media_url_location',
                    max: 2000,
                })
            );
        }
        if (!hintsCollection.fields.getByName('media_url_mystery_guest')) {
            hintsCollection.fields.add(
                new TextField({
                    name: 'media_url_mystery_guest',
                    max: 2000,
                })
            );
        }
        app.save(hintsCollection);

        const round2Records = app.findRecordsByFilter('hints', 'round_number = 2');
        if (round2Records.length > 0) {
            const r2 = round2Records[0];
            r2.set('type', 'combined');
            r2.set(
                'content_location',
                'Luister naar het zanggeluid van deze vogel om de geheime locatie te achterhalen!'
            );
            r2.set('content_mystery_guest', 'Herken jij de Mystery Guest op deze schattige babyfoto?');
            app.save(r2);
        }
    },
    (app) => {}
);

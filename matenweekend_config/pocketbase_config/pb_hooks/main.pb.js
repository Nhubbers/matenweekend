/// <reference path="../pb_data/types.d.ts" />

console.log('!!! LOADING HOOKS - START !!!');

// ============================================
// HOOK 1: Award points when activity is completed
// ============================================
onRecordAfterUpdateSuccess((e) => {
    const record = e.record;

    // 1. Handle reopening: If status is set back to 'open', remove old transactions
    if (record.get('status') === 'open') {
        try {
            // Find all transactions related to this activity
            const transactions = $app.findRecordsByFilter(
                'point_transactions',
                "activity = '" + record.id + "'"
            );

            // Delete them to reset the state
            transactions.forEach((tx) => {
                $app.delete(tx);
            });

            if (transactions.length > 0) {
                console.log('Activity reopened: Removed ' + transactions.length + ' transactions for ' + record.get('title'));
            }
        } catch (err) {
            console.log('Error removing transactions on reopen: ' + err);
        }
        return;
    }

    // 2. Only proceed if status is 'completed'
    if (record.get('status') !== 'completed') return;

    // 2. Safety: Check if we already awarded points for this activity
    try {
        // FIXED: Using direct string concatenation to avoid parameter binding errors
        const existingTx = $app.findRecordByFilter(
            'point_transactions',
            "activity = '" + record.id + "' && type = 'creation'"
        );
        if (existingTx) return; // Already processed
    } catch (err) { /* Not found, proceed */ }

    console.log('Activity completed: ' + record.get('title'));

    const activityTitle = record.get('title');
    const activityId = record.id;
    const creatorId = record.get('creator');
    const pointsCreator = record.getInt('points_creator');
    const pointsParticipant = record.getInt('points_participant');
    const pointsOrganizerPerParticipant = record.getInt('points_organizer_per_participant') || 2;

    // Fetch participants first to calculate bonus
    // FIXED: Removed complex params object, used simple string filter
    const participations = $app.findRecordsByFilter(
        'participations',
        "activity = '" + activityId + "'"
    );

    // Award creator points ONLY if there is at least 1 participant
    if (pointsCreator > 0 && participations.length > 0) {
        const participantCount = participations.length;
        const participantBonus = participantCount * pointsOrganizerPerParticipant;
        const totalCreatorPoints = pointsCreator + participantBonus;

        const pointTransactions = $app.findCollectionByNameOrId('point_transactions');
        const creatorTx = new Record(pointTransactions);

        creatorTx.set('user', creatorId);
        creatorTx.set('amount', totalCreatorPoints);
        // Detailed reason showing the calculation
        creatorTx.set('reason', 'Created: ' + activityTitle + ' (' + pointsCreator + ' + ' + participantCount + 'x2 deelnemers)');
        creatorTx.set('activity', activityId);
        creatorTx.set('type', 'creation');

        $app.save(creatorTx);
        console.log('Awarded ' + totalCreatorPoints + ' points to creator ' + creatorId);
    }

    // Award participant points
    if (pointsParticipant > 0) {
        participations.forEach(function (p) {
            const userId = p.get('user');

            const pointTransactions = $app.findCollectionByNameOrId('point_transactions');
            const tx = new Record(pointTransactions);

            tx.set('user', userId);
            tx.set('amount', pointsParticipant);
            tx.set('reason', 'Participated: ' + activityTitle);
            tx.set('activity', activityId);
            tx.set('type', 'participation');

            $app.save(tx);
            console.log('Awarded ' + pointsParticipant + ' points to participant ' + userId);
        });
    }

}, 'activities');


// ============================================
// HOOK 2: Validate participation limits
// ============================================
onRecordCreateRequest((e) => {
    const record = e.record;
    if (!record) return;

    const activityId = record.get('activity');
    const activity = $app.findRecordById('activities', activityId);

    // Check if activity is still open
    if (activity.get('status') !== 'open') {
        throw new BadRequestError('Cannot join: Activity is no longer open');
    }

    // Check participant limit
    const maxParticipants = activity.getInt('max_participants');

    if (maxParticipants > 0) {
        // FIXED: Used simple string filter
        const currentParticipants = $app.findRecordsByFilter(
            'participations',
            "activity = '" + activityId + "'"
        );

        if (currentParticipants.length >= maxParticipants) {
            throw new BadRequestError('Cannot join: Activity is full');
        }
    }

    e.next();
}, 'participations');


// ============================================
// HOOK 3: Prevent leaving completed activities
// ============================================
onRecordDeleteRequest((e) => {
    const record = e.record;
    if (!record) return;

    const activityId = record.get('activity');
    const activity = $app.findRecordById('activities', activityId);

    if (activity.get('status') === 'completed') {
        throw new BadRequestError('Cannot leave: Activity is already completed');
    }

    e.next();
}, 'participations');


// ============================================
// HOOK 4: Set creator automatically
// ============================================
onRecordCreateRequest((e) => {
    const record = e.record;
    const authRecord = e.auth;

    if (authRecord) {
        record.set('creator', authRecord.id);
    }

    e.next();
}, 'activities');


// ============================================
// HOOK 5: Set user automatically
// ============================================
onRecordCreateRequest((e) => {
    const record = e.record;
    const authRecord = e.auth;

    if (authRecord) {
        record.set('user', authRecord.id);
    }

    e.next();
}, 'participations');


console.log('[Matenweekend] Hooks loaded successfully!');


// ============================================
// HOOK 6: Award first login bonus
// ============================================
onRecordAuthWithPasswordRequest((e) => {
    e.next(); // Proceed with default auth behavior first

    const userId = e.record.id;
    // Only check for points if auth was successful (which is implied if we reach here and e.next() doesn't throw, 
    // but e.next() handles the response. Actually, e.next() executes the next handler. 
    // To run logic AFTER, we should place it after e.next().
    // However, if e.next() returns a response, we good.

    try {
        // Check if first login bonus already awarded
        const existing = $app.findRecordsByFilter(
            'point_transactions',
            `user = '${userId}' && reason = 'First Login'`
        );

        if (existing.length === 0) {
            const pointTransactions = $app.findCollectionByNameOrId('point_transactions');
            const tx = new Record(pointTransactions);
            tx.set('user', userId);
            tx.set('amount', 10);
            tx.set('reason', 'First Login');
            tx.set('type', 'bonus');

            $app.save(tx);
            console.log('Awarded 10 first login points to ' + userId);
        }
    } catch (err) {
        console.log('Error checking first login bonus: ' + err);
    }
}, 'users');


// ============================================
// HOOK 7: Validate activity start date (must be tomorrow or later)
// ============================================
onRecordCreateRequest((e) => {
    const record = e.record;
    if (!record) return;

    const startTimeStr = record.get('start_time');
    if (!startTimeStr) return; // Let required field validation handle this if needed

    const start = new Date(startTimeStr);
    const now = new Date();
    // Reset time part to compare dates only (start of tomorrow)
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    if (start < tomorrow) {
        throw new BadRequestError('Activiteit moet minimaal morgen plaatsvinden');
    }

    // No need to call e.next() for Before hooks in some versions, but standard is usually no return or next() depending on specific hook version. 
    // In PB hooks (Goja), return checks or throwing error stops execution. 
    // 'onRecordBeforeCreateRequest' doesn't strictly need e.next() in JS hooks usually if it's just validation, 
    // but looking at other hooks, e.next() isn't always used in before hooks in examples unless it's a specific middleware chain.
    // However, looking at HOOK 2 above, it ends with e.next();. So let's follow that pattern.
    e.next();
}, 'activities');


// ============================================
// HOOK 8: Send email notification on activity creation
// ============================================
onRecordAfterCreateSuccess((e) => {
    const activity = e.record;


    // Safety: only send if we have a title and it's open
    if (activity.get('status') !== 'open') return;

    try {
        // Find all users who have opted IN for email notifications
        // The field 'email_notifications' is a boolean. 
        // We only want users where this is TRUE.
        // Also ensure they have an email address.
        const recipients = $app.findRecordsByFilter(
            'users',
            "email != '' && email_notifications = true"
        );

        if (recipients.length === 0) {
            console.log('No users opted in for email notifications. Skipping email.');
            return;
        }

        const appName = $app.settings().meta.appName || 'Matenweekend';
        const senderAddress = $app.settings().meta.senderAddress;
        const senderName = $app.settings().meta.senderName || appName;
        const activityTitle = activity.get('title');

        // Construct a simple link. 
        // Note: pb_hooks context might not know the frontend URL unless hardcoded or inferred.
        // Assuming standard production URL or configured app URL.
        const appUrl = $app.settings().meta.appUrl;
        const activityUrl = `${appUrl}/activities/${activity.id}`;

        recipients.forEach((user) => {
            // Don't send to self (creator) if desired, but usually creators want confirmation too?
            // Let's send to everyone who opted in for now.

            const email = new MailerMessage({
                from: {
                    address: senderAddress,
                    name: senderName,
                },
                to: [{ address: user.email }],
                subject: `Nieuwe activiteit: ${activityTitle}`,
                html: `
                    <h2>Nieuwe activiteit: ${activityTitle}</h2>
                    <p>Er is een nieuwe activiteit aangemaakt op ${appName}.</p>
                    <p><strong>Wanneer:</strong> ${activity.get('start_time')}</p>
                    <p>
                        <a href="${activityUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            Bekijk activiteit
                        </a>
                    </p>
                    <p><small>Je ontvangt deze email omdat je meldingen hebt ingeschakeld in je profiel.</small></p>
                `,
            });

            $app.newMailClient().send(email);
        });

        console.log(`Sent new activity email to ${recipients.length} users.`);

    } catch (err) {
        console.log('Error sending new activity emails: ' + err);
    }
}, 'activities');
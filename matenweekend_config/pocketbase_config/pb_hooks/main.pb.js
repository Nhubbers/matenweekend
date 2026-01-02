/// <reference path="../pb_data/types.d.ts" />

console.log('!!! LOADING HOOKS - START !!!');

// ============================================
// HOOK 1: Award points when activity is completed
// ============================================
onRecordAfterUpdateSuccess((e) => {
    const record = e.record;

    // 1. Basic check: Is the status 'completed'?
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

    // Award creator points
    if (pointsCreator > 0) {
        const pointTransactions = $app.findCollectionByNameOrId('point_transactions');
        const creatorTx = new Record(pointTransactions);

        creatorTx.set('user', creatorId);
        creatorTx.set('amount', pointsCreator);
        creatorTx.set('reason', 'Created: ' + activityTitle);
        creatorTx.set('activity', activityId);
        creatorTx.set('type', 'creation');

        $app.save(creatorTx);
        console.log('Awarded ' + pointsCreator + ' points to creator ' + creatorId);
    }

    // Award participant points
    if (pointsParticipant > 0) {
        // FIXED: Removed complex params object, used simple string filter
        const participations = $app.findRecordsByFilter(
            'participations',
            "activity = '" + activityId + "'"
        );

        participations.forEach(function (p) {
            const userId = p.get('user');

            // Skip if participant is the creator
            if (userId === creatorId) return;

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
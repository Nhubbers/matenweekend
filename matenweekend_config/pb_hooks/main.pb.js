/// <reference path="../pb_data/types.d.ts" />

// ============================================
// HOOK 1: Award points when activity is completed
// ============================================
onRecordAfterUpdateRequest((e) => {
    const record = e.record;
    const original = record.original();

    // Only process activities
    if (!record) return;

    // Check if status changed to 'completed'
    if (record.get('status') !== 'completed') return;
    if (original.get('status') === 'completed') return;

    console.log('Activity completed: ' + record.get('title'));

    const pointTransactions = $app.dao().findCollectionByNameOrId('point_transactions');
    const activityTitle = record.get('title');
    const activityId = record.id;
    const creatorId = record.get('creator');
    const pointsCreator = record.get('points_creator') || 0;
    const pointsParticipant = record.get('points_participant') || 0;

    // Award creator points
    if (pointsCreator > 0) {
        const creatorTx = new Record(pointTransactions);
        creatorTx.set('user', creatorId);
        creatorTx.set('amount', pointsCreator);
        creatorTx.set('reason', 'Created: ' + activityTitle);
        creatorTx.set('activity', activityId);
        creatorTx.set('type', 'creation');
        $app.dao().saveRecord(creatorTx);
        console.log('Awarded ' + pointsCreator + ' points to creator ' + creatorId);
    }

    // Award participant points
    if (pointsParticipant > 0) {
        const participations = $app.dao().findRecordsByFilter(
            'participations',
            "activity = '" + activityId + "'",
            '',
            0,
            0
        );

        participations.forEach(function(p) {
            const userId = p.get('user');

            // Skip if participant is the creator (they already got creator points)
            if (userId === creatorId) {
                console.log('Skipping creator ' + userId + ' for participant points');
                return;
            }

            const tx = new Record(pointTransactions);
            tx.set('user', userId);
            tx.set('amount', pointsParticipant);
            tx.set('reason', 'Participated: ' + activityTitle);
            tx.set('activity', activityId);
            tx.set('type', 'participation');
            $app.dao().saveRecord(tx);
            console.log('Awarded ' + pointsParticipant + ' points to participant ' + userId);
        });
    }

}, 'activities');


// ============================================
// HOOK 2: Validate participation limits
// ============================================
onRecordBeforeCreateRequest((e) => {
    const record = e.record;

    if (!record) return;

    const activityId = record.get('activity');

    // Get the activity
    const activity = $app.dao().findRecordById('activities', activityId);

    // Check if activity is still open
    if (activity.get('status') !== 'open') {
        throw new BadRequestError('Cannot join: Activity is no longer open');
    }

    // Check participant limit
    const maxParticipants = activity.get('max_participants') || 0;

    if (maxParticipants > 0) {
        const currentParticipants = $app.dao().findRecordsByFilter(
            'participations',
            "activity = '" + activityId + "'",
            '',
            0,
            0
        );

        if (currentParticipants.length >= maxParticipants) {
            throw new BadRequestError('Cannot join: Activity is full');
        }
    }

}, 'participations');


// ============================================
// HOOK 3: Prevent leaving completed activities
// ============================================
onRecordBeforeDeleteRequest((e) => {
    const record = e.record;

    if (!record) return;

    const activityId = record.get('activity');
    const activity = $app.dao().findRecordById('activities', activityId);

    // Check if activity is completed
    if (activity.get('status') === 'completed') {
        throw new BadRequestError('Cannot leave: Activity is already completed');
    }

}, 'participations');


// ============================================
// HOOK 4: Set creator automatically on activity creation
// ============================================
onRecordBeforeCreateRequest((e) => {
    const record = e.record;
    const authRecord = e.httpContext.get('authRecord');

    if (!authRecord) return;

    // Auto-set creator to current user
    record.set('creator', authRecord.id);

}, 'activities');


// ============================================
// HOOK 5: Set user automatically on participation creation
// ============================================
onRecordBeforeCreateRequest((e) => {
    const record = e.record;
    const authRecord = e.httpContext.get('authRecord');

    if (!authRecord) return;

    // Auto-set user to current user
    record.set('user', authRecord.id);

}, 'participations');


console.log('[Matenweekend] Hooks loaded successfully!');

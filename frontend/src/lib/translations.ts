// Dutch translations for the Matenweekend app
export const nl = {
    // Navigation
    home: 'Home',
    activities: 'Activiteiten',
    ranking: 'Ranking',
    profile: 'Profiel',
    admin: 'Admin',

    // Auth
    login: 'Inloggen',
    logout: 'Uitloggen',
    email: 'E-mail',
    password: 'Wachtwoord',
    loginError: 'Inloggen mislukt. Controleer je gegevens.',

    // Activities
    newActivity: 'Nieuwe activiteit',
    title: 'Titel',
    description: 'Beschrijving',
    dateTime: 'Datum en tijd',
    join: 'Deelnemen',
    leave: 'Verlaten',
    participants: 'deelnemers',
    points: 'punten',
    pointsForParticipants: 'Punten voor deelnemers',
    pointsForCreator: 'Punten voor organisator',
    maxParticipants: 'Max deelnemers',
    unlimited: 'onbeperkt',
    image: 'Afbeelding',
    chooseFile: 'Kies bestand',
    create: 'Aanmaken',
    createdBy: 'Aangemaakt door',

    // Status
    open: 'Open',
    completed: 'Afgerond',
    cancelled: 'Geannuleerd',
    upcoming: 'Aankomend',
    all: 'Alle',

    // Admin
    complete: 'Afronden',
    cancel: 'Annuleren',
    delete: 'Verwijderen',
    awardPoints: 'Punten toekennen',
    deductPoints: 'Punten aftrekken',
    reason: 'Reden',
    user: 'Gebruiker',
    activityManagement: 'Activiteiten beheer',
    pointsManagement: 'Punten toekennen',
    newsManagement: 'Nieuws beheer',

    // News
    news: 'Nieuws',
    newPost: 'Nieuw bericht',

    // Ranking
    rank: 'Positie',
    totalPoints: 'Totaal punten',
    pointsHistory: 'Puntenhistorie',

    // Common
    loading: 'Laden...',
    error: 'Er is iets misgegaan',
    tryAgain: 'Probeer opnieuw',
    noResults: 'Geen resultaten',
    back: 'Terug',
    save: 'Opslaan',
    edit: 'Bewerken',
    confirm: 'Bevestigen',
    areYouSure: 'Weet je het zeker?',
    close: 'Sluiten',

    // Profile
    yourPoints: 'Jouw punten',
    yourRank: 'Jouw positie',

    // Errors
    activityFull: 'Activiteit is vol',
    activityClosed: 'Activiteit is niet meer open',
    alreadyJoined: 'Je doet al mee aan deze activiteit',
    cannotLeaveCompleted: 'Je kunt een afgeronde activiteit niet verlaten',
};

export type TranslationKey = keyof typeof nl;

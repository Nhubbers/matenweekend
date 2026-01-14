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
    forgotPassword: 'Wachtwoord vergeten?',
    resetPassword: 'Wachtwoord resetten',
    requestResetLink: 'Reset link aanvragen',
    backToLogin: 'Terug naar inloggen',
    emailSent: 'E-mail verzonden!',
    checkEmail: 'Controleer je e-mail voor de reset link.',
    newPassword: 'Nieuw wachtwoord',
    confirmPassword: 'Bevestig wachtwoord',
    passwordResetSuccess: 'Wachtwoord succesvol gewijzigd',
    passwordResetError: 'Wachtwoord resetten mislukt',
    passwordsDoNotMatch: 'Wachtwoorden komen niet overeen',
    passwordMinLength: 'Wachtwoord moet minimaal 8 tekens lang zijn',

    // Activities
    newActivity: 'Nieuwe activiteit',
    title: 'Titel',
    description: 'Beschrijving',
    dateTime: 'Begindatum en -tijd',
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
    cannotJoinYourOwn: 'Je mag niet deelnemen aan je eigen activiteit',
    youAreTheOrganizer: 'Je bent de organisator',

    // First login
    welcomeTitle: 'Welkom bij Matenweekend 2026!',
    firstLoginBonus: 'Je hebt 10 punten verdiend voor je eerste login!',
    letsGo: 'Lets Go!',

    // No-show feature
    noshow: 'No-show',
    markNoshows: 'Markeer afwezigen',
    confirmComplete: 'Bevestig afronden',
    cancelComplete: 'Annuleren',
    noshowWarning: 'Afwezigen krijgen strafpunten',
    completingActivity: 'Activiteit afronden',
    noshowExplanation: 'Markeer deelnemers die niet zijn komen opdagen. Zij krijgen strafpunten.',
};

export type TranslationKey = keyof typeof nl;

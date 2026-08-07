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
    overdue: 'Openstaand',
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

    // Completion photo
    uploadCompletionPhoto: 'Upload bewijs foto',
    completionPhotoRequired: 'Een foto is verplicht om de activiteit af te ronden',
    completionPhotoHint: "Pics or it didn't happen! 📸",
    selectPhoto: 'Selecteer foto',
    photoSelected: 'Foto geselecteerd',
    proofPhoto: 'Bewijs foto',
    activityNotYetFinished:
        'Deze activiteit is nog niet afgelopen. Je kunt pas afronden nadat de activiteit heeft plaatsgevonden.',

    // Co-organizers
    coOrganizers: 'Mede-organisatoren',
    addCoOrganizer: 'Mede-organisator toevoegen',
    removeCoOrganizer: 'Verwijderen',
    youAreCoOrganizer: 'Je bent mede-organisator',
    cannotAddParticipantAsCoOrganizer: 'Verwijder deze gebruiker eerst als deelnemer',
    selectUser: 'Selecteer gebruiker',
    noUsersAvailable: 'Geen gebruikers beschikbaar',
    noParticipantsYet: 'Nog geen deelnemers',
    editActivity: 'Activiteit bewerken',
    organizer: 'Organisator',
    noCoOrganizers: 'Geen mede-organisatoren',
    addParticipant: 'Deelnemer toevoegen',
    noActivitiesInCategory: 'Er zijn nog geen activiteiten in deze categorie.',

    // Hints & Mysteries
    hints: 'Hints',
    hintsTitle: 'Trip Hints & Mysterie',
    nextHintCountdown: 'Volgende hint ontgrendelt in',
    allHintsUnlocked: 'Alle hints zijn ontgrendeld!',
    guessHeader: 'Jouw Voorspellingen',
    locationGuess: 'Locatie (Land)',
    mysteryGuestGuess: 'Mystery Guest (Volledige Naam)',
    wagerPoints: 'Inzet Punten (Multiplier)',
    submitGuess: 'Voorspelling Opslaan',
    updateGuess: 'Voorspelling Aanpassen',
    earlyBirdBonus: 'Early Bird Payout',
    comboBonusNotice: '🏆 Alleen in de finale ronde: +50 Bonus Punten als je beide goed hebt!',
    guessWindowClosed: 'Inzendtermijn voor deze ronde is gesloten',
    currentGuess: 'Huidige Voorspelling',
    selectCountry: 'Selecteer een land...',
    enterFullName: 'Voer volledige naam in...',
    lockedHint: 'Ontgrendelt op',
    audioHintTitle: 'Stem Teaser 🎙️',
    imageHintTitle: 'Foto Teaser 🖼️',
    placeholderHintTitle: 'Mystery Hint Placeholder 🕵️',
    guessSavedSuccess: 'Je voorspelling is succesvol opgeslagen!',
    guessSavedOffline: '⚠️ Opgeslagen in lokaal geheugen (geen serververbinding)',
    guessSaveError: 'Opslaan mislukt. Probeer het opnieuw.',
    confirmSaveTitle: 'Weet je het zeker?',
    confirmSaveMessage:
        'Je kunt je voorspelling maar één keer opslaan en deze daarna niet meer aanpassen. Controleer je antwoorden goed voordat je ze definitief indient!',
};

export type TranslationKey = keyof typeof nl;

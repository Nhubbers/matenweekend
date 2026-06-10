import { ClientResponseError } from 'pocketbase';

/**
 * Standardizes PocketBase and general application errors into user-friendly Dutch messages.
 */
export function getErrorMessage(err: unknown): string {
    if (err instanceof ClientResponseError) {
        // Handle validation errors from PocketBase
        if (err.data && typeof err.data === 'object') {
            const dataErrors = err.data as Record<string, any>;
            const firstErrorField = Object.keys(dataErrors)[0];
            if (firstErrorField) {
                const errorObj = dataErrors[firstErrorField];
                const code = errorObj?.code || '';
                const message = errorObj?.message || '';

                // Specific validation codes
                if (code === 'validation_not_unique') {
                    return `Dit veld (${firstErrorField}) bestaat al en moet uniek zijn.`;
                }
                if (code === 'validation_required') {
                    return `Het veld ${firstErrorField} is verplicht.`;
                }
                return message || `Validatiefout op veld: ${firstErrorField}`;
            }
        }

        // Map general PocketBase status codes
        switch (err.status) {
            case 400:
                return err.message || 'Ongeldig verzoek.';
            case 401:
                return 'Niet geautoriseerd. Log opnieuw in.';
            case 403:
                return 'Je hebt geen rechten om deze actie uit te voeren.';
            case 404:
                return 'De opgevraagde gegevens konden niet worden gevonden.';
            case 500:
                return 'Interne serverfout. Probeer het later opnieuw.';
            default:
                break;
        }

        return err.message || 'Er is een fout opgetreden in de communicatie met de server.';
    }

    if (err instanceof Error) {
        return err.message;
    }

    if (typeof err === 'string') {
        return err;
    }

    return 'Er is een onbekende fout opgetreden.';
}

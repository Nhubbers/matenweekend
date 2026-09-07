import { ClientResponseError } from 'pocketbase';

/**
 * Standardizes PocketBase and general application errors into user-friendly Dutch messages.
 */
export function getErrorMessage(err: unknown): string {
    if (err instanceof ClientResponseError) {
        // `err.data` on a ClientResponseError is the parsed HTTP response body, e.g.
        //   { status, message, data: { "<field>": { code, message, ... } } }
        // so we unwrap the real per-field errors from `body.data` and fall back to the
        // top-level `message` (which pocketbase hook-thrown BadRequestErrors use).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = err.data as Record<string, any> | undefined;

        // 1) Per-field validation errors are nested under data.<field>.
        const fieldErrors = body && body.data;
        if (fieldErrors && typeof fieldErrors === 'object' && !Array.isArray(fieldErrors)) {
            const fieldNames = Object.keys(fieldErrors);
            if (fieldNames.length) {
                const field = fieldNames[0];
                const errorObj = fieldErrors[field] as { code?: string; message?: string } | undefined;
                const code = errorObj?.code || '';
                const message = errorObj?.message || '';

                if (code === 'validation_not_unique') {
                    return `Dit veld (${field}) bestaat al en moet uniek zijn.`;
                }
                if (code === 'validation_required') {
                    return `Het veld ${field} is verplicht.`;
                }
                return message || `Validatiefout op veld: ${field}`;
            }
        }

        // 2) Top-level message (e.g. a BadRequestError thrown by a pb_hook, such as
        //    the guess wager-balance guard, or a generic backend message).
        if (typeof body?.message === 'string' && body.message.trim()) {
            return body.message;
        }

        // 3) Map general PocketBase status codes when no body detail is available.
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

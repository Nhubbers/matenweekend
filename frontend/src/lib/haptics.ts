/**
 * Utility for triggering haptic feedback on mobile devices using the Vibration API.
 * Safely fails silently if the Vibration API is not supported by the browser or platform.
 */
export const haptics = {
    /**
     * A light tap feedback (e.g. for button taps or tab clicks)
     */
    light: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
                navigator.vibrate(10);
            } catch {
                // Ignore silent errors on unsupported devices
            }
        }
    },

    /**
     * A medium impact feedback (e.g. for toggles, filters, or opening dialogs)
     */
    medium: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
                navigator.vibrate(25);
            } catch {
                // Ignore silent errors
            }
        }
    },

    /**
     * A success pattern (e.g. for joining/completing an activity successfully)
     */
    success: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
                navigator.vibrate([15, 30, 15]);
            } catch {
                // Ignore silent errors
            }
        }
    },

    /**
     * A warning/error pattern
     */
    error: () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
                navigator.vibrate([50, 50, 50]);
            } catch {
                // Ignore silent errors
            }
        }
    },
};

// Shared media-kind detection for hint media URLs.
// Because hints can pair audio and images either way around (an image for the
// location, audio for the mystery guest, or vice versa), we detect the actual
// media kind from the URL / MIME type instead of assuming a fixed role.

export type MediaKind = 'image' | 'audio' | 'video' | 'none';

const AUDIO_EXT = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.opus'];
const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.heic', '.avif', '.svg', '.bmp'];
const VIDEO_EXT = ['.mp4', '.webm', '.mov', '.m4v', '.oggv'];

/**
 * Detects whether a media URL points to an image, audio file, video or nothing.
 * Falls back to keyword matching so generic CDN URLs (e.g. `/files/.../audio`)
 * are classified correctly, and returns 'none' for empty / unknown values.
 */
export function detectMediaKind(url?: string): MediaKind {
    if (!url) return 'none';

    const lowered = url.toLowerCase();
    // Strip query string & hash so `?token=...` or `#fragment` don't break extension checks.
    const clean = lowered.split('?')[0].split('#')[0];

    if (AUDIO_EXT.some((ext) => clean.endsWith(ext)) || clean.includes('audio') || clean.includes('voicenote')) {
        return 'audio';
    }
    if (
        IMAGE_EXT.some((ext) => clean.endsWith(ext)) ||
        clean.includes('image') ||
        clean.includes('picture') ||
        clean.includes('photo')
    ) {
        return 'image';
    }
    if (VIDEO_EXT.some((ext) => clean.endsWith(ext)) || clean.includes('video')) {
        return 'video';
    }
    return 'none';
}

/**
 * Maps a browser File's MIME type to a MediaKind. Used primarily for the admin
 * live preview where freshly selected files are blob: URLs that have no useful
 * filename extension.
 */
export function detectFileMediaKind(file?: File | null): MediaKind {
    if (!file) return 'none';
    const type = (file.type || '').toLowerCase();
    if (type.startsWith('audio/')) return 'audio';
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    // Fall back to the file name for browsers that don't report a MIME type.
    return detectMediaKind(file.name);
}

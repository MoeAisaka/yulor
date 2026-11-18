export function savedFileIdFromLink(value: string, origin: string, exactOrigin = false): string | null {
    try {
        const base = new URL(origin);
        const url = new URL(value, base);
        const sameSite = exactOrigin ? url.origin === base.origin : url.hostname === base.hostname;
        if (!['https:', 'http:'].includes(url.protocol) || !sameSite || url.username || url.password) return null;
        const match = url.pathname.match(/^\/saved-files\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i);
        return match?.[1] ?? null;
    } catch { return null; }
}

export function currentSavedFileId(value: string, origin?: string): string | null {
    const origins = origin
        ? [origin]
        : [
            typeof window !== 'undefined' ? window.location?.origin : undefined,
            (globalThis as any).__HAPPY_CONFIG__?.serverUrl,
            typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_LMC_SERVER_URL : undefined,
        ].filter((candidate): candidate is string => typeof candidate === 'string' && candidate.length > 0);
    for (const candidate of origins) {
        const id = savedFileIdFromLink(value, candidate);
        if (id) return id;
    }
    if (!origin) {
        // Alternate origins must be configured for this saved-file service.
        const additionalOrigins = process.env.EXPO_PUBLIC_LMC_SAVED_FILE_ORIGINS?.split(',') ?? [];
        for (const candidate of additionalOrigins) {
            const id = savedFileIdFromLink(value, candidate.trim(), true);
            if (id) return id;
        }
    }
    if (!origin && value.startsWith('/') && !value.startsWith('//')) {
        return savedFileIdFromLink(value, 'https://lmc.invalid');
    }
    return null;
}

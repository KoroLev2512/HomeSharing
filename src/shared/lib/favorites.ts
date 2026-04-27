"use client";

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useSession } from 'next-auth/react';

const STORAGE_KEY = 'homesharing.favorites';

const isBrowser = typeof window !== 'undefined';

const readFromStorage = (): Set<string> => {
    if (!isBrowser) return new Set();
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return new Set();
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return new Set();
        return new Set(parsed.filter((v): v is string => typeof v === 'string'));
    } catch {
        return new Set();
    }
};

let memo: Set<string> = readFromStorage();
// Стабильный сериализованный снапшот для useSyncExternalStore.
let snapshot = JSON.stringify(Array.from(memo));
const listeners = new Set<() => void>();

let currentUserId: string | null = null;
let syncInFlight: Promise<void> | null = null;

const persist = () => {
    if (!isBrowser) return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(memo)));
    } catch {
        // ignore quota / privacy mode
    }
};

const emit = () => {
    snapshot = JSON.stringify(Array.from(memo));
    listeners.forEach((l) => l());
};

const replaceSet = (next: Set<string>) => {
    if (next.size === memo.size && Array.from(next).every((id) => memo.has(id))) {
        return;
    }
    memo = next;
    persist();
    emit();
};

const postFavorite = (listingId: string): Promise<void> =>
    fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
    })
        .then(() => undefined)
        .catch(() => undefined);

const deleteFavorite = (listingId: string): Promise<void> =>
    fetch(`/api/favorites/${encodeURIComponent(listingId)}`, { method: 'DELETE' })
        .then(() => undefined)
        .catch(() => undefined);

const deleteAllFavorites = (): Promise<void> =>
    fetch('/api/favorites', { method: 'DELETE' })
        .then(() => undefined)
        .catch(() => undefined);

const syncWithServer = async (): Promise<void> => {
    if (!currentUserId || !isBrowser) return;
    try {
        const res = await fetch('/api/favorites', { method: 'GET' });
        if (!res.ok) return;
        const json = (await res.json()) as { favorites?: string[] };
        const serverIds = new Set<string>(Array.isArray(json.favorites) ? json.favorites : []);

        // Push local-only ids to the server (best effort).
        const toUpload = Array.from(memo).filter((id) => !serverIds.has(id));
        if (toUpload.length > 0) {
            await Promise.allSettled(toUpload.map(postFavorite));
            toUpload.forEach((id) => serverIds.add(id));
        }

        replaceSet(serverIds);
    } catch {
        // ignore — we keep local state as fallback
    }
};

if (isBrowser) {
    window.addEventListener('storage', (e) => {
        if (e.key !== STORAGE_KEY) return;
        memo = readFromStorage();
        emit();
    });
}

export const favoritesStore = {
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },
    getSnapshot(): string {
        return snapshot;
    },
    getServerSnapshot(): string {
        return '[]';
    },
    has(id: string): boolean {
        return memo.has(id);
    },
    list(): string[] {
        return Array.from(memo);
    },
    add(id: string) {
        if (memo.has(id)) return;
        const next = new Set(memo);
        next.add(id);
        replaceSet(next);
        if (currentUserId) postFavorite(id);
    },
    remove(id: string) {
        if (!memo.has(id)) return;
        const next = new Set(memo);
        next.delete(id);
        replaceSet(next);
        if (currentUserId) deleteFavorite(id);
    },
    toggle(id: string): boolean {
        if (memo.has(id)) {
            favoritesStore.remove(id);
            return false;
        }
        favoritesStore.add(id);
        return true;
    },
    clear() {
        if (memo.size === 0) return;
        replaceSet(new Set());
        if (currentUserId) deleteAllFavorites();
    },
    /**
     * Bind the active user. When a non-null id is provided the store performs
     * a one-shot reconciliation (server union local). Pass `null` on logout.
     */
    setCurrentUser(userId: string | null) {
        if (currentUserId === userId) return;
        currentUserId = userId;
        if (userId) {
            syncInFlight = syncWithServer();
        }
    },
    /**
     * Returns the in-flight reconciliation promise, mostly for tests.
     */
    syncPromise(): Promise<void> | null {
        return syncInFlight;
    },
};

export interface UseFavoritesResult {
    favorites: string[];
    count: number;
    isFavorite: (id: string) => boolean;
    toggle: (id: string) => boolean;
    add: (id: string) => void;
    remove: (id: string) => void;
}

const EMPTY_FAVORITES: readonly string[] = Object.freeze([]);

export const useFavorites = (): UseFavoritesResult => {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'loading') return;
        const userId = session?.user?.id ?? null;
        favoritesStore.setCurrentUser(userId);
    }, [session?.user?.id, status]);

    const snap = useSyncExternalStore(
        favoritesStore.subscribe,
        favoritesStore.getSnapshot,
        favoritesStore.getServerSnapshot,
    );

    const favorites = useMemo<string[]>(() => {
        try {
            const parsed = JSON.parse(snap);
            return Array.isArray(parsed) ? (parsed as string[]) : (EMPTY_FAVORITES as string[]);
        } catch {
            return EMPTY_FAVORITES as string[];
        }
    }, [snap]);

    return {
        favorites,
        count: favorites.length,
        isFavorite: (id: string) => favoritesStore.has(id),
        toggle: favoritesStore.toggle,
        add: favoritesStore.add,
        remove: favoritesStore.remove,
    };
};

/*
 * Copyright (c) 2026 MetaclassMethod
 */

import * as DataStore from "@api/DataStore";
import type { Message } from "@vencord/discord-types";

import { fetchProfileByMessage } from "./api";
import { isProxiedMessage, profileMatchKey, rawUsername, userHash } from "./identity";
import { isResolved, Profile, ProfileStatus, ResolvedProfile } from "./types";

const STORE_KEY = "pluralgrace-profiles";
const SAVE_DEBOUNCE_MS = 2000;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

type Listener = (hash: string, profile: Profile | null) => void;

class ProfileStore {
    private profiles = new Map<string, Profile>();
    private listeners = new Set<Listener>();

    private inFlight = new Map<string, Promise<void>>();
    private lastMessage = new Map<string, Message>();
    private saveTimer: ReturnType<typeof setTimeout> | null = null;
    private loaded = false;

    async load(): Promise<void> {
        const stored = await DataStore.get<Record<string, Profile>>(STORE_KEY);
        if (stored) {
            const cutoff = Date.now() - CACHE_TTL_MS;
            for (const [hash, profile] of Object.entries(stored)) {
                if ((profile.lastUsed ?? Date.now()) > cutoff) {
                    this.profiles.set(hash, profile);
                }
            }
        }
        this.loaded = true;
        this.emit("*", null);
    }

    resolved(): ResolvedProfile[] {
        return [...this.profiles.values()].filter(isResolved);
    }

    findByUser(user: { username: string; avatar: string | null; }): ResolvedProfile | null {
        const key = profileMatchKey(user);
        return this.resolved().find(profile => profile.matchKey === key) ?? null;
    }

    get(hash: string): Profile | null {
        return this.profiles.get(hash) ?? null;
    }

    set(hash: string, profile: Profile): void {
        this.profiles.set(hash, profile);
        this.emit(hash, profile);
        this.scheduleSave();
    }

    invalidate(hash: string): void {
        const existing = this.profiles.get(hash);
        if (!existing) return;
        this.set(hash, { ...existing, status: ProfileStatus.Stale });

        const message = this.lastMessage.get(hash);
        if (message) this.ensure(message);
    }

    async clear(): Promise<void> {
        this.profiles.clear();
        this.inFlight.clear();
        this.lastMessage.clear();
        this.emit("*", null);
        await DataStore.del(STORE_KEY);
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private emit(hash: string, profile: Profile | null): void {
        for (const listener of this.listeners) listener(hash, profile);
    }

    private scheduleSave(): void {
        if (this.saveTimer !== null) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            this.saveTimer = null;
            void this.flush();
        }, SAVE_DEBOUNCE_MS);
    }

    async flush(): Promise<void> {
        if (!this.loaded) return;
        const persistable = Object.fromEntries(
            [...this.profiles].filter(([, profile]) => profile.status === ProfileStatus.Done)
        );
        await DataStore.set(STORE_KEY, persistable);
    }

    ensure(message: Message): void {
        if (!this.loaded || !isProxiedMessage(message)) return;

        const hash = userHash(message);
        this.lastMessage.set(hash, message);
        const existing = this.profiles.get(hash);

        const needsFetch = !existing || existing.status === ProfileStatus.Stale;
        if (!needsFetch || this.inFlight.has(hash)) {
            if (existing) existing.lastUsed = Date.now();
            return;
        }

        this.profiles.set(hash, {
            ...(existing ?? {}),
            status: existing ? ProfileStatus.Updating : ProfileStatus.Requesting,
            lastUsed: Date.now()
        });
        this.emit(hash, this.profiles.get(hash)!);

        const task = this.fetch(hash, message).finally(() => this.inFlight.delete(hash));
        this.inFlight.set(hash, task);
    }

    private async fetch(hash: string, message: Message): Promise<void> {
        try {
            const profile = await fetchProfileByMessage(message.id);
            profile.matchKey = profileMatchKey(message.author);
            this.set(hash, profile);
        } catch (err) {
            console.error(`[pluralgrace] lookup failed for ${rawUsername(message.author)} (${hash})`, err);

            const current = this.profiles.get(hash);
            if (current && current.status === ProfileStatus.Requesting) {
                this.profiles.delete(hash);
                this.emit(hash, null);
            } else if (current && current.status === ProfileStatus.Updating) {
                this.set(hash, { ...current, status: ProfileStatus.Done });
            }
        }
    }
}

export const profileStore = new ProfileStore();

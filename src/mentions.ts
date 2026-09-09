/*
 * Copyright (c) 2026 MetaclassMethod
 */

import { UserStore } from "@webpack/common";

import { profileStore } from "./pluralkit/store";

export interface MentionableMember {
    name: string;
    senderId: string;
}

export function mentionableMembers(): MentionableMember[] {
    const seen = new Set<string>();
    const members: MentionableMember[] = [];

    for (const profile of profileStore.resolved()) {
        if (!profile.name || !profile.sender) continue;

        const key = `${profile.name.toLowerCase()}\0${profile.sender}`;
        if (seen.has(key)) continue;

        seen.add(key);
        members.push({ name: profile.name, senderId: profile.sender });
    }

    return members.sort((a, b) => b.name.length - a.name.length);
}

function escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function memberNameForSender(senderId: string): string | null {
    let best: { name: string; lastUsed: number; } | null = null;

    for (const profile of profileStore.resolved()) {
        if (profile.sender !== senderId || !profile.name) continue;

        const lastUsed = profile.lastUsed ?? 0;
        if (!best || lastUsed > best.lastUsed) best = { name: profile.name, lastUsed };
    }

    return best?.name ?? null;
}

const NAME_FIELDS = new Set(["username", "globalName", "displayName", "nick"]);

export function asMember<T extends object>(user: T, name: string): T {
    try {
        return new Proxy(user, {
            get(target, prop, receiver) {
                if (typeof prop === "string" && NAME_FIELDS.has(prop)) {
                    if (prop in target) return name;
                }

                const value = Reflect.get(target, prop, target);
                return typeof value === "function" ? value.bind(target) : value;
            }
        });
    } catch {
        return user;
    }
}

export function mentionUser<T extends { id?: string; }>(user: T): T {
    try {
        if (!user?.id) return user;

        const name = memberNameForSender(user.id);
        return name ? asMember(user, name) : user;
    } catch {
        return user;
    }
}

export function rewriteMentions(content: string, members = mentionableMembers()): string {
    if (!content.includes("@")) return content;

    let out = content;

    for (const { name, senderId } of members) {
        //`(?!\w)` rather than `\b`
        const pattern = new RegExp(`(?<![\\w<@])@${escapeRegex(name)}(?!\\w)`, "gi");
        out = out.replace(pattern, `<@${senderId}>`);
    }

    return out;
}

interface AutocompleteState {
    query?: {
        text?: string;
        rawQuery?: string;
        results?: { users?: unknown[]; };
    };
}

export function injectMentionResults(state: AutocompleteState): void {
    try {
        const query = state?.query;
        const users = query?.results?.users;
        if (!Array.isArray(users)) return;

        const typed = String(query?.text ?? query?.rawQuery ?? "")
            .replace(/^@/, "")
            .toLowerCase();
        if (!typed) return;

        for (const { name, senderId } of mentionableMembers()) {
            if (!name.toLowerCase().includes(typed)) continue;
            if (users.some(user => (user as { id?: string; })?.id === senderId)) continue;

            const user = UserStore.getUser?.(senderId);
            if (user) users.unshift(asMember(user, name));
        }
    } catch {
        // suggestions should be treated as a convenience; never let this break the picker.
    }
}

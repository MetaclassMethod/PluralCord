/*
 * Copyright (c) 2026 MetaclassMethod
 */

import type { Message, User } from "@vencord/discord-types";

interface MaybeRealUser extends User {
    username_real?: string;
}

const INVISIBLE_RE = /[\uFE00-\uFE0F\u200B-\u200D\uFEFF]/g;
const SUFFIX_SLACK = 32;

function canonical(str: string): string {
    return str.normalize("NFC").replace(INVISIBLE_RE, "");
}

export function isProxiedMessage(message: Message | null | undefined): boolean {
    return message?.webhookId != null;
}

export function rawUsername(author: User): string {
    return (author as MaybeRealUser).username_real ?? author.username;
}

function hashCode(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0; // coerce to int32
    }
    return hash;
}

export function userHash(message: Message): string {
    const author = message.author;
    const appId = (message as Message & { application_id?: string; }).application_id ?? "";
    return String(hashCode(rawUsername(author) + author.avatar + appId));
}

function tagStartIndex(username: string, tag: string): number | null {
    if (username.endsWith(tag)) return username.length - tag.length;

    const canonicalTag = canonical(tag);
    if (!canonicalTag || !canonical(username).endsWith(canonicalTag)) return null;

    const limit = Math.min(username.length, canonicalTag.length + SUFFIX_SLACK);
    for (let take = 1; take <= limit; take++) {
        const start = username.length - take;
        if (canonical(username.slice(start)) === canonicalTag) return start;
    }

    return null;
}

export function splitServerName(username: string, tag: string | null | undefined): { name: string; tag: string; } {
    if (!tag) return { name: username, tag: "" };

    const start = tagStartIndex(username, tag);
    // start === 0 would mean the name is entirely tag
    if (start == null || start === 0) return { name: username, tag: "" };

    return {
        // trimEnd drops the space PK puts between name and tag
        name: username.slice(0, start).trimEnd(),
        tag: username.slice(start)
    };
}

export function displayIdentity(
    author: User,
    profileName: string | null | undefined,
    profileTag: string | null | undefined,
    useServerNames: boolean
): { name: string; tag: string; } {
    if (useServerNames) {
        return splitServerName(rawUsername(author), profileTag);
    }

    return {
        name: profileName || rawUsername(author),
        tag: profileTag ?? ""
    };
}

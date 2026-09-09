/*
 * Copyright (c) 2026 MetaclassMethod
 */

import type { Message } from "@vencord/discord-types";
import { MessageStore, React } from "@webpack/common";

import { isProxiedMessage, userHash } from "./identity";
import { profileStore } from "./store";
import { isResolved } from "./types";

// EXPERIMENTAL!!!
// this needs some fixing-ish-ing in the future

const PROXY_WINDOW_MS = 10_000;
const DISCORD_EPOCH_MS = 1420070400000n;

const decisions = new Map<string, boolean>();

function snowflakeTime(id: string | undefined): number {
    if (!id || !/^\d+$/.test(id)) return NaN;

    try {
        return Number((BigInt(id) >> 22n) + DISCORD_EPOCH_MS);
    } catch {
        return NaN;
    }
}

function isDeleted(message: Message): boolean {
    return (message as Message & { deleted?: boolean; }).deleted === true;
}

function looksLikeProxiedOriginal(message: Message): boolean {
    const authorId = message.author?.id;
    if (!authorId) return false;

    const deletedAt = snowflakeTime(message.id);
    if (Number.isNaN(deletedAt)) return false;

    return (
        MessageStore.getMessages(message.channel_id)?.some(candidate => {
            if (!isProxiedMessage(candidate)) return false;
            if (Math.abs(snowflakeTime(candidate.id) - deletedAt) > PROXY_WINDOW_MS) return false;

            const profile = profileStore.get(userHash(candidate));
            return isResolved(profile) && profile.sender === authorId;
        }) ?? false
    );
}

export function useIsProxiedOriginal(message: Message): boolean {
    const [, bump] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => profileStore.subscribe(bump), []);

    if (!isDeleted(message)) return false;

    const cached = decisions.get(message.id);
    if (cached) return true;

    const verdict = looksLikeProxiedOriginal(message);
    if (verdict) decisions.set(message.id, true);

    return verdict;
}

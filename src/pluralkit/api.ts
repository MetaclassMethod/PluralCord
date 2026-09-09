/*
 * Copyright (c) 2026 MetaclassMethod
 */

import type { PluginNative } from "@utils/types";

import { PLUGIN_NAME } from "../constants";
import type { PkFetchResult } from "../native";
import { PkMessageResponse, Profile, ProfileStatus } from "./types";

type PkNative = PluginNative<typeof import("../native")>;

function getNative(): PkNative {
    const native = VencordNative.pluginHelpers?.[PLUGIN_NAME] as PkNative | undefined;

    if (!native?.fetchPkMessage) {
        throw new PkApiError(
            -1,
            `${PLUGIN_NAME}'s native bridge is not registered. The main process is running an older ` +
            "build. Please fully quit Discord and reopen it (a Ctrl+R reload only refreshes the renderer)."
        );
    }

    return native;
}

const MIN_REQUEST_INTERVAL_MS = 600;

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

let queueTail: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const run = queueTail.then(async () => {
        const wait = lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now();
        if (wait > 0) await sleep(wait);
        lastRequestAt = Date.now();
        return fn();
    });

    queueTail = run.catch(() => {});
    return run;
}

export class PkApiError extends Error {
    constructor(public readonly status: number, message: string) {
        super(message);
        this.name = "PkApiError";
    }
}

function request(messageId: string): Promise<PkFetchResult> {
    return enqueue(() => getNative().fetchPkMessage(messageId));
}

function hexOrNull(colour: string | null | undefined): string | null {
    return colour ? `#${colour}` : null;
}

export function responseToProfile(data: PkMessageResponse): Profile {
    const { member, system } = data;

    if (member == null && system == null) {
        return { status: ProfileStatus.NotPk, lastUsed: Date.now() };
    }

    return {
        status: ProfileStatus.Done,
        lastUsed: Date.now(),

        memberId: member?.id,
        systemId: system?.id,
        sender: data.sender,

        name: member?.display_name || member?.name,
        systemName: system?.name ?? null,
        tag: system?.tag ?? null,

        colour: hexOrNull(member?.color),
        systemColour: hexOrNull(system?.color),

        pronouns: member?.pronouns ?? null,
        description: member?.description ?? null,
        systemDescription: system?.description ?? null,
        avatar: member?.avatar_url ?? system?.avatar_url ?? null,
        banner: member?.banner ?? null
    };
}

export async function fetchProfileByMessage(messageId: string): Promise<Profile> {
    const { status, body } = await request(messageId);

    if (status === 404) {
        return { status: ProfileStatus.NotPk, lastUsed: Date.now() };
    }

    if (status === -1) {
        throw new PkApiError(status, `PluralKit request failed for message ${messageId}: ${body}`);
    }

    if (status !== 200 || body == null) {
        throw new PkApiError(status, `PluralKit API returned ${status} for message ${messageId}`);
    }

    return responseToProfile(JSON.parse(body) as PkMessageResponse);
}

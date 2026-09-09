/*
 * Copyright (c) 2026 MetaclassMethod
 */

import type { IpcMainInvokeEvent } from "electron";

const BASE_ENDPOINT = "https://api.pluralkit.me/v2";
const USER_AGENT = "PluralCord (github.com/MetaclassMethod/pluralgrace)";

export interface PkFetchResult {
    status: number;
    body: string | null;
}

export async function fetchPkMessage(_: IpcMainInvokeEvent, messageId: string): Promise<PkFetchResult> {
    try {
        const response = await fetch(`${BASE_ENDPOINT}/messages/${messageId}`, {
            headers: { "User-Agent": USER_AGENT }
        });

        return { status: response.status, body: response.ok ? await response.text() : null };
    } catch (error) {
        return { status: -1, body: String(error) };
    }
}

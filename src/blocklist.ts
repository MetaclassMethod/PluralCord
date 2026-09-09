/*
 * Copyright (c) 2026 MetaclassMethod
 */

import * as DataStore from "@api/DataStore";
import { React } from "@webpack/common";

import { isResolved, Profile } from "./pluralkit/types";

const STORE_KEY = "pluralgrace-blocklist";

export type BlockScope = "member" | "system";

export interface BlockEntry {
    id: string;
    name: string;
    systemName?: string;
    blockedAt: number;
}

interface BlockData {
    members: Record<string, BlockEntry>;
    systems: Record<string, BlockEntry>;
}

const empty = (): BlockData => ({ members: {}, systems: {} });

class Blocklist {
    private data: BlockData = empty();
    private listeners = new Set<() => void>();
    private loaded = false;

    async load(): Promise<void> {
        const stored = await DataStore.get<BlockData>(STORE_KEY);
        this.data = { ...empty(), ...stored };
        this.loaded = true;
        this.emit();
    }

    private emit(): void {
        for (const listener of this.listeners) listener();
    }

    private async persist(): Promise<void> {
        this.emit();
        if (this.loaded) await DataStore.set(STORE_KEY, this.data);
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    entries(scope: BlockScope): BlockEntry[] {
        const source = scope === "member" ? this.data.members : this.data.systems;
        return Object.values(source).sort((a, b) => b.blockedAt - a.blockedAt);
    }

    has(scope: BlockScope, id: string | undefined): boolean {
        if (!id) return false;
        return (scope === "member" ? this.data.members : this.data.systems)[id] != null;
    }

    async block(scope: BlockScope, entry: Omit<BlockEntry, "blockedAt">): Promise<void> {
        const target = scope === "member" ? this.data.members : this.data.systems;
        target[entry.id] = { ...entry, blockedAt: Date.now() };
        await this.persist();
    }

    async unblock(scope: BlockScope, id: string): Promise<void> {
        const target = scope === "member" ? this.data.members : this.data.systems;
        delete target[id];
        await this.persist();
    }

    reasonFor(profile: Profile | null | undefined): BlockScope | null {
        if (!isResolved(profile)) return null;
        if (this.has("member", profile.memberId)) return "member";
        if (this.has("system", profile.systemId)) return "system";
        return null;
    }
}

export const blocklist = new Blocklist();

export function useBlocklist(): Blocklist {
    const [, forceUpdate] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => blocklist.subscribe(forceUpdate), []);
    return blocklist;
}

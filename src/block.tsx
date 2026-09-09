/*
 * Copyright (c) 2026 MetaclassMethod
 */

import { Alerts } from "@webpack/common";

import { blocklist, BlockScope } from "./blocklist";
import type { Profile } from "./pluralkit/types";

export function labelFor(scope: BlockScope, profile: Profile): string {
    if (scope === "member") return profile.name || "this member";
    return profile.systemName || profile.tag?.trim() || `system ${profile.systemId}`;
}

export function confirmBlock(scope: BlockScope, profile: Profile): void {
    const name = labelFor(scope, profile);

    const body =
        scope === "member"
            ? `Messages proxied by ${name} will be hidden. Other members of their system will remain unaffected.`
            : `Messages from every member of ${name} will be hidden, not just the member who sent this message.`;

    Alerts.show({
        title: scope === "member" ? `Hol' up, we're blocking ${name}` : "Hol' up, we're blocking this system",
        body: `${body}\n\nYou can undo this any time in the plugin's settings.`,
        confirmText: "I'm sure",
        cancelText: "Nevermind",
        confirmColor: "pg-danger-button",
        onConfirm: () => {
            const id = scope === "member" ? profile.memberId : profile.systemId;
            if (!id) return;

            void blocklist.block(scope, {
                id,
                name,
                systemName: scope === "member" ? profile.systemName ?? undefined : undefined
            });
        }
    });
}

/*
 * Copyright (c) 2026 MetaclassMethod
 */

import type { Message } from "@vencord/discord-types";
import { GuildMemberStore } from "@webpack/common";

import { useBlocklist } from "./blocklist";
import { acceptableContrast, ContrastOptions } from "./contrast";
import { isProxiedMessage } from "./pluralkit/identity";
import { useIsProxiedOriginal } from "./pluralkit/originals";
import { isResolved, type Profile } from "./pluralkit/types";
import { useProfile } from "./pluralkit/useProfile";
import { ColourPreference, settings } from "./settings";

export function contrastOptions(): ContrastOptions {
    const { contrastTest, contrastBackground, contrastThreshold } = settings.store;
    return { enabled: contrastTest, background: contrastBackground, threshold: contrastThreshold };
}

function rawColour(
    pref: ColourPreference,
    profile: Profile,
    guildId: string | undefined,
    fallBackToMember: boolean
): string | null {
    switch (pref) {
        case ColourPreference.Member:
            return profile.colour ?? profile.systemColour ?? null;

        case ColourPreference.System:
            return fallBackToMember ? profile.systemColour ?? profile.colour ?? null : profile.systemColour ?? null;

        case ColourPreference.Role:
            if (!guildId || !profile.sender) return null;
            return GuildMemberStore.getMember(guildId, profile.sender)?.colorString ?? null;

        case ColourPreference.Theme:
        default:
            return null;
    }
}

export function resolveColour(
    pref: ColourPreference,
    profile: Profile,
    guildId: string | undefined,
    fallBackToMember: boolean
): string | null {
    const colour = rawColour(pref, profile, guildId, fallBackToMember);
    return acceptableContrast(colour, contrastOptions()) ? colour : null;
}

export function useMessageProps(message: Message) {
    const profile = useProfile(message);
    const blocks = useBlocklist();
    const isProxiedOriginal = useIsProxiedOriginal(message);

    if (isProxiedOriginal && settings.store.hideProxiedOriginals) {
        return { "data-pg-hidden": "proxy-original", style: { display: "none" } };
    }

    if (!isProxiedMessage(message) || !isResolved(profile)) return {};

    if (blocks.reasonFor(profile)) {
        return { "data-pg-hidden": "blocked", style: { display: "none" } };
    }

    if (!settings.store.colourText) return {};
    if ((message as Message & { state?: string; }).state === "SEND_FAILED") return {};

    const colour = profile.colour;
    if (!acceptableContrast(colour, contrastOptions())) return {};

    return {
        style: {
            color: colour,
            "--text-strong": colour,
            "--text-normal": colour
        }
    };
}

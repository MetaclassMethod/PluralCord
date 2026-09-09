/*
 * Copyright (c) 2026 MetaclassMethod
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

import { BlockedList } from "./components/BlockedList";

export const ColourPreference = {
    Member: "member",
    System: "system",
    Role: "role",
    Theme: "theme"
} as const;

export type ColourPreference = (typeof ColourPreference)[keyof typeof ColourPreference];

const colourOptions = [
    { label: "Member colour", value: ColourPreference.Member },
    { label: "System colour", value: ColourPreference.System },
    { label: "Role colour", value: ColourPreference.Role },
    { label: "Theme default", value: ColourPreference.Theme }
];

export const settings = definePluginSettings({
    colourText: {
        type: OptionType.BOOLEAN,
        description: "Colour the body text of proxied messages, not just the name",
        default: false
    },
    useServerNames: {
        type: OptionType.BOOLEAN,
        description: "Show per-server display names instead of the member's PluralKit name",
        default: true
    },
    memberColour: {
        type: OptionType.SELECT,
        description: "Colour for the member name",
        options: colourOptions.map(o => ({ ...o, default: o.value === ColourPreference.Member }))
    },
    tagColour: {
        type: OptionType.SELECT,
        description: "Colour for the system tag",
        options: colourOptions.map(o => ({ ...o, default: o.value === ColourPreference.System }))
    },

    tagLegibility: {
        type: OptionType.SLIDER,
        description: "Minimum contrast between the PLURAL tag's text and its background. Pale system colours are darkened until they reach it.",
        default: 4.5,
        markers: [1, 3, 4.5, 7],
        stickToMarkers: false
    },

    showPronouns: {
        type: OptionType.BOOLEAN,
        description: "Show the member's pronouns next to the timestamp. Don't worry, this works even with UserMessagePronouns enabled!",
        default: true
    },
    showProfileInfo: {
        type: OptionType.BOOLEAN,
        description: "Add a PluralKit section (banner, system, bio) to a proxied member's profile popout",
        default: true
    },

    contrastTest: {
        type: OptionType.BOOLEAN,
        description: "Fall back to the theme colour when a PluralKit colour is too low-contrast to read",
        default: true
    },
    contrastBackground: {
        type: OptionType.STRING,
        description: "Background colour to test against (#000000 for dark themes, #ffffff for light). This alters the contrast base.",
        default: "#000000",
        isValid: (value: string) => /^#?([a-f\d]{3}|[a-f\d]{6})$/i.test(value) || "Must be a hex colour, e.g. #000000"
    },
    contrastThreshold: {
        type: OptionType.SLIDER,
        description: "Minimum contrast ratio (The WCAG AA for large text, and the default here is 3)",
        default: 3,
        markers: [1, 2, 3, 4.5, 7, 14, 21],
        stickToMarkers: false
    },

    mentionProxies: {
        type: OptionType.BOOLEAN,
        description: "Typing @MemberName sends a ping to the account behind the proxy",
        default: true
    },
    mentionAutocomplete: {
        type: OptionType.BOOLEAN,
        description: "Offer PluralKit members in the @ suggestion list (needs \"Mention proxies\" on). This is experimental, and may not work properly (or at all).",
        default: true
    },

    mentionMemberNames: {
        type: OptionType.BOOLEAN,
        description: "Show the member name on mentions of an account that proxies, instead of their Discord username (turn off if you enable RoleColorEverywhere)",
        default: true
    },

    hideProxiedOriginals: {
        type: OptionType.BOOLEAN,
        description:
            "Hide the pre-proxy original that MessageLogger keeps, so a proxied message does not also appear as a deleted one. This is experimental, and may not work properly (or at all).",
        default: false
    },

    blocked: {
        type: OptionType.COMPONENT,
        description: "This contains blocked members and systems",
        component: BlockedList
    }
});

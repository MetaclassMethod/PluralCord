/*
 * Copyright (c) 2026 MetaclassMethod
 */

import { getIntlMessage } from "@utils/discord";
import { classes } from "@utils/misc";
import type { Message } from "@vencord/discord-types";
import { findCssClassesLazy } from "@webpack";
import { Tooltip } from "@webpack/common";

import { isResolved } from "../pluralkit/types";
import { useProfile } from "../pluralkit/useProfile";
import { settings } from "../settings";

const TimestampClasses = findCssClassesLazy("timestampInline", "timestamp");

export function PkPronouns({ message }: { message: Message; }) {
    const { showPronouns } = settings.use(["showPronouns"]);
    const profile = useProfile(message);

    if (!showPronouns || !isResolved(profile)) return null;

    const pronouns = profile.pronouns?.replace(/\s+/g, " ").trim();
    if (!pronouns) return null;

    return (
        <Tooltip text={getIntlMessage("USER_PROFILE_PRONOUNS")}>
            {tooltipProps => (
                <span
                    {...tooltipProps}
                    className={classes("pg-pronouns", TimestampClasses.timestampInline, TimestampClasses.timestamp)}
                >
                    • {pronouns}
                </span>
            )}
        </Tooltip>
    );
}

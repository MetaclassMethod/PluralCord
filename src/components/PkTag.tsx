/*
 * Copyright (c) 2026 MetaclassMethod
 */

import { classes } from "@utils/misc";
import { findCssClassesLazy } from "@webpack";
import { Tooltip } from "@webpack/common";

import { adjustForLegibility } from "../contrast";
import { profileStore } from "../pluralkit/store";
import { isResolved, Profile, ProfileStatus } from "../pluralkit/types";
import { settings } from "../settings";

const TagClasses = findCssClassesLazy("botTagVerified", "botTagRegular", "botText", "px", "rem");

const PENDING: ProfileStatus[] = [ProfileStatus.Requesting, ProfileStatus.Updating, ProfileStatus.Stale];

const TEXT_COLOUR = "#ffffff";

// blurple :>
const FALLBACK = "#5865f2";

export function PkTag({ hash, profile }: { hash: string; profile: Profile; }) {
    const { tagLegibility } = settings.use(["tagLegibility"]);
    const pending = PENDING.includes(profile.status);

    const base = (isResolved(profile) && (profile.systemColour ?? profile.colour)) || FALLBACK;
    const background = adjustForLegibility(base, TEXT_COLOUR, tagLegibility);

    return (
        <Tooltip text={pending ? "Fetching PluralKit data…" : "Click to refresh PluralKit data"}>
            {tooltipProps => (
                <span
                    {...tooltipProps}
                    className={classes(
                        "pg-tag",
                        TagClasses.botTagVerified,
                        TagClasses.botTagRegular,
                        TagClasses.px,
                        TagClasses.rem
                    )}
                    style={{ backgroundColor: background, color: TEXT_COLOUR }}
                    role="button"
                    tabIndex={0}
                    onClick={() => profileStore.invalidate(hash)}
                    onKeyDown={e => {
                        if (e.key === "Enter" || e.key === " ") profileStore.invalidate(hash);
                    }}
                >
                    <span className={TagClasses.botText}>
                        {pending ? <span className="pg-tag-dots" aria-label="Loading" /> : "PLURAL"}
                    </span>
                </span>
            )}
        </Tooltip>
    );
}

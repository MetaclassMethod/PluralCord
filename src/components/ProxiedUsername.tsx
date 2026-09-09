/*
 * Copyright (c) 2026 MetaclassMethod
 */

import type { Channel, Message } from "@vencord/discord-types";

import { useBlocklist } from "../blocklist";
import { resolveColour } from "../colour";
import { displayIdentity, rawUsername, userHash } from "../pluralkit/identity";
import { isResolved, ProfileStatus } from "../pluralkit/types";
import { useProfile } from "../pluralkit/useProfile";
import { settings } from "../settings";
import { PkTag } from "./PkTag";

export interface UsernameProps {
    author?: { nick: string; authorId: string; };
    channel?: Channel;
    message: Message;
    withMentionPrefix?: boolean;
    isRepliedMessage?: boolean;
}

export function ProxiedUsername({ message, channel, withMentionPrefix, isRepliedMessage }: UsernameProps) {
    const { useServerNames, memberColour, tagColour } = settings.use([
        "useServerNames",
        "memberColour",
        "tagColour"
    ]);
    const profile = useProfile(message);
    const blocks = useBlocklist();

    const resolved = isResolved(profile);
    const isPluralKit = profile != null && profile.status !== ProfileStatus.NotPk;

    if (blocks.reasonFor(profile)) return null;

    const { name, tag } = resolved
        ? displayIdentity(message.author, profile.name, profile.tag, useServerNames)
        : { name: rawUsername(message.author), tag: "" };

    const nameColour = resolved ? resolveColour(memberColour, profile, channel?.guild_id, true) : null;
    const tagColourValue = resolved ? resolveColour(tagColour, profile, channel?.guild_id, false) : null;

    return (
        <>
            {withMentionPrefix ? "@" : ""}
            <span className="pg-name-segment" style={nameColour ? { color: nameColour } : undefined}>
                {name}
            </span>
            {tag && (
                <>
                    {" "}
                    <span className="pg-name-segment" style={tagColourValue ? { color: tagColourValue } : undefined}>
                        {tag}
                    </span>
                </>
            )}
            {/* reply previews are cramped and already show the name; no chip */}
            {isPluralKit && !isRepliedMessage && <PkTag hash={userHash(message)} profile={profile} />}
        </>
    );
}

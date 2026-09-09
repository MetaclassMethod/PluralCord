/*
 * Copyright (c) 2026 MetaclassMethod
 */

import { Divider } from "@components/Divider";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import type { User } from "@vencord/discord-types";

import { useProfileForUser } from "../pluralkit/useProfile";

export function PkProfileSection({ user }: { user?: User; }) {
    const profile = useProfileForUser(user);
    if (!profile) return null;

    const system = profile.systemName || profile.tag?.trim();
    const bio = profile.description?.trim();

    // Nothing worth a whole section for!
    if (!system && !bio && !profile.banner) return null;

    return (
        <div className="pg-profile">
            <Divider className="pg-profile-divider" />
            <Heading tag="h3" className="pg-profile-title">PluralKit</Heading>

            {profile.banner && (
                <img className="pg-profile-banner" src={profile.banner} alt="Member banner" loading="lazy" />
            )}

            {system && (
                <Paragraph className="pg-profile-row">
                    <span className="pg-profile-label">Member of</span> {system}
                    {profile.tag?.trim() && profile.systemName && (
                        <span className="pg-profile-tag"> {profile.tag.trim()}</span>
                    )}
                </Paragraph>
            )}

            {bio && <Paragraph className="pg-profile-bio">{bio}</Paragraph>}
        </div>
    );
}

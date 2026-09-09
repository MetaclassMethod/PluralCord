/*
 * Copyright (c) 2026 MetaclassMethod
 */

export interface PkMessageResponse {
    sender: string;
    system: PkSystem | null;
    member: PkMember | null;
}

export interface PkSystem {
    id: string;
    name: string | null;
    tag: string | null;
    color: string | null;
    description: string | null;
    avatar_url: string | null;
}

export interface PkMember {
    id: string;
    name: string;
    display_name: string | null;
    color: string | null;
    description: string | null;
    pronouns: string | null;
    avatar_url: string | null;
    banner: string | null;
}

export const ProfileStatus = {
    Done: "done",
    Requesting: "requesting",
    Updating: "updating",
    NotPk: "not-pk",
    Stale: "stale"
} as const;

export type ProfileStatus = (typeof ProfileStatus)[keyof typeof ProfileStatus];

export interface Profile {
    status: ProfileStatus;
    lastUsed: number;

    memberId?: string;
    systemId?: string;
    sender?: string;

    name?: string;
    systemName?: string | null;
    tag?: string | null;

    colour?: string | null;
    systemColour?: string | null;

    pronouns?: string | null;
    description?: string | null;
    systemDescription?: string | null;
    avatar?: string | null;
    banner?: string | null;
}

export type ResolvedProfile = Profile & { status: typeof ProfileStatus.Done | typeof ProfileStatus.Updating; };

export function isResolved(profile: Profile | null | undefined): profile is ResolvedProfile {
    return profile != null && (profile.status === ProfileStatus.Done || profile.status === ProfileStatus.Updating);
}

/*
 * Copyright (c) 2026 MetaclassMethod
 */

import type { Message } from "@vencord/discord-types";
import { React } from "@webpack/common";

import { isProxiedMessage, userHash } from "./identity";
import { profileStore } from "./store";
import type { Profile } from "./types";

export function useProfile(message: Message | null | undefined): Profile | null {
    const hash = message && isProxiedMessage(message) ? userHash(message) : null;

    const [profile, setProfile] = React.useState<Profile | null>(() => (hash ? profileStore.get(hash) : null));

    React.useEffect(() => {
        if (!hash || !message) {
            setProfile(null);
            return;
        }

        setProfile(profileStore.get(hash));
        profileStore.ensure(message);

        return profileStore.subscribe(changed => {
            if (changed === hash || changed === "*") setProfile(profileStore.get(hash));
        });
    }, [hash]);

    return profile;
}

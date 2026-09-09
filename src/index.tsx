/*
 * Copyright (c) 2026 MetaclassMethod
 */

import "./style.css";

import {
    addMessagePreEditListener,
    addMessagePreSendListener,
    removeMessagePreEditListener,
    removeMessagePreSendListener
} from "@api/MessageEvents";
import ErrorBoundary from "@components/ErrorBoundary";
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";
import type { Message } from "@vencord/discord-types";
import { Menu } from "@webpack/common";

import { confirmBlock } from "./block";
import { blocklist } from "./blocklist";
import { useMessageProps } from "./colour";
import { PkProfileSection } from "./components/PkProfileSection";
import { PkPronouns } from "./components/PkPronouns";
import { ProxiedUsername, type UsernameProps } from "./components/ProxiedUsername";
import { PLUGIN_NAME } from "./constants";
import { isEditable, onPreEdit, startEditing } from "./edit";
import { injectMentionResults, mentionUser, rewriteMentions } from "./mentions";
import { isProxiedMessage, userHash } from "./pluralkit/identity";
import { profileStore } from "./pluralkit/store";
import { isResolved } from "./pluralkit/types";
import { settings } from "./settings";

const onPreSend = (_channelId: string, messageObj: { content: string; }) => {
    if (!settings.store.mentionProxies) return;
    messageObj.content = rewriteMentions(messageObj.content);
};

export default definePlugin({
    name: "PluralCord",
    description:
        "A custom PluralKit integration: shows member names, system tags and colours on proxied messages, and lets you edit them.",
    authors: [{ name: "MetaclassMethod", id: 760441533022732318n }],
    tags: ["Appearance", "Chat"],
    settings,

    patches: [
        {
            find: '="SYSTEM_TAG"',
            replacement: {
                match: /(?<=onContextMenu:\i,children:)(?=\i\?.{0,100}?user[Nn]ame:)/,
                replace: "$self.shouldRender(arguments[0])?$self.renderUsername(arguments[0]):"
            }
        },
        {
            find: "showCommunicationDisabledStyles",
            replacement: {
                match: /(?<=return\s*\(0,\i\.jsxs?\)\(.+!\i&&\[?\(0,\i\.jsxs?\)\(.+?\{.+?\}\))/,
                replace: ",$self.renderPronouns(arguments[0])"
            },
            predicate: () => settings.store.showPronouns
        },
        {
            find: "renderResults({results:",
            replacement: {
                match: /let \i=.{1,100}renderResults\({results:(\i)\.query\.results,/,
                replace: "$self.injectMentionResults($1);$&"
            },
            predicate: () => settings.store.mentionProxies && settings.store.mentionAutocomplete
        },
        {
            find: ".USER_MENTION)",
            replacement: {
                match: /user:(\i),guildId:/,
                replace: "user:$self.mentionUser($1),guildId:"
            },
            predicate: () => settings.store.mentionMemberNames
        },
        {
            find: ".SEND_FAILED,",
            replacement: {
                match: /(?<=\]:(\i)\.isUnsupported.{0,50}?,)(?=children:\[)/,
                replace: "...$self.useMessageProps($1),"
            }
        },
        {
            find: '"UserProfilePopout");',
            replacement: {
                match: /(?<=userId:\i\.id,guild:\i\}\)(?:,\i(?:\.\i)*\(arguments\[0\]\))*)(?=\])/,
                replace: ",$self.profileSection(arguments[0])"
            },
            predicate: () => settings.store.showProfileInfo
        }
    ],

    contextMenus: {
        message(children: any[], props: { message?: Message; }) {
            const { message } = props;
            if (!message || !isProxiedMessage(message)) return;

            const items: React.ReactNode[] = [];

            if (isEditable(message)) {
                items.push(
                    <Menu.MenuItem id="pg-edit" label="Edit Proxied Message" action={() => startEditing(message)} />
                );
            }

            const profile = profileStore.get(userHash(message));

            if (isResolved(profile)) {
                if (profile.memberId && !blocklist.has("member", profile.memberId)) {
                    items.push(
                        <Menu.MenuItem
                            id="pg-block-member"
                            label="Block Member"
                            color="danger"
                            action={() => confirmBlock("member", profile)}
                        />
                    );
                }

                if (profile.systemId && !blocklist.has("system", profile.systemId)) {
                    items.push(
                        <Menu.MenuItem
                            id="pg-block-system"
                            label="Block System"
                            color="danger"
                            action={() => confirmBlock("system", profile)}
                        />
                    );
                }
            }

            children.splice(0, 0, ...items);
        }
    },

    async start() {
        if (this.name !== PLUGIN_NAME) {
            new Logger(this.name).error(
                `Plugin ver "${this.name}" does not match PLUGIN_NAME "${PLUGIN_NAME}" in constants.ts. Please report this!`
            );
        }

        await Promise.all([profileStore.load(), blocklist.load()]);
        addMessagePreEditListener(onPreEdit);
        addMessagePreSendListener(onPreSend);
    },

    async stop() {
        removeMessagePreEditListener(onPreEdit);
        removeMessagePreSendListener(onPreSend);
        await profileStore.flush();
    },

    shouldRender(props: UsernameProps | undefined) {
        return isProxiedMessage(props?.message);
    },

    renderUsername: ErrorBoundary.wrap((props: UsernameProps) => <ProxiedUsername {...props} />, { noop: true }),

    renderPronouns: ErrorBoundary.wrap(({ message }: { message: Message; }) => <PkPronouns message={message} />, {
        noop: true
    }),

    profileSection: ErrorBoundary.wrap(
        (props: { user?: import("@vencord/discord-types").User; }) => <PkProfileSection user={props.user} />,
        { noop: true }
    ),

    injectMentionResults,
    mentionUser,
    useMessageProps
});

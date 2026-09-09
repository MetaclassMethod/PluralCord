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
import definePlugin from "@utils/types";
import type { Message } from "@vencord/discord-types";
import { Menu } from "@webpack/common";

import { confirmBlock } from "./block";
import { blocklist } from "./blocklist";
import { useMessageProps } from "./colour";
import { PkPronouns } from "./components/PkPronouns";
import { ProxiedUsername, type UsernameProps } from "./components/ProxiedUsername";
import { isEditable, onPreEdit, startEditing } from "./edit";
import { injectMentionResults, rewriteMentions } from "./mentions";
import { isProxiedMessage, userHash } from "./pluralkit/identity";
import { profileStore } from "./pluralkit/store";
import { isResolved } from "./pluralkit/types";
import { settings } from "./settings";

const onPreSend = (_channelId: string, messageObj: { content: string; }) => {
    if (!settings.store.mentionProxies) return;
    messageObj.content = rewriteMentions(messageObj.content);
};

export default definePlugin({
    name: "pluralgrace",
    description:
        "PluralKit integration: shows member names, system tags and colours on proxied messages, and lets you edit them.",
    authors: [{ name: "MetaclassMethod", id: 0n }],
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
            find: ".SEND_FAILED,",
            replacement: {
                match: /(?<=\]:(\i)\.isUnsupported.{0,50}?,)(?=children:\[)/,
                replace: "...$self.useMessageProps($1),"
            }
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

    injectMentionResults,
    useMessageProps
});

/*
 * Copyright (c) 2026 MetaclassMethod
 */

import { sendMessage } from "@utils/discord";
import type { Message } from "@vencord/discord-types";
import { ChannelStore, MessageActions, MessageStore, UserStore } from "@webpack/common";

import { isProxiedMessage, userHash } from "./pluralkit/identity";
import { profileStore } from "./pluralkit/store";

export function isEditable(message: Message | null | undefined): boolean {
    if (!message) return false;

    const currentUserId = UserStore.getCurrentUser()?.id;
    if (!currentUserId) return false;
    if (message.author?.id === currentUserId) return true;

    if (!isProxiedMessage(message)) return false;
    return profileStore.get(userHash(message))?.sender === currentUserId;
}

export function buildEditCommand(guildId: string | undefined, channelId: string, messageId: string, content: string) {
    const guildSegment = guildId ?? "@me";
    return `pk;e https://discord.com/channels/${guildSegment}/${channelId}/${messageId} ${content}`;
}

export function onPreEdit(channelId: string, messageId: string, messageObj: { content: string; }) {
    const message = MessageStore.getMessage(channelId, messageId);
    if (!isProxiedMessage(message) || !isEditable(message)) return;

    const guildId = ChannelStore.getChannel(channelId)?.guild_id;
    sendMessage(channelId, { content: buildEditCommand(guildId, channelId, messageId, messageObj.content) });

    return { cancel: true };
}

export function startEditing(message: Message) {
    MessageActions.startEditMessage(message.channel_id, message.id, message.content);
}

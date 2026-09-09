declare module "@vencord/discord-types" {
    export interface User {
        id: string;
        username: string;
        avatar: string | null;
        bot?: boolean;
    }

    export interface Channel {
        id: string;
        guild_id?: string;
    }

    export interface Message {
        id: string;
        channel_id: string;
        content: string;
        author: User;
        webhookId?: string | null;
        application_id?: string;
    }

    export interface Guild {
        id: string;
        ownerId: string;
    }
}

declare module "@utils/types" {
    import type { ComponentType } from "react";

    export enum OptionType {
        STRING,
        NUMBER,
        BIGINT,
        BOOLEAN,
        SELECT,
        SLIDER,
        COMPONENT,
        CUSTOM
    }

    export interface PluginAuthor {
        name: string;
        id: bigint;
    }

    export interface PatchReplacement {
        match: string | RegExp;
        replace: string | ((...args: string[]) => string);
    }

    export interface Patch {
        find: string | RegExp;
        replacement: PatchReplacement | PatchReplacement[];
        group?: boolean;
        predicate?: () => boolean;
        noWarn?: boolean;
    }

    export interface PluginDef {
        name: string;
        description: string;
        authors: PluginAuthor[];
        patches?: Patch[];
        settings?: unknown;
        dependencies?: string[];
        required?: boolean;
        start?(): void | Promise<void>;
        stop?(): void | Promise<void>;
        settingsAboutComponent?: ComponentType;
        [key: string]: unknown;
    }

    export default function definePlugin<T extends PluginDef>(def: T): T;

    export type PluginNative<T extends Record<string, (event: any, ...args: any[]) => any>> = {
        [K in keyof T]: T[K] extends (event: any, ...args: infer A) => infer R
            ? (...args: A) => R extends Promise<any> ? R : Promise<R>
            : never;
    };
}

declare const VencordNative: {
    pluginHelpers: Record<string, any>;
};

declare module "@api/Settings" {
    export interface SettingOption {
        type: unknown;
        description: string;
        default?: unknown;
        options?: readonly { label: string; value: unknown; default?: boolean; }[];
        markers?: readonly number[];
        stickToMarkers?: boolean;
        isValid?(value: never): boolean | string;
        component?: unknown;
        onChange?(value: never): void;
    }

    export function definePluginSettings<D extends Record<string, SettingOption>>(
        def: D
    ): {
        def: D;
        store: any;
        use(keys?: (keyof D)[]): any;
        withPrivateSettings<T>(): { store: any & T; };
    };
}

declare module "@components/ErrorBoundary" {
    import type { ComponentType, FunctionComponent } from "react";

    interface ErrorBoundaryProps {
        noop?: boolean;
        fallback?: ComponentType<any>;
        onError?(info: unknown): void;
        displayName?: string;
    }

    const ErrorBoundary: ComponentType<any> & {
        wrap<T extends object = any>(Component: ComponentType<T>, props?: ErrorBoundaryProps): FunctionComponent<T>;
    };

    export default ErrorBoundary;
}

declare module "@components/Button" {
    import type { ComponentPropsWithRef } from "react";

    export type ButtonVariant =
        | "primary"
        | "secondary"
        | "dangerPrimary"
        | "dangerSecondary"
        | "overlayPrimary"
        | "positive"
        | "link"
        | "none";
    export type ButtonSize = "min" | "xs" | "small" | "medium" | "iconOnly";

    export function Button(
        props: ComponentPropsWithRef<"button"> & { variant?: ButtonVariant; size?: ButtonSize; }
    ): JSX.Element;
}

declare module "@components/Heading" {
    import type { ComponentPropsWithoutRef } from "react";

    export type HeadingTag = `h${1 | 2 | 3 | 4 | 5 | 6}`;

    export function Heading<T extends HeadingTag>(
        props: ComponentPropsWithoutRef<T> & { tag?: T; }
    ): JSX.Element;
}

declare module "@components/Paragraph" {
    import type { ComponentPropsWithoutRef } from "react";

    export function Paragraph(props: ComponentPropsWithoutRef<"p">): JSX.Element;
}

declare module "@api/DataStore" {
    export function get<T = unknown>(key: string): Promise<T | undefined>;
    export function set<T = unknown>(key: string, value: T): Promise<void>;
    export function del(key: string): Promise<void>;
}

declare module "@api/ContextMenu" {
    import type { ReactElement } from "react";

    export type NavContextMenuPatchCallback = (
        children: ReactElement[] | any[],
        props: Record<string, any>
    ) => void;

    export function addContextMenuPatch(id: string | string[], patch: NavContextMenuPatchCallback): void;
    export function removeContextMenuPatch(id: string | string[], patch: NavContextMenuPatchCallback): void;
}

declare module "@api/MessageEvents" {
    export interface MessageObject {
        content: string;
    }

    export type MessageEditListener = (
        channelId: string,
        messageId: string,
        messageObj: MessageObject
    ) => void | { cancel: boolean; } | Promise<void | { cancel: boolean; }>;

    export function addMessagePreEditListener(listener: MessageEditListener): MessageEditListener;
    export function removeMessagePreEditListener(listener: MessageEditListener): boolean;
}

declare module "@utils/discord" {
    import type { Channel } from "@vencord/discord-types";

    export function sendMessage(
        channelId: string,
        data: { content: string; } & Record<string, unknown>,
        waitForChannelReady?: boolean,
        extra?: Record<string, unknown>
    ): Promise<unknown>;

    export function getCurrentChannel(): Channel | undefined;

    export function getIntlMessage(key: string, values?: Record<string, unknown>): string;
}

declare module "@utils/misc" {
    export function classes(...classNames: (string | null | undefined | false)[]): string;
}

declare module "@webpack" {
    export function findCssClassesLazy<T extends string>(...keys: T[]): Record<T, string>;
}

declare module "@webpack/common" {
    import type { Channel, Message, User } from "@vencord/discord-types";
    import type * as ReactNS from "react";

    export const React: typeof ReactNS;

    export const Tooltip: ReactNS.ComponentType<{
        text: ReactNS.ReactNode;
        children: (props: {
            onMouseEnter: ReactNS.MouseEventHandler;
            onMouseLeave: ReactNS.MouseEventHandler;
        }) => ReactNS.ReactNode;
    }>;

    export const Menu: {
        MenuItem: ReactNS.ComponentType<{
            id: string;
            label: string;
            action?: () => void;
            icon?: ReactNS.ComponentType;
            [key: string]: unknown;
        }>;
        [key: string]: any;
    };

    export const GuildMemberStore: {
        getMember(guildId: string, userId: string): { colorString?: string; } | null;
    };

    export const ChannelStore: {
        getChannel(channelId: string): Channel | null;
    };

    export const MessageStore: {
        getMessage(channelId: string, messageId: string): Message | null;
        getMessages(channelId: string): { toArray(): Message[]; };
    };

    export const MessageActions: {
        startEditMessage(channelId: string, messageId: string, content: string): void;
    };

    export const UserStore: {
        getCurrentUser(): User | null;
    };

    export const Alerts: {
        show(alert: {
            title: unknown;
            body: ReactNS.ReactNode;
            className?: string;
            confirmColor?: string;
            confirmText?: string;
            cancelText?: string;
            onConfirm?(): void;
            onCancel?(): void;
        }): void;
        close(): void;
    }; 
    // this is AFAIK, the closest to what it is
}

declare module "electron" {
    export interface IpcMainInvokeEvent {
        readonly frameId: number;
        readonly processId: number;
        readonly sender: unknown;
    }
}

declare module "*.css";

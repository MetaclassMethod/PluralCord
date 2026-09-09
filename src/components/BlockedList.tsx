/*
 * Copyright (c) 2026 MetaclassMethod
 */

import { Button } from "@components/Button";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";

import { BlockEntry, BlockScope, useBlocklist } from "../blocklist";

function Section({ scope, title, empty }: { scope: BlockScope; title: string; empty: string; }) {
    const blocks = useBlocklist();
    const entries = blocks.entries(scope);

    return (
        <section className="pg-blocklist-section">
            <Heading tag="h5">{title}</Heading>

            {entries.length === 0 ? (
                <Paragraph className="pg-blocklist-empty">{empty}</Paragraph>
            ) : (
                entries.map((entry: BlockEntry) => (
                    <div className="pg-blocklist-row" key={entry.id}>
                        <div className="pg-blocklist-name">
                            {entry.name}
                            <span className="pg-blocklist-meta">
                                {entry.systemName ? `${entry.systemName} · ` : ""}
                                {entry.id}
                            </span>
                        </div>
                        <Button size="small" variant="secondary" onClick={() => void blocks.unblock(scope, entry.id)}>
                            Unblock
                        </Button>
                    </div>
                ))
            )}
        </section>
    );
}

export function BlockedList() {
    return (
        <>
            <Section scope="member" title="Blocked members" empty="No blocked members." />
            <Section scope="system" title="Blocked systems" empty="No blocked systems." />
            <Paragraph className="pg-blocklist-hint">
                You can block someone by right-clicking one of their proxied messages.
            </Paragraph>
        </>
    );
}

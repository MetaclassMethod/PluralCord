/*
 * Copyright (c) 2026 MetaclassMethod
 */

import { cp, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const vencordPath = process.env.VENCORD_PATH ?? join(process.env.USERPROFILE ?? "", "Documents", "Vencord");
const userplugins = join(vencordPath, "src", "userplugins");
const destination = join(userplugins, "PluralCord");

await rm(join(userplugins, "pluralgrace"), { recursive: true, force: true });

await rm(destination, { recursive: true, force: true });
await cp(join(repoRoot, "src"), destination, { recursive: true });

console.log(`PluralCord -> ${destination}`);

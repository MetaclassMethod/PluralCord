<p align="center">
  <img src="demo/banner.png" alt="PluralCord" width="100%">
</p>

A work by [MetaclassMethod](https://github.com/MetaclassMethod)

---

PluralKit integration for [Vencord](https://github.com/Vendicated/Vencord). It is a port of
[Pluralchum](https://github.com/estroBiologist/pluralchum), which does the same job for
BetterDiscord.

PluralKit proxies messages through webhooks, and Discord gives webhooks no member colours,
no usable profiles, and an `APP` tag. We fill that in.

We're sponsored by Demo Raccoon. Say hi!

![Demo raccoon](demo/raccoon.jpg)

> [!NOTE]
> I care about your privacy. That's why, the NSA and Department of Defense oversee ALL the data I use from you.
> Jokes aside...
> PluralCord only reads PluralKit data - it never changes your system, members, or proxy
> settings. The *only* thing it writes is an edit, and that goes through PluralKit's own
> `pk;e` command.

---

## Features

| Feature | Description |
| --- | --- |
| **Member names & system tags** | Shown in place of the raw webhook username, each coloured by the member colour, the system colour, the sender's role colour, or left to the theme - configured independently for name and tag. |
| **Per-server display names** | Split from the system tag appended to the webhook name. Falls back when a server tag override makes the split ambiguous. |
| **A `PLURAL` tag** | Replaces Discord's `APP` tag, coloured by the system. Clicking it forces a refresh! |
| **Pronouns** | The member's pronouns beside the timestamp. Complements `UserMessagesPronouns`, which skips webhooks. |
| **Message text colouring** | Optional. Overrides `--text-strong` and `--text-normal` too, so headings and bold text follow rather than staying stock. |
| **Editing proxied messages** | A context-menu item that routes the edit through PluralKit's `pk;e` command. |
| **Mentioning proxies** | `@MemberName` becomes a real ping of the account behind the proxy, and mentions of that account read as the member! |
| **Blocking** | Block a member or a whole system from the right-click menu; their messages disappear entirely. |
| **[EXPERIMENTAL] Tidy message log** | Hides the pre-proxy original that MessageLogger keeps, so a proxied message doesn't also show up as a deleted one. |

---

## Installation

> [!IMPORTANT]
> PluralCord is a **userplugin**. It has to be built into Vencord from source - you cannot
> install it from the plugin list.

```sh
pnpm install
pnpm sync # copies src/ into ~/Documents/Vencord
VENCORD_PATH=/path/to/Vencord pnpm sync # ...or point it somewhere else!
```

Then build Vencord as usual:

```sh
cd /path/to/Vencord
pnpm build
pnpm inject
```

> [!TIP]
> Re-run `pnpm sync` after every change here, then rebuild Vencord. Use `pnpm watch` in the
> Vencord checkout if you're iterating.

---

## Configuration

> [!TIP]
> **On a light theme, change the contrast test background to `#ffffff` first.** It defaults
> to `#000000`, so on a light theme it rejects dark member colours as unreadable and falls
> everything back to the theme default - which looks exactly like the plugin not working.

<details>
<summary>Every setting</summary>

| Setting | Default | What it does |
| --- | --- | --- |
| Colour proxy text | Off | Tints the whole message body, not just the name |
| Use server names | On | Per-server display names instead of the canonical PluralKit name |
| Member name colour | Member | Member, system, sender's role colour, or theme |
| System tag colour | System | As above, set independently |
| Tag legibility | 4.5 | Minimum contrast for the `PLURAL` tag; pale system colours are darkened until they reach it |
| Show pronouns | On | Member pronouns beside the timestamp |
| Contrast test | On | Falls back to the theme colour when a PluralKit colour is too low-contrast |
| Contrast background | `#000000` | What text is tested against - **set to `#ffffff` on light themes** |
| Contrast threshold | 3 | Minimum ratio; WCAG AA for large text |
| Mention proxies | On | `@MemberName` sends a real ping to the account behind the proxy |
| Mention autocomplete | On | Offers members in the `@` suggestion list |
| Mention member names | On | Mentions of a proxying account read as the member |
| Hide proxied originals | On | Hides the pre-proxy original MessageLogger keeps |

</details>

### Plugin compatibility

| Plugin | Status |
| --- | --- |
| **MessageLogger** | Complements it - hides the pre-proxy original it keeps |
| **UserMessagesPronouns** | Complements it - that one skips webhooks, this one handles them |
| **MoreUserTags** | Its `WEBHOOK` tag is hidden on proxied messages only |
| **RoleColorEverywhere** | ⚠️ Conflicts - see below |

> [!CAUTION]
> **RoleColorEverywhere** patches the same mention module as our *Mention member names*
> feature, and its match needs something ours removes. Only one of the two can apply. If you
> enable it, turn **Mention member names** off.

---

## Development

<details>
<summary>Building, the type shim, how the patches work, and differences from Pluralchum</summary>

```sh
pnpm lint # ESLint
pnpm typecheck # tsc against the local shim
pnpm sync # copy into a Vencord checkout
```

> [!WARNING]
> `types/vencord-shim.d.ts` hand-declares the Vencord modules this plugin imports. It's an
> approximation, **not** Vencord's real types, and it drifts. A green `pnpm typecheck` here
> only proves this code is internally consistent.
>
> The authoritative check is `pnpm testTsc` from inside the Vencord checkout after a sync -
> that one uses the genuine definitions and has caught shim mistakes more than once.

### How the patches work

None of the patch regexes are original. Each is modelled on a plugin shipping in Vencord
itself, which is the best available evidence that it matches the current Discord build:

| What | Modelled on | Target |
| --- | --- | --- |
| Username | `ShowMeYourName` | `="SYSTEM_TAG"` |
| Pronouns | `UserMessagesPronouns` | `showCommunicationDisabledStyles` |
| Mention autocomplete | `FavoriteEmojiFirst` | `renderResults({results:` |
| Mention display | `RoleColorEverywhere` | `.USER_MENTION)` |
| Message body | `RoleColorEverywhere` | `.SEND_FAILED,` |

Where a patch shares a target with another plugin, it's written so both can apply in either
order - a wrapping replacement would leave the other's regex unable to match and silently
disable it.

Vencord logs failed patches to the console at startup. `pnpm buildReporter` from the Vencord
checkout reports them in bulk without opening the client.

### Differences from Pluralchum

The port is not line-for-line. Notable changes:

- **Requests are properly serialised.** Pluralchum spaced requests by multiplying a counter
  by a delay; we queue them through a single chain with a minimum interval, and de-duplicate
  concurrent lookups for the same member so a channel full of one person's proxies costs one
  request rather than many.
- **Unset colours are `null`, not `""`.** Pluralchum stored missing colours as empty strings
  and then used `??` to fall back, which never fired - so "member colour, falling back to
  system colour" silently didn't. That fallback works here.
- **No 370 KB emoji table.** Pluralchum depends on `@ariagivens/discord-unicode-fix-js` to
  match tags whose emoji Discord mangled. We strip variation selectors and zero-width joiners
  for the comparison instead, which handles the realistic cases and keeps the plugin
  dependency-free - a userplugin can't add dependencies to its host checkout.
- **The original message header is left alone.** Pluralchum replaces the whole header and
  keeps a hidden copy so profile popouts still anchor. Following `ShowMeYourName`'s approach,
  we replace only the username node, so that hack isn't needed.
- **The tag doesn't use Discord's generated class names.** Pluralchum hardcodes classes like
  `botTagCozy_c19a55`, which break on most client updates. Ours borrows Discord's tag classes
  at runtime and only overrides the colours.

> [!CAUTION]
> The plugin's `name` in [`src/index.tsx`](src/index.tsx) must stay a **literal string** and
> the **first property** of `definePlugin({` - not even a comment may sit between them.
> Vencord's build reads it out of the source with a regex that allows only whitespace there,
> and registers the native bridge under it. It must also match `PLUGIN_NAME` in
> [`src/constants.ts`](src/constants.ts), which is what the bridge is looked up by at runtime;
> `start()` logs an error if the two ever drift apart.

</details>

---

## Licence

MIT - see [LICENSE.MD](LICENSE.MD).

Derived from Pluralchum, © 2026 Ash Taylor and Contributors, also MIT. See
[NOTICE.md](NOTICE.md) for full attribution.

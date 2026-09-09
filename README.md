# PluralCord

PluralKit integration for [Vencord](https://github.com/Vendicated/Vencord). It is a port of
[Pluralchum](https://github.com/estroBiologist/pluralchum), which does the same job for
BetterDiscord.

PluralKit proxies messages through webhooks, and Discord gives webhooks no member
colours, no usable profiles, and an `APP` tag. We fill that in.

We're sponsored by Demo Raccon. Say hi!

![Demo raccoon](demo/raccoon.jpg)

## Features

- **Member names and system tags** in place of the raw webhook username, each
  coloured by the member colour, the system colour, the sender's role colour, or
  left to the theme — configured independently for name and tag.
- **Per-server display names**, split from the system tag appended to the webhook
  name. Falls back gracefully when a server tag override makes the split ambiguous.
- **A `PK` badge** replacing Discord's `BOT` tag. PluralKit can't tell us when a
  member's colour changes, so clicking the badge forces a refresh.
- **Optional message text colouring** that also overrides Discord's `--text-strong`
  and `--text-normal`, so headings and bold text follow rather than staying stock.
- **Editing proxied messages**, via a context-menu item that routes the edit
  through PluralKit's `pk;e` command.

## Development

```sh
pnpm install
pnpm lint
pnpm typecheck
```

This repository holds the plugin source on its own. To run it, copy `src/` into a Vencord
checkout as a userplugin:

```sh
pnpm sync                                   # defaults to ~/Documents/Vencord
VENCORD_PATH=/path/to/Vencord pnpm sync     # or point it somewhere else
```

Then build Vencord as usual (`pnpm build`, or `pnpm watch` while iterating). Re-run
`pnpm sync` after each change here.

The port is not line-for-line. Notable changes:

- **Requests are properly serialised.** Pluralchum spaced requests by multiplying a
  counter by a delay; We instead queue them through a single chain with a minimum
  interval, and de-duplicates concurrent lookups for the same member so a channel
  full of one person's proxies costs one request rather than many.
- **Unset colours are `null`, not `""`.** Pluralchum stored missing colours as empty
  strings and then used `??` to fall back, which never fired — so "member colour,
  falling back to system colour" silently didn't. That fallback works here.
- **No 370 KB emoji table.** Pluralchum depends on `@ariagivens/discord-unicode-fix-js`
  to match tags whose emoji Discord mangled. pluralgrace strips variation selectors
  and zero-width joiners for the comparison instead, which handles the realistic
  cases and keeps the plugin dependency-free — a userplugin can't add dependencies to
  its host checkout.
- **The original message header is left alone.** Pluralchum replaces the whole header
  and keeps a hidden copy so profile popouts still anchor. Following ShowMeYourName's
  approach, we only replace only the username node, so that hack isn't needed.
- **The badge doesn't use Discord's generated class names.** Pluralchum hardcodes
  classes like `botTagCozy_c19a55`, which can break on most client updates; the badge is
  styled from Discord's CSS variables instead.
- **Failed lookups don't wedge.** A rejected request clears its placeholder so a

## Licence

MIT - see [LICENSE.MD](LICENSE.MD).

Derived from Pluralchum, © 2026 Ash Taylor and Contributors, also MIT. See
[NOTICE.md](NOTICE.md) for full attribution.

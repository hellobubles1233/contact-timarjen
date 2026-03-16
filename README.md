# Contact card (private Link‑in‑bio)

Small, single-page contact card built with Next.js + shadcn/ui styling.

## Features

- Linktree-style layout for your contact links
- QR codes for the site + a downloadable vCard (`/vcard.vcf`)
- Web NFC (Android Chrome) to write a link/vCard to an NFC tag
- Contact details come from environment variables (not committed to Git)
- Strong “do not index” signals (robots + meta + `X-Robots-Tag`)

## Setup

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm --filter web dev
```

By default, contact items are hidden in development. To preview locally, set `CONTACT_RENDER_IN_DEV=true` in `apps/web/.env.local`.

## Configure contact details

Use either:

- `CONTACT_CONFIG_JSON` (recommended): profile + items + full vCard config in one JSON blob
- or `CONTACT_ITEMS_JSON` + `CONTACT_DISPLAY_NAME`/`CONTACT_HEADLINE`/etc. (optionally `CONTACT_PROFILE_JSON` + `CONTACT_VCARD_JSON`)

See `apps/web/.env.example` for the supported fields and examples.

## Security note

“No index” headers and `robots.txt` are not access control. If you need real privacy, put the site behind authentication (e.g. Basic Auth / middleware gate) or host it privately.

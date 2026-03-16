import { getContactConfig } from "@/lib/contact-config"
import { buildVCard } from "@/lib/vcard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export function GET(request: Request) {
  const { config, diagnostics } = getContactConfig()

  if (!diagnostics.isSecretsRendered) {
    return new Response("Not available in development.", { status: 404 })
  }

  const baseUrl = new URL(request.url).origin
  const vcard = buildVCard({ contact: config, baseUrl })

  return new Response(vcard, {
    status: 200,
    headers: {
      "content-type": "text/vcard; charset=utf-8",
      "content-disposition": 'attachment; filename="contact.vcf"',
      "cache-control": "no-store, max-age=0",
      "x-robots-tag":
        "noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate, noai, noimageai",
    },
  })
}


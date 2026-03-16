import { getContactConfig } from "@/lib/contact-config"
import { buildVCard } from "@/lib/vcard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function slugPart(value: string | undefined) {
  const normalized = value
    ?.trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return normalized || undefined
}

function vcardFilename(config: ReturnType<typeof getContactConfig>["config"]) {
  const sourceName = config.vcard?.fn ?? config.profile.displayName
  const given = slugPart(config.vcard?.n?.given ?? sourceName.split(/\s+/).slice(0, -1).join(" "))
  const family = slugPart(config.vcard?.n?.family ?? sourceName.split(/\s+/).at(-1))

  if (given && family) return `${given}-${family}.vcf`
  if (family) return `${family}.vcf`
  if (given) return `${given}.vcf`
  return "contact.vcf"
}

async function inlineAsset(asset: { uri: string; mediaType?: string } | undefined) {
  const uri = asset?.uri?.trim()
  if (!uri || uri.startsWith("data:") || !/^https?:\/\//i.test(uri)) {
    return asset
  }

  const current = asset
  if (!current) return asset

  try {
    const response = await fetch(uri, { cache: "force-cache" })
    if (!response.ok) return asset

    const contentType = current.mediaType ?? response.headers.get("content-type")?.split(";")[0] ?? undefined
    const bytes = Buffer.from(await response.arrayBuffer())

    return {
      uri: `data:${contentType ?? "application/octet-stream"};base64,${bytes.toString("base64")}`,
      mediaType: contentType,
    }
  } catch {
    return asset
  }
}

export async function GET(request: Request) {
  const { config, diagnostics } = getContactConfig()

  if (!diagnostics.isSecretsRendered) {
    return new Response("Not available in development.", { status: 404 })
  }

  const baseUrl = new URL(request.url).origin
  const fallbackPhoto = config.vcard?.photo ?? (config.profile.avatarUrl ? { uri: config.profile.avatarUrl } : undefined)
  const [photo, logo] = await Promise.all([inlineAsset(fallbackPhoto), inlineAsset(config.vcard?.logo)])

  const resolvedConfig = {
    ...config,
    vcard: {
      ...(config.vcard ?? {}),
      ...(photo ? { photo } : {}),
      ...(logo ? { logo } : {}),
    },
  }

  const vcard = buildVCard({ contact: resolvedConfig, baseUrl })
  const filename = vcardFilename(config)

  return new Response(vcard, {
    status: 200,
    headers: {
      "content-type": "text/x-vcard; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store, max-age=0",
      "x-robots-tag":
        "noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate, noai, noimageai",
    },
  })
}

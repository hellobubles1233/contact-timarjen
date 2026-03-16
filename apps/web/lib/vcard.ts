import { createHash } from "node:crypto"
import type { ContactConfig, VCardAddress, VCardConfig, VCardTypedValue } from "@/lib/contact-config"

type VCardLine = { name: string; params?: Record<string, string | string[] | number>; value: string }

function escapeVCardValue(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
}

function escapeParamValue(value: string) {
  const needsQuotes = /[,:;"\\\n\r]/.test(value) || value.includes(" ")
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")
  return needsQuotes ? `"${escaped}"` : escaped
}

function formatParams(params: VCardLine["params"]) {
  if (!params) return ""
  const parts: string[] = []
  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined || raw === null) continue
    const values = Array.isArray(raw) ? raw : [raw]
    if (values.length === 0) continue
    parts.push(
      `${key.toUpperCase()}=${values.map((v) => escapeParamValue(String(v))).join(",")}`
    )
  }
  return parts.length ? `;${parts.join(";")}` : ""
}

function foldLine(line: string) {
  const maxBytes = 75
  if (Buffer.byteLength(line, "utf8") <= maxBytes) return line

  let out = ""
  let rest = line
  while (Buffer.byteLength(rest, "utf8") > maxBytes) {
    let cut = Math.min(rest.length, maxBytes)
    while (cut > 0 && Buffer.byteLength(rest.slice(0, cut), "utf8") > maxBytes) {
      cut -= 1
    }
    out += `${rest.slice(0, cut)}\r\n `
    rest = rest.slice(cut)
  }
  out += rest
  return out
}

function formatLine({ name, params, value }: VCardLine) {
  const line = `${name.toUpperCase()}${formatParams(params)}:${escapeVCardValue(value)}`
  return foldLine(line)
}

function stableUidFrom(config: { fn: string; source?: string }) {
  const hash = createHash("sha256")
    .update(`${config.fn}\n${config.source ?? ""}`)
    .digest("hex")
    .slice(0, 32)
  // RFC 4122-ish (v4-like) formatting, stable.
  const hex = hash.split("")
  hex[12] = "4"
  const variant = parseInt(hex[16]!, 16)
  hex[16] = ((variant & 0x3) | 0x8).toString(16)
  const uuid = `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex
    .slice(12, 16)
    .join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20, 32).join("")}`
  return `urn:uuid:${uuid}`
}

function deriveStructuredName(fn: string): NonNullable<VCardConfig["n"]> {
  const trimmed = fn.trim()
  if (!trimmed) return {}

  // "Family, Given" format
  if (trimmed.includes(",")) {
    const [familyRaw, givenRaw] = trimmed.split(",", 2)
    return { family: familyRaw?.trim() || undefined, given: givenRaw?.trim() || undefined }
  }

  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return { family: parts[0] }
  }
  return {
    given: parts.slice(0, -1).join(" "),
    family: parts[parts.length - 1],
  }
}

function adrValue(address: VCardAddress) {
  // PO box; extended address; street; locality; region; postal code; country name
  const parts = [
    address.pobox ?? "",
    address.extended ?? "",
    address.street ?? "",
    address.locality ?? "",
    address.region ?? "",
    address.postalCode ?? "",
    address.country ?? "",
  ]
  return parts.join(";")
}

function typedValueLines(
  prop: string,
  values: Array<VCardTypedValue> | undefined
): VCardLine[] {
  const out: VCardLine[] = []
  if (!values?.length) return out

  for (const entry of values) {
    const v = entry?.value?.trim()
    if (!v) continue

    const params: Record<string, string | string[] | number> = {}
    const types = entry.type?.filter(Boolean)
    if (types?.length) params.TYPE = types
    if (typeof entry.pref === "number") params.PREF = entry.pref
    if (entry.label) params.LABEL = entry.label

    out.push({ name: prop, params: Object.keys(params).length ? params : undefined, value: v })
  }

  return out
}

export function buildVCard({
  contact,
  baseUrl,
  now = new Date(),
}: {
  contact: ContactConfig
  baseUrl?: string
  now?: Date
}) {
  const v = contact.vcard ?? {}

  const fn = (v.fn ?? contact.profile.displayName).trim() || "Contact"
  const kind = v.kind ?? "individual"
  const source = v.source ?? baseUrl
  const uid = v.uid ?? stableUidFrom({ fn, source })
  const photo = v.photo?.uri ? v.photo : contact.profile.avatarUrl ? { uri: contact.profile.avatarUrl } : undefined
  const nRaw = v.n
  const nHasAny = Boolean(
    nRaw &&
      (nRaw.family?.trim() ||
        nRaw.given?.trim() ||
        nRaw.additional?.trim() ||
        nRaw.prefix?.trim() ||
        nRaw.suffix?.trim())
  )
  const n = nHasAny ? nRaw! : deriveStructuredName(fn)

  const itemEmails: VCardTypedValue[] = contact.items
    .filter((i) => i.type === "email")
    .map((i) => ({ value: i.value ?? i.href?.replace(/^mailto:/, "") ?? "" }))
    .filter((x) => x.value)

  const itemTels: VCardTypedValue[] = contact.items
    .filter((i) => i.type === "phone")
    .map((i) => ({ value: i.value ?? i.href?.replace(/^tel:/, "") ?? "" }))
    .filter((x) => x.value)

  const itemUrls: VCardTypedValue[] = contact.items
    .filter((i) => i.type !== "email" && i.type !== "phone")
    .map((i) => ({ value: i.href ?? i.value ?? "" }))
    .filter((x) => x.value && /^https?:\/\//i.test(x.value))

  if (baseUrl && !itemUrls.some((u) => u.value === baseUrl)) {
    itemUrls.unshift({ value: baseUrl, type: ["home"], pref: 1 })
  }

  const lines: VCardLine[] = [
    { name: "BEGIN", value: "VCARD" },
    { name: "VERSION", value: "4.0" },
    { name: "KIND", value: kind },
    { name: "FN", value: fn },
    {
      name: "N",
      value: `${n.family ?? ""};${n.given ?? ""};${n.additional ?? ""};${n.prefix ?? ""};${
        n.suffix ?? ""
      }`,
    },
  ]

  const nicknames = v.nicknames?.map((x) => x.trim()).filter(Boolean) ?? []
  if (nicknames.length) lines.push({ name: "NICKNAME", value: nicknames.join(",") })

  const orgParts = v.org?.map((p) => p.trim()).filter(Boolean) ?? []
  if (orgParts.length) lines.push({ name: "ORG", value: orgParts.join(";") })
  if (v.title) lines.push({ name: "TITLE", value: v.title })
  if (v.role) lines.push({ name: "ROLE", value: v.role })

  if (photo?.uri) {
    lines.push({
      name: "PHOTO",
      params: { VALUE: "uri", ...(photo.mediaType ? { MEDIATYPE: photo.mediaType } : {}) },
      value: photo.uri,
    })
  }
  if (v.logo?.uri) {
    lines.push({
      name: "LOGO",
      params: { VALUE: "uri", ...(v.logo.mediaType ? { MEDIATYPE: v.logo.mediaType } : {}) },
      value: v.logo.uri,
    })
  }

  for (const l of typedValueLines("EMAIL", v.emails?.length ? v.emails : itemEmails)) {
    lines.push(l)
  }
  for (const l of typedValueLines("TEL", v.tels?.length ? v.tels : itemTels)) {
    lines.push(l)
  }
  for (const l of typedValueLines("URL", v.urls?.length ? v.urls : itemUrls)) {
    lines.push(l)
  }
  for (const l of typedValueLines("IMPP", v.impps)) {
    lines.push(l)
  }

  if (v.addresses?.length) {
    for (const address of v.addresses) {
      const hasAddressParts = Boolean(
        address.pobox?.trim() ||
          address.extended?.trim() ||
          address.street?.trim() ||
          address.locality?.trim() ||
          address.region?.trim() ||
          address.postalCode?.trim() ||
          address.country?.trim()
      )
      if (!hasAddressParts) continue

      const params: Record<string, string | string[] | number> = {}
      if (address.type?.length) params.TYPE = address.type
      if (typeof address.pref === "number") params.PREF = address.pref
      if (address.label) params.LABEL = address.label
      lines.push({ name: "ADR", params, value: adrValue(address) })
    }
  }

  if (v.bday) lines.push({ name: "BDAY", value: v.bday })
  if (v.anniversary) lines.push({ name: "ANNIVERSARY", value: v.anniversary })
  if (v.tz) lines.push({ name: "TZ", value: v.tz })

  if (v.languages?.length) {
    for (const lang of v.languages.map((l) => l.trim()).filter(Boolean)) {
      lines.push({ name: "LANG", value: lang })
    }
  }

  if (v.geo) {
    lines.push({ name: "GEO", value: `geo:${v.geo.lat},${v.geo.lon}` })
  }

  const categories = v.categories?.map((c) => c.trim()).filter(Boolean) ?? []
  if (categories.length) lines.push({ name: "CATEGORIES", value: categories.join(",") })

  if (v.note ?? contact.profile.bio) {
    lines.push({ name: "NOTE", value: v.note ?? contact.profile.bio ?? "" })
  }

  if (v.fbUrl) lines.push({ name: "FBURL", value: v.fbUrl })
  if (v.calAdrUri) lines.push({ name: "CALADRURI", value: v.calAdrUri })
  if (v.calUri) lines.push({ name: "CALURI", value: v.calUri })
  if (v.keys?.length) {
    for (const key of v.keys) {
      if (key?.uri) {
        lines.push({
          name: "KEY",
          params: { VALUE: "uri", ...(key.mediaType ? { MEDIATYPE: key.mediaType } : {}) },
          value: key.uri,
        })
      } else if (key?.text) {
        lines.push({
          name: "KEY",
          params: key.mediaType ? { MEDIATYPE: key.mediaType } : undefined,
          value: key.text,
        })
      }
    }
  }
  if (source) lines.push({ name: "SOURCE", value: source })
  if (v.prodId) lines.push({ name: "PRODID", value: v.prodId })

  lines.push({ name: "UID", value: uid })
  lines.push({ name: "REV", value: now.toISOString() })
  lines.push({ name: "END", value: "VCARD" })

  return lines.map(formatLine).join("\r\n") + "\r\n"
}

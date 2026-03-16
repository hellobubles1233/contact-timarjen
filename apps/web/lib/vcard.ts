import { createHash } from "node:crypto"
import type { ContactConfig, VCardAddress, VCardConfig, VCardTypedValue } from "@/lib/contact-config"

type VCardLine = {
  group?: string
  name: string
  params?: Record<string, string | string[] | number>
  value: string
  escaped?: boolean
}

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

function hasNonAscii(value: string) {
  for (const char of value) {
    if (char.charCodeAt(0) > 0x7f) return true
  }
  return false
}

function textParams(value: string, params?: VCardLine["params"]) {
  const next = params ? { ...params } : {}
  if (hasNonAscii(value) && !next.CHARSET) {
    next.CHARSET = "UTF-8"
  }
  return Object.keys(next).length ? next : undefined
}

function joinStructured(parts: Array<string | undefined>) {
  return parts.map((part) => escapeVCardValue(part ?? "")).join(";")
}

function joinList(parts: Array<string | undefined>) {
  return parts.map((part) => escapeVCardValue(part ?? "")).join(",")
}

function textLine(name: string, value: string, params?: VCardLine["params"], group?: string): VCardLine {
  return { name, group, params: textParams(value, params), value, escaped: false }
}

function uriLine(name: string, value: string, params?: VCardLine["params"], group?: string): VCardLine {
  return { name, group, params, value, escaped: true }
}

function structuredLine(
  name: string,
  parts: Array<string | undefined>,
  params?: VCardLine["params"],
  group?: string
): VCardLine {
  const raw = parts.join("")
  return { name, group, params: textParams(raw, params), value: joinStructured(parts), escaped: true }
}

function listLine(
  name: string,
  parts: Array<string | undefined>,
  params?: VCardLine["params"],
  group?: string
): VCardLine {
  const raw = parts.join("")
  return { name, group, params: textParams(raw, params), value: joinList(parts), escaped: true }
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

function formatLine({ group, name, params, value, escaped }: VCardLine) {
  const fullName = group ? `${group}.${name}` : name
  const line = `${fullName}${formatParams(params)}:${escaped ? value : escapeVCardValue(value)}`
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
  return [
    address.pobox ?? "",
    address.extended ?? "",
    address.street ?? "",
    address.locality ?? "",
    address.region ?? "",
    address.postalCode ?? "",
    address.country ?? "",
  ]
}

function normalizeType(token: string) {
  const normalized = token.trim()
  if (!normalized) return undefined
  return normalized.replace(/\s+/g, "-").toUpperCase()
}

function normalizeTypes(prop: string, entry: VCardTypedValue) {
  const types = (entry.type ?? [])
    .map(normalizeType)
    .filter((value): value is string => Boolean(value))

  if (prop === "EMAIL" && !types.includes("INTERNET")) {
    types.unshift("INTERNET")
  }

  if (entry.pref && !types.includes("PREF")) {
    types.unshift("PREF")
  }

  return [...new Set(types)]
}

function dataUrlParts(uri: string) {
  const match = /^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,([a-z0-9+/=\s]+)$/i.exec(uri)
  if (!match) return undefined
  return {
    mediaType: match[1] || "application/octet-stream",
    base64: match[2]!.replace(/\s+/g, ""),
  }
}

function vCardMediaType(mediaType: string | undefined) {
  if (!mediaType) return undefined
  if (!mediaType.includes("/")) return mediaType.toUpperCase()
  const [, subtype] = mediaType.split("/", 2)
  if (!subtype) return mediaType.toUpperCase()
  return subtype.replace(/\+xml$/i, "").replace(/^jpg$/i, "jpeg").toUpperCase()
}

function imageLine(
  name: "PHOTO" | "LOGO",
  asset: { uri: string; mediaType?: string } | undefined
): VCardLine | undefined {
  const uri = asset?.uri?.trim()
  if (!uri) return undefined

  const inline = dataUrlParts(uri)
  if (inline) {
    const type = vCardMediaType(asset?.mediaType ?? inline.mediaType)
    return {
      name,
      params: type ? { ENCODING: "b", TYPE: type } : { ENCODING: "b" },
      value: inline.base64,
      escaped: true,
    }
  }

  const type = vCardMediaType(asset?.mediaType)
  return uriLine(name, uri, type ? { VALUE: "uri", TYPE: type } : { VALUE: "uri" })
}

function extendedLine(name: string, value: string, params?: VCardLine["params"]) {
  return textLine(name, value, params)
}

function formatRev(now: Date) {
  return now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
}

function pushTypedValueLines(
  lines: VCardLine[],
  prop: "EMAIL" | "TEL" | "URL" | "X-IMPP",
  values: Array<VCardTypedValue> | undefined,
  counter: { value: number }
) {
  if (!values?.length) return

  for (const entry of values) {
    const value = entry.value?.trim()
    if (!value) continue

    const types = normalizeTypes(prop, entry)
    const params = types.length ? { TYPE: types } : undefined
    const group = entry.label?.trim() ? `item${counter.value++}` : undefined
    const lineFactory = prop === "URL" ? uriLine : textLine
    lines.push(lineFactory(prop, value, params, group))

    if (group && entry.label?.trim()) {
      lines.push(textLine("X-ABLabel", entry.label.trim(), undefined, group))
    }
  }
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
    .map((i) => ({
      value: i.value ?? i.href?.replace(/^mailto:/, "") ?? "",
      type: ["internet"],
      label: i.label && i.label !== "Email" ? i.label : undefined,
    }))
    .filter((x) => x.value)

  const itemTels: VCardTypedValue[] = contact.items
    .filter((i) => i.type === "phone")
    .map((i) => ({
      value: i.value ?? i.href?.replace(/^tel:/, "") ?? "",
      type: ["cell", "voice"],
      label: i.label && i.label !== "Call" ? i.label : undefined,
    }))
    .filter((x) => x.value)

  const itemUrls: VCardTypedValue[] = contact.items
    .filter((i) => i.type !== "email" && i.type !== "phone")
    .map((i) => ({ value: i.href ?? i.value ?? "", label: i.label || undefined }))
    .filter((x) => x.value && /^https?:\/\//i.test(x.value))

  if (baseUrl && !itemUrls.some((u) => u.value === baseUrl)) {
    itemUrls.unshift({ value: baseUrl, type: ["home"], pref: 1, label: "Contact page" })
  }

  const lines: VCardLine[] = [
    { name: "BEGIN", value: "VCARD", escaped: true },
    { name: "VERSION", value: "3.0", escaped: true },
  ]

  if (v.prodId) {
    lines.push(uriLine("PRODID", v.prodId))
  }

  lines.push(structuredLine("N", [n.family, n.given, n.additional, n.prefix, n.suffix]))
  lines.push(textLine("FN", fn))

  const nicknames = v.nicknames?.map((x) => x.trim()).filter(Boolean) ?? []
  if (nicknames.length) lines.push(listLine("NICKNAME", nicknames))

  const orgParts = v.org?.map((p) => p.trim()).filter(Boolean) ?? []
  if (orgParts.length) lines.push(structuredLine("ORG", orgParts))
  if (v.title) lines.push(textLine("TITLE", v.title))
  if (v.role) lines.push(textLine("ROLE", v.role))

  const photoLine = imageLine("PHOTO", photo)
  if (photoLine) lines.push(photoLine)

  const logoLine = imageLine("LOGO", v.logo)
  if (logoLine) lines.push(logoLine)

  const groupCounter = { value: 1 }
  pushTypedValueLines(lines, "EMAIL", v.emails?.length ? v.emails : itemEmails, groupCounter)
  pushTypedValueLines(lines, "TEL", v.tels?.length ? v.tels : itemTels, groupCounter)
  pushTypedValueLines(lines, "URL", v.urls?.length ? v.urls : itemUrls, groupCounter)
  pushTypedValueLines(lines, "X-IMPP", v.impps, groupCounter)

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

      const params: Record<string, string | string[]> = {}
      const types = normalizeTypes("ADR", {
        value: address.street ?? address.locality ?? address.country ?? "",
        type: address.type,
        pref: address.pref,
      })
      if (types.length) params.TYPE = types
      const group = address.label?.trim() ? `item${groupCounter.value++}` : undefined
      lines.push(structuredLine("ADR", adrValue(address), Object.keys(params).length ? params : undefined, group))
      if (group && address.label?.trim()) {
        lines.push(textLine("X-ABLabel", address.label.trim(), undefined, group))
      }
    }
  }

  if (v.bday) lines.push(uriLine("BDAY", v.bday))
  if (v.anniversary) lines.push(extendedLine("X-ANNIVERSARY", v.anniversary))
  if (v.tz) lines.push(extendedLine("X-TIMEZONE", v.tz))

  if (v.languages?.length) {
    for (const lang of v.languages.map((l) => l.trim()).filter(Boolean)) {
      lines.push(extendedLine("X-LANGUAGE", lang))
    }
  }

  if (v.geo) {
    lines.push(extendedLine("X-GEO", `${v.geo.lat},${v.geo.lon}`))
  }

  const categories = v.categories?.map((c) => c.trim()).filter(Boolean) ?? []
  if (categories.length) lines.push(listLine("CATEGORIES", categories))

  if (v.note ?? contact.profile.bio) {
    lines.push(textLine("NOTE", v.note ?? contact.profile.bio ?? ""))
  }

  if (v.fbUrl) lines.push(extendedLine("X-FBURL", v.fbUrl))
  if (v.calAdrUri) lines.push(extendedLine("X-CALADRURI", v.calAdrUri))
  if (v.calUri) lines.push(extendedLine("X-CALURI", v.calUri))
  if (v.keys?.length) {
    for (const key of v.keys) {
      if (key?.uri) {
        lines.push(
          extendedLine(
            "X-KEY-URI",
            key.uri,
            key.mediaType ? { TYPE: vCardMediaType(key.mediaType) ?? key.mediaType } : undefined
          )
        )
      } else if (key?.text) {
        lines.push(
          textLine(
            "X-KEY-TEXT",
            key.text,
            key.mediaType ? { TYPE: vCardMediaType(key.mediaType) ?? key.mediaType } : undefined
          )
        )
      }
    }
  }
  if (source) lines.push(uriLine("SOURCE", source))

  lines.push(uriLine("UID", uid))
  lines.push(uriLine("REV", formatRev(now)))
  lines.push({ name: "END", value: "VCARD", escaped: true })

  return lines.map(formatLine).join("\r\n") + "\r\n"
}

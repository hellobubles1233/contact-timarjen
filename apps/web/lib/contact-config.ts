import {
  buildPlatformLink,
  CONTACT_PLATFORMS,
  defaultLabelForType,
  platformEnvKey,
  platformPrimaryEnvKey,
  platformSecondaryEnvKey,
  platformUrlEnvKey,
  type ContactIcon,
} from "@/lib/contact-platforms"

export type { ContactIcon } from "@/lib/contact-platforms"

export type ContactConfig = {
  profile: {
    displayName: string
    headline?: string
    avatarUrl?: string
    bio?: string
  }
  items: ContactItem[]
  vcard?: VCardConfig
}

export type ContactItem = {
  id: string
  type: string
  label: string
  href?: string
  value?: string
  subtitle?: string
  icon?: ContactIcon
  newTab?: boolean
  order?: number
}

export type VCardConfig = {
  kind?: "individual" | "org" | "group" | "location"
  uid?: string
  fn?: string
  n?: {
    family?: string
    given?: string
    additional?: string
    prefix?: string
    suffix?: string
  }
  nicknames?: string[]
  org?: string[]
  title?: string
  role?: string
  note?: string
  categories?: string[]
  urls?: Array<VCardTypedValue>
  emails?: Array<VCardTypedValue>
  tels?: Array<VCardTypedValue>
  impps?: Array<VCardTypedValue>
  addresses?: Array<VCardAddress>
  bday?: string
  anniversary?: string
  tz?: string
  languages?: string[]
  geo?: { lat: number; lon: number }
  photo?: { uri: string; mediaType?: string }
  logo?: { uri: string; mediaType?: string }
  keys?: Array<{ uri?: string; text?: string; mediaType?: string }>
  calUri?: string
  calAdrUri?: string
  fbUrl?: string
  prodId?: string
  source?: string
}

export type VCardTypedValue = {
  value: string
  type?: string[]
  pref?: number
  label?: string
}

export type VCardAddress = {
  pobox?: string
  extended?: string
  street?: string
  locality?: string
  region?: string
  postalCode?: string
  country?: string
  label?: string
  type?: string[]
  pref?: number
}

type ContactConfigInput = Partial<Omit<ContactConfig, "items" | "profile">> & {
  profile?: Partial<ContactConfig["profile"]>
  items?: unknown
}

type ContactItemInput = Partial<ContactItem> & {
  type?: string
  url?: string
  handle?: string
  extra?: string
}

const DEFAULT_PROFILE: ContactConfig["profile"] = {
  displayName: "Contact",
}

function safeJsonParse<T>(value: string): { ok: true; data: T } | { ok: false; error: string } {
  try {
    return { ok: true, data: JSON.parse(value) as T }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid JSON" }
  }
}

function firstEnvValue(...keys: string[]) {
  for (const key of keys) {
    const raw = process.env[key]
    if (typeof raw !== "string") continue
    const trimmed = raw.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

function envBool(...keys: string[]) {
  const raw = firstEnvValue(...keys)
  if (!raw) return undefined
  const v = raw.toLowerCase()
  if (v === "true" || v === "1" || v === "yes" || v === "on") return true
  if (v === "false" || v === "0" || v === "no" || v === "off") return false
  return undefined
}

function envNumber(...keys: string[]) {
  const raw = firstEnvValue(...keys)
  if (!raw) return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

function splitCsv(value: string | undefined) {
  if (!value) return undefined
  const parts = value
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length ? parts : undefined
}

function splitOrg(value: string | undefined) {
  if (!value) return undefined
  const sep = value.includes(";") ? ";" : ","
  const parts = value
    .split(sep)
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length ? parts : undefined
}

type ContactItemInputFromEnv = Partial<ContactItem> & {
  type?: string
  url?: string
  extra?: string
}

function withContactPrefixes(keys: string[]) {
  return keys.flatMap((key) => [`CONTACT_${key}`, key])
}

function platformPrimaryReadKeys(platform: (typeof CONTACT_PLATFORMS)[number], index: number) {
  const keys = [platformPrimaryEnvKey(platform, index)]
  for (const legacy of platform.legacyPrimaryBases ?? []) {
    keys.push(platformEnvKey(legacy, index))
  }
  return withContactPrefixes(keys)
}

function platformSecondaryReadKeys(platform: (typeof CONTACT_PLATFORMS)[number], index: number) {
  const keys: string[] = []
  const current = platformSecondaryEnvKey(platform, index)
  if (current) keys.push(current)
  for (const legacy of platform.legacySecondaryBases ?? []) {
    keys.push(platformEnvKey(legacy, index))
  }
  return withContactPrefixes(keys)
}

function platformUrlReadKeys(platform: (typeof CONTACT_PLATFORMS)[number], index: number) {
  const keys = [platformUrlEnvKey(platform, index)]
  for (const legacy of platform.legacyUrlBases ?? []) {
    keys.push(platformEnvKey(legacy, index, "URL"))
  }
  return withContactPrefixes(keys)
}

function itemsFromPropertiesEnv(): unknown[] | undefined {
  const indexedOut: ContactItemInputFromEnv[] = []
  const simpleOut: ContactItemInputFromEnv[] = []

  for (let i = 1; i <= 50; i += 1) {
    const bases = [`CONTACT_ITEM_${i}`, `ITEM_${i}`]
    const type =
      firstEnvValue(...bases.map((b) => `${b}_TYPE`))?.toLowerCase() ||
      firstEnvValue(...bases.map((b) => `${b}_KIND`))?.toLowerCase() ||
      undefined
    const label = firstEnvValue(...bases.map((b) => `${b}_LABEL`))
    const subtitle = firstEnvValue(...bases.map((b) => `${b}_SUBTITLE`))
    const value = firstEnvValue(...bases.map((b) => `${b}_VALUE`))
    const legacyHandle = firstEnvValue(...bases.map((b) => `${b}_HANDLE`))
    const extra = firstEnvValue(...bases.map((b) => `${b}_EXTRA`))
    const url = firstEnvValue(...bases.map((b) => `${b}_URL`), ...bases.map((b) => `${b}_HREF`))
    const newTab = envBool(...bases.map((b) => `${b}_NEWTAB`))
    const order = envNumber(...bases.map((b) => `${b}_ORDER`))

    if (!type && !label && !subtitle && !value && !legacyHandle && !extra && !url && newTab === undefined && order === undefined) {
      continue
    }
    if (!value && !legacyHandle && !extra && !url) continue

    indexedOut.push({
      type: (type ?? "link").toLowerCase(),
      ...(label ? { label } : {}),
      ...(subtitle ? { subtitle } : {}),
      ...((value || legacyHandle) ? { value: value ?? legacyHandle } : {}),
      ...(extra ? { extra } : {}),
      ...(url ? { url } : {}),
      ...(typeof newTab === "boolean" ? { newTab } : {}),
      ...(typeof order === "number" ? { order } : {}),
    })
  }

  for (const platform of CONTACT_PLATFORMS) {
    for (let idx = 1; idx <= 20; idx += 1) {
      const index = idx - 1
      const root = platformEnvKey(platform.envBase, index)
      const label = firstEnvValue(...withContactPrefixes([`${root}_LABEL`]))
      const subtitle = firstEnvValue(...withContactPrefixes([`${root}_SUBTITLE`]))
      const order = envNumber(...withContactPrefixes([`${root}_ORDER`]))
      const newTab = envBool(...withContactPrefixes([`${root}_NEWTAB`]))
      const value = firstEnvValue(...platformPrimaryReadKeys(platform, index))
      const extra = firstEnvValue(...platformSecondaryReadKeys(platform, index))
      const url = firstEnvValue(...platformUrlReadKeys(platform, index))

      if (!value && !extra && !url) continue

      const item: ContactItemInputFromEnv = {
        type: platform.id,
        ...(label ? { label } : {}),
        ...(subtitle ? { subtitle } : {}),
        ...(typeof newTab === "boolean" ? { newTab } : {}),
        ...(typeof order === "number" ? { order } : {}),
        ...(value ? { value } : {}),
        ...(extra ? { extra } : {}),
        ...(url ? { url } : {}),
      }

      simpleOut.push(item)
    }
  }

  const seen = new Set<string>()
  const combined: ContactItemInputFromEnv[] = []
  for (const item of [...indexedOut, ...simpleOut]) {
    const dedupeKey = `${item.type ?? ""}|${item.url ?? ""}|${item.href ?? ""}|${item.value ?? ""}|${item.extra ?? ""}|${item.label ?? ""}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    combined.push(item)
  }

  return combined.length ? combined : undefined
}

function vcardFromPropertiesEnv(): VCardConfig | undefined {
  const fn =
    firstEnvValue(
      "CONTACT_VCARD_NAME",
      "CONTACT_VCARD_FN",
      "VCARD_NAME",
      "VCARD_FN",
      "VCARD_FULLNAME",
      "NAME"
    ) ?? undefined

  const given = firstEnvValue("CONTACT_VCARD_GIVEN", "VCARD_GIVEN") ?? undefined
  const family = firstEnvValue("CONTACT_VCARD_FAMILY", "VCARD_FAMILY") ?? undefined
  const additional = firstEnvValue("CONTACT_VCARD_ADDITIONAL", "VCARD_ADDITIONAL") ?? undefined
  const prefix = firstEnvValue("CONTACT_VCARD_PREFIX", "VCARD_PREFIX") ?? undefined
  const suffix = firstEnvValue("CONTACT_VCARD_SUFFIX", "VCARD_SUFFIX") ?? undefined

  const nHasAny = Boolean(given || family || additional || prefix || suffix)

  const nicknames = splitCsv(firstEnvValue("CONTACT_VCARD_NICKNAMES", "VCARD_NICKNAMES", "VCARD_NICKNAME"))
  const org = splitOrg(firstEnvValue("CONTACT_VCARD_ORG", "VCARD_ORG", "VCARD_ORGANIZATION"))
  const categories = splitCsv(firstEnvValue("CONTACT_VCARD_CATEGORIES", "VCARD_CATEGORIES"))
  const languages = splitCsv(firstEnvValue("CONTACT_VCARD_LANGUAGES", "VCARD_LANGUAGES"))

  const kind = firstEnvValue("CONTACT_VCARD_KIND", "VCARD_KIND") as VCardConfig["kind"] | undefined
  const uid = firstEnvValue("CONTACT_VCARD_UID", "VCARD_UID") ?? undefined

  const title = firstEnvValue("CONTACT_VCARD_TITLE", "VCARD_TITLE") ?? undefined
  const role = firstEnvValue("CONTACT_VCARD_ROLE", "VCARD_ROLE") ?? undefined
  const note = firstEnvValue("CONTACT_VCARD_NOTE", "VCARD_NOTE") ?? undefined

  const bday = firstEnvValue("CONTACT_VCARD_BDAY", "VCARD_BDAY") ?? undefined
  const anniversary = firstEnvValue("CONTACT_VCARD_ANNIVERSARY", "VCARD_ANNIVERSARY") ?? undefined
  const tz = firstEnvValue("CONTACT_VCARD_TZ", "VCARD_TZ") ?? undefined

  const geoRaw = firstEnvValue("CONTACT_VCARD_GEO", "VCARD_GEO")
  let geo: VCardConfig["geo"] | undefined
  if (geoRaw) {
    const cleaned = geoRaw.replace(/^geo:/i, "")
    const [latRaw, lonRaw] = cleaned.split(",", 2).map((x) => x?.trim())
    const lat = Number(latRaw)
    const lon = Number(lonRaw)
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      geo = { lat, lon }
    }
  }

  const photoUri = firstEnvValue("CONTACT_VCARD_PHOTO_URI", "VCARD_PHOTO_URI") ?? undefined
  const photoMediaType =
    firstEnvValue("CONTACT_VCARD_PHOTO_MEDIATYPE", "VCARD_PHOTO_MEDIATYPE", "VCARD_PHOTO_MEDIA_TYPE") ?? undefined
  const logoUri = firstEnvValue("CONTACT_VCARD_LOGO_URI", "VCARD_LOGO_URI") ?? undefined
  const logoMediaType =
    firstEnvValue("CONTACT_VCARD_LOGO_MEDIATYPE", "VCARD_LOGO_MEDIATYPE", "VCARD_LOGO_MEDIA_TYPE") ?? undefined

  const calUri = firstEnvValue("CONTACT_VCARD_CALURI", "VCARD_CALURI") ?? undefined
  const calAdrUri = firstEnvValue("CONTACT_VCARD_CALADRURI", "VCARD_CALADRURI") ?? undefined
  const fbUrl = firstEnvValue("CONTACT_VCARD_FBURL", "VCARD_FBURL") ?? undefined
  const prodId = firstEnvValue("CONTACT_VCARD_PRODID", "VCARD_PRODID") ?? undefined
  const source = firstEnvValue("CONTACT_VCARD_SOURCE", "VCARD_SOURCE") ?? undefined

  function readTypedValues(prefix: string) {
    const out: VCardTypedValue[] = []
    for (let i = 1; i <= 20; i += 1) {
      const base = `${prefix}_${i}`
      const value = firstEnvValue(`CONTACT_VCARD_${base}`, `VCARD_${base}`)
      if (!value) continue
      const type = splitCsv(firstEnvValue(`CONTACT_VCARD_${base}_TYPE`, `VCARD_${base}_TYPE`))
      const pref = envNumber(`CONTACT_VCARD_${base}_PREF`, `VCARD_${base}_PREF`)
      const label = firstEnvValue(`CONTACT_VCARD_${base}_LABEL`, `VCARD_${base}_LABEL`)
      out.push({
        value,
        ...(type ? { type } : {}),
        ...(typeof pref === "number" ? { pref } : {}),
        ...(label ? { label } : {}),
      })
    }
    return out.length ? out : undefined
  }

  function readAddresses() {
    const out: VCardAddress[] = []
    for (let i = 1; i <= 20; i += 1) {
      const base = `ADR_${i}`
      const street = firstEnvValue(`CONTACT_VCARD_${base}_STREET`, `VCARD_${base}_STREET`) ?? undefined
      const locality = firstEnvValue(`CONTACT_VCARD_${base}_LOCALITY`, `VCARD_${base}_LOCALITY`) ?? undefined
      const region = firstEnvValue(`CONTACT_VCARD_${base}_REGION`, `VCARD_${base}_REGION`) ?? undefined
      const postalCode =
        firstEnvValue(
          `CONTACT_VCARD_${base}_POSTAL_CODE`,
          `VCARD_${base}_POSTAL_CODE`,
          `CONTACT_VCARD_${base}_POSTAL`,
          `VCARD_${base}_POSTAL`
        ) ?? undefined
      const country = firstEnvValue(`CONTACT_VCARD_${base}_COUNTRY`, `VCARD_${base}_COUNTRY`) ?? undefined
      const pobox = firstEnvValue(`CONTACT_VCARD_${base}_POBOX`, `VCARD_${base}_POBOX`) ?? undefined
      const extended = firstEnvValue(`CONTACT_VCARD_${base}_EXTENDED`, `VCARD_${base}_EXTENDED`) ?? undefined
      const label = firstEnvValue(`CONTACT_VCARD_${base}_LABEL`, `VCARD_${base}_LABEL`) ?? undefined
      const type = splitCsv(firstEnvValue(`CONTACT_VCARD_${base}_TYPE`, `VCARD_${base}_TYPE`))
      const pref = envNumber(`CONTACT_VCARD_${base}_PREF`, `VCARD_${base}_PREF`)

      const hasParts = Boolean(street || locality || region || postalCode || country || pobox || extended)
      if (!hasParts) continue

      out.push({
        ...(pobox ? { pobox } : {}),
        ...(extended ? { extended } : {}),
        ...(street ? { street } : {}),
        ...(locality ? { locality } : {}),
        ...(region ? { region } : {}),
        ...(postalCode ? { postalCode } : {}),
        ...(country ? { country } : {}),
        ...(label ? { label } : {}),
        ...(type ? { type } : {}),
        ...(typeof pref === "number" ? { pref } : {}),
      })
    }
    return out.length ? out : undefined
  }

  function readKeys() {
    const out: Array<{ uri?: string; text?: string; mediaType?: string }> = []
    for (let i = 1; i <= 20; i += 1) {
      const base = `KEY_${i}`
      const uri = firstEnvValue(`CONTACT_VCARD_${base}_URI`, `VCARD_${base}_URI`) ?? undefined
      const text = firstEnvValue(`CONTACT_VCARD_${base}_TEXT`, `VCARD_${base}_TEXT`) ?? undefined
      const mediaType =
        firstEnvValue(
          `CONTACT_VCARD_${base}_MEDIATYPE`,
          `VCARD_${base}_MEDIATYPE`,
          `CONTACT_VCARD_${base}_MEDIA_TYPE`,
          `VCARD_${base}_MEDIA_TYPE`
        ) ?? undefined
      if (!uri && !text) continue
      out.push({ ...(uri ? { uri } : {}), ...(text ? { text } : {}), ...(mediaType ? { mediaType } : {}) })
    }
    return out.length ? out : undefined
  }

  const emails = readTypedValues("EMAIL")
  const tels = readTypedValues("TEL")
  const urls = readTypedValues("URL")
  const impps = readTypedValues("IMPP")
  const addresses = readAddresses()
  const keys = readKeys()

  const config: VCardConfig = {
    ...(kind ? { kind } : {}),
    ...(uid ? { uid } : {}),
    ...(fn ? { fn } : {}),
    ...(nHasAny ? { n: { ...(family ? { family } : {}), ...(given ? { given } : {}), ...(additional ? { additional } : {}), ...(prefix ? { prefix } : {}), ...(suffix ? { suffix } : {}) } } : {}),
    ...(nicknames ? { nicknames } : {}),
    ...(org ? { org } : {}),
    ...(title ? { title } : {}),
    ...(role ? { role } : {}),
    ...(note ? { note } : {}),
    ...(categories ? { categories } : {}),
    ...(emails ? { emails } : {}),
    ...(tels ? { tels } : {}),
    ...(urls ? { urls } : {}),
    ...(impps ? { impps } : {}),
    ...(addresses ? { addresses } : {}),
    ...(bday ? { bday } : {}),
    ...(anniversary ? { anniversary } : {}),
    ...(tz ? { tz } : {}),
    ...(languages ? { languages } : {}),
    ...(geo ? { geo } : {}),
    ...(photoUri ? { photo: { uri: photoUri, ...(photoMediaType ? { mediaType: photoMediaType } : {}) } } : {}),
    ...(logoUri ? { logo: { uri: logoUri, ...(logoMediaType ? { mediaType: logoMediaType } : {}) } } : {}),
    ...(keys ? { keys } : {}),
    ...(calUri ? { calUri } : {}),
    ...(calAdrUri ? { calAdrUri } : {}),
    ...(fbUrl ? { fbUrl } : {}),
    ...(prodId ? { prodId } : {}),
    ...(source ? { source } : {}),
  }

  return Object.keys(config).length ? config : undefined
}

function toId(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function normalizeContactItem(raw: ContactItemInput, index: number): ContactItem | null {
  const label = typeof raw.label === "string" ? raw.label.trim() : ""
  const type = typeof raw.type === "string" ? raw.type.trim().toLowerCase() : ""
  const href = typeof raw.href === "string" ? raw.href.trim() : undefined
  const url = typeof raw.url === "string" ? raw.url.trim() : undefined
  const value = typeof raw.value === "string" ? raw.value.trim() : undefined
  const handle = typeof raw.handle === "string" ? raw.handle.trim() : undefined
  const extra = typeof raw.extra === "string" ? raw.extra.trim() : undefined
  const derived = buildPlatformLink(type, {
    value: value ?? handle,
    extra,
    url,
  })

  const resolvedLabel = label || defaultLabelForType(type)
  const resolvedHref = href ?? url ?? derived?.href
  const resolvedValue = value ?? handle ?? derived?.value
  const resolvedType =
    type ||
    (resolvedHref?.startsWith("mailto:") ? "email" : undefined) ||
    (resolvedHref?.startsWith("tel:") ? "phone" : undefined) ||
    "link"

  const idBase =
    (typeof raw.id === "string" && raw.id.trim()) ||
    resolvedLabel ||
    type ||
    `item-${index + 1}`

  const item: ContactItem = {
    id: toId(idBase),
    type: resolvedType,
    label: resolvedLabel || `Item ${index + 1}`,
    href: resolvedHref,
    value: resolvedValue,
    subtitle: typeof raw.subtitle === "string" ? raw.subtitle : undefined,
    icon: raw.icon ?? derived?.icon,
    newTab: typeof raw.newTab === "boolean" ? raw.newTab : derived?.newTab,
    order: typeof raw.order === "number" ? raw.order : undefined,
  }

  if (!item.href && !item.value) {
    return null
  }

  return item
}

export function getContactConfig(): {
  config: ContactConfig
  diagnostics: { warnings: string[]; errors: string[]; isSecretsRendered: boolean }
} {
  const warnings: string[] = []
  const errors: string[] = []
  const isSecretsRendered =
    process.env.NODE_ENV === "production" || process.env.CONTACT_RENDER_IN_DEV === "true"

  const profileFromEnv: ContactConfig["profile"] = {
    displayName: (process.env.CONTACT_DISPLAY_NAME || DEFAULT_PROFILE.displayName).trim(),
    headline: process.env.CONTACT_HEADLINE?.trim() || undefined,
    avatarUrl: process.env.CONTACT_AVATAR_URL?.trim() || undefined,
    bio: process.env.CONTACT_BIO?.trim() || undefined,
  }

  if (!isSecretsRendered) {
    warnings.push(
      "Contact details are hidden in non-production by default. Set CONTACT_RENDER_IN_DEV=true to preview locally."
    )
  }

  let configFromJson: ContactConfigInput | undefined
  if (process.env.CONTACT_CONFIG_JSON?.trim()) {
    const parsed = safeJsonParse<ContactConfigInput>(process.env.CONTACT_CONFIG_JSON)
    if (!parsed.ok) {
      errors.push(`CONTACT_CONFIG_JSON: ${parsed.error}`)
    } else {
      configFromJson = parsed.data
    }
  }

  let profileFromJsonEnv: Partial<ContactConfig["profile"]> | undefined
  if (process.env.CONTACT_PROFILE_JSON?.trim()) {
    const parsed = safeJsonParse<unknown>(process.env.CONTACT_PROFILE_JSON)
    if (!parsed.ok) {
      errors.push(`CONTACT_PROFILE_JSON: ${parsed.error}`)
    } else if (!parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) {
      errors.push("CONTACT_PROFILE_JSON must be a JSON object.")
    } else {
      profileFromJsonEnv = parsed.data as Partial<ContactConfig["profile"]>
    }
  }

  let vcardFromJsonEnv: VCardConfig | undefined
  if (process.env.CONTACT_VCARD_JSON?.trim()) {
    const parsed = safeJsonParse<unknown>(process.env.CONTACT_VCARD_JSON)
    if (!parsed.ok) {
      errors.push(`CONTACT_VCARD_JSON: ${parsed.error}`)
    } else if (!parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) {
      errors.push("CONTACT_VCARD_JSON must be a JSON object.")
    } else {
      vcardFromJsonEnv = parsed.data as VCardConfig
    }
  }

  const profile: ContactConfig["profile"] = {
    ...DEFAULT_PROFILE,
    ...profileFromEnv,
    ...(profileFromJsonEnv ?? {}),
    ...(configFromJson?.profile ?? {}),
  }

  let itemsInput: unknown = undefined
  if (configFromJson?.items !== undefined) {
    itemsInput = configFromJson.items
  } else if (process.env.CONTACT_ITEMS_JSON?.trim()) {
    const parsed = safeJsonParse<unknown>(process.env.CONTACT_ITEMS_JSON)
    if (!parsed.ok) {
      errors.push(`CONTACT_ITEMS_JSON: ${parsed.error}`)
    } else {
      itemsInput = parsed.data
    }
  } else {
    itemsInput = itemsFromPropertiesEnv() ?? []
  }

  let items: ContactItem[] = []
  if (Array.isArray(itemsInput)) {
    items = itemsInput
      .map((raw, index) => {
        if (!raw || typeof raw !== "object") {
          return null
        }
        return normalizeContactItem(raw as ContactItemInput, index)
      })
      .filter((item): item is ContactItem => Boolean(item))
  } else if (itemsInput !== undefined) {
    errors.push("CONTACT_ITEMS_JSON must be a JSON array.")
  }

  if (!isSecretsRendered) {
    items = []
  }

  items.sort((a, b) => {
    const ao = a.order ?? Number.POSITIVE_INFINITY
    const bo = b.order ?? Number.POSITIVE_INFINITY
    return ao - bo
  })

  const vcard =
    (configFromJson?.vcard ??
      vcardFromJsonEnv ??
      vcardFromPropertiesEnv() ??
      undefined) as VCardConfig | undefined

  if (process.env.NODE_ENV === "production" && isSecretsRendered) {
    if (!profile.displayName || profile.displayName === DEFAULT_PROFILE.displayName) {
      warnings.push("Set CONTACT_DISPLAY_NAME (or CONTACT_CONFIG_JSON.profile.displayName).")
    }
    if (items.length === 0) {
      warnings.push(
        "No contact items found. Add flat env keys like EMAIL, PHONE, GITHUB, INSTAGRAM, or DISCORD_USER_ID (or use CONTACT_ITEMS_JSON / CONTACT_CONFIG_JSON.items)."
      )
    }
  }

  return { config: { profile, items, vcard }, diagnostics: { warnings, errors, isSecretsRendered } }
}

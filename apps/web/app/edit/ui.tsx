"use client"

import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { ArrowDown, ArrowUp, Download, FileUp, Plus, Trash2 } from "lucide-react"
import type { VCardConfig } from "@/lib/contact-config"
import { ContactIconGlyph } from "@/components/contact-icon"
import {
  CONTACT_PLATFORMS,
  CONTACT_PLATFORMS_BY_ID,
  defaultLabelForType,
  platformEnvKey,
  platformMetaEnvKey,
  platformOptionGroups,
  platformPrimaryEnvKey,
  platformSecondaryEnvKey,
  platformUrlEnvKey,
} from "@/lib/contact-platforms"

type OutputMode = "properties" | "split" | "config"

type ContactItemDraft = {
  type: string
  label: string
  value: string
  extra: string
  url: string
  subtitle: string
  newTab: boolean
}

type VCardTypedValueDraft = {
  value: string
  type: string
  pref: string
  label: string
}

type VCardAddressDraft = {
  pobox: string
  extended: string
  street: string
  locality: string
  region: string
  postalCode: string
  country: string
  label: string
  type: string
  pref: string
}

type VCardKeyDraft = {
  uri: string
  text: string
  mediaType: string
}

type VCardDraft = {
  kind: "individual" | "org" | "group" | "location" | ""
  uid: string
  fn: string
  nFamily: string
  nGiven: string
  nAdditional: string
  nPrefix: string
  nSuffix: string
  nicknames: string[]
  org: string[]
  title: string
  role: string
  note: string
  categories: string[]
  emails: VCardTypedValueDraft[]
  tels: VCardTypedValueDraft[]
  urls: VCardTypedValueDraft[]
  impps: VCardTypedValueDraft[]
  addresses: VCardAddressDraft[]
  bday: string
  anniversary: string
  tz: string
  languages: string[]
  geoLat: string
  geoLon: string
  photoUri: string
  photoMediaType: string
  logoUri: string
  logoMediaType: string
  keys: VCardKeyDraft[]
  calUri: string
  calAdrUri: string
  fbUrl: string
  prodId: string
  source: string
}

type EditorState = {
  outputMode: OutputMode
  renderInDev: boolean
  publicUrl: string
  pageTitle: string
  pageDescription: string
  profile: {
    displayName: string
    headline: string
    bio: string
    avatarUrl: string
  }
  items: ContactItemDraft[]
  vcard: VCardDraft
  fileName: string
  parseErrors: string[]
}

const DEFAULT_ITEM: ContactItemDraft = {
  type: "email",
  label: "",
  value: "",
  extra: "",
  url: "",
  subtitle: "",
  newTab: false,
}

const DEFAULT_TYPED: VCardTypedValueDraft = { value: "", type: "", pref: "", label: "" }
const DEFAULT_ADDR: VCardAddressDraft = {
  pobox: "",
  extended: "",
  street: "",
  locality: "",
  region: "",
  postalCode: "",
  country: "",
  label: "",
  type: "",
  pref: "",
}
const DEFAULT_KEY: VCardKeyDraft = { uri: "", text: "", mediaType: "" }

const DEFAULT_STATE: EditorState = {
  outputMode: "properties",
  renderInDev: true,
  publicUrl: "",
  pageTitle: "",
  pageDescription: "",
  profile: { displayName: "", headline: "", bio: "", avatarUrl: "" },
  items: [{ ...DEFAULT_ITEM }],
  vcard: {
    kind: "",
    uid: "",
    fn: "",
    nFamily: "",
    nGiven: "",
    nAdditional: "",
    nPrefix: "",
    nSuffix: "",
    nicknames: [""],
    org: [""],
    title: "",
    role: "",
    note: "",
    categories: [""],
    emails: [{ ...DEFAULT_TYPED }],
    tels: [{ ...DEFAULT_TYPED }],
    urls: [{ ...DEFAULT_TYPED }],
    impps: [{ ...DEFAULT_TYPED }],
    addresses: [{ ...DEFAULT_ADDR }],
    bday: "",
    anniversary: "",
    tz: "",
    languages: [""],
    geoLat: "",
    geoLon: "",
    photoUri: "",
    photoMediaType: "",
    logoUri: "",
    logoMediaType: "",
    keys: [{ ...DEFAULT_KEY }],
    calUri: "",
    calAdrUri: "",
    fbUrl: "",
    prodId: "",
    source: "",
  },
  fileName: ".env.local",
  parseErrors: [],
}

function Section({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card/70 p-4 backdrop-blur", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">{title}</h2>
          {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: React.HTMLInputTypeAttribute
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
}) {
  return (
    <input
      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      inputMode={inputMode}
    />
  )
}

function SelectInput({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  )
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
  readOnly,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  readOnly?: boolean
}) {
  return (
    <textarea
      className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      readOnly={readOnly}
    />
  )
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/20 p-3">
      <div className="min-w-0">
        <div className="text-xs font-medium">{label}</div>
        {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
      </div>
      <button
        type="button"
        className={cn(
          "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border border-border bg-background transition-colors",
          checked && "bg-primary"
        )}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        <span
          className={cn(
            "inline-block size-5 translate-x-0.5 rounded-full bg-foreground/10 shadow-sm transition-transform",
            checked && "translate-x-[18px] bg-primary-foreground"
          )}
        />
      </button>
    </div>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <Button type="button" variant="outline" size="icon-sm" onClick={onClick} disabled={disabled} title={label}>
      <span className="sr-only">{label}</span>
      {children}
    </Button>
  )
}

function ImagePreviewCard({
  title,
  value,
  emptyLabel,
}: {
  title: string
  value: string
  emptyLabel: string
}) {
  const backgroundImage = value ? `url("${value.replace(/"/g, '\\"')}")` : undefined

  return (
    <div className="grid gap-2">
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      <div
        className={cn(
          "flex aspect-square w-28 items-center justify-center rounded-2xl border border-border bg-muted/30 text-center text-xs text-muted-foreground",
          value && "bg-cover bg-center bg-no-repeat text-transparent"
        )}
        style={backgroundImage ? { backgroundImage } : undefined}
        aria-label={title}
      >
        {value ? "Preview" : emptyLabel}
      </div>
    </div>
  )
}

function cleanStringArray(values: string[]) {
  return values.map((v) => v.trim()).filter(Boolean)
}

function parseCsvArray(input: string) {
  return cleanStringArray(input.split(","))
}

function parseMaybeNumber(input: string): number | undefined {
  const trimmed = input.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

function normalizeDraftType(type: string) {
  const normalized = type.trim().toLowerCase()
  if (normalized in CONTACT_PLATFORMS_BY_ID) return normalized
  return normalized === "download" ? "link" : "link"
}

function getDraftPlatform(type: string) {
  return CONTACT_PLATFORMS_BY_ID[normalizeDraftType(type) as keyof typeof CONTACT_PLATFORMS_BY_ID]
}

function updateItemAt(items: ContactItemDraft[], index: number, next: ContactItemDraft) {
  return items.map((item, itemIndex) => (itemIndex === index ? next : item))
}

function moveItem(items: ContactItemDraft[], from: number, to: number) {
  if (to < 0 || to >= items.length || from === to) return items
  const next = [...items]
  const [moved] = next.splice(from, 1)
  if (!moved) return items
  next.splice(to, 0, moved)
  return next
}

function updateStringListValue(values: string[], index: number, value: string) {
  const next = [...values]
  while (next.length <= index) next.push("")
  next[index] = value
  return next
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"))
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result)
      else reject(new Error("Failed to read file"))
    }
    reader.readAsDataURL(file)
  })
}

function draftFromUnknownItem(raw: unknown): { item: ContactItemDraft; order?: number } {
  const entry = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  const type = normalizeDraftType(typeof entry.type === "string" ? entry.type : "link")
  const platform = getDraftPlatform(type)

  let value = typeof entry.value === "string" ? entry.value : ""
  if (!value && typeof entry.handle === "string") value = entry.handle
  if (!value && typeof entry.userId === "string") value = entry.userId
  if (!value && typeof entry.username === "string") value = entry.username
  if (!value && typeof entry.slug === "string") value = entry.slug
  if (!value && typeof entry.id === "string" && type === "matrix") value = entry.id

  let extra = typeof entry.extra === "string" ? entry.extra : ""
  if (!extra && typeof entry.server === "string") extra = entry.server

  const url =
    typeof entry.url === "string" ? entry.url : typeof entry.href === "string" ? entry.href : ""
  if (!value && platform.primaryField.inputMode === "url") {
    value = url
  }

  return {
    item: {
      ...DEFAULT_ITEM,
      type: platform.id,
      label: typeof entry.label === "string" ? entry.label : "",
      value,
      extra,
      url,
      subtitle: typeof entry.subtitle === "string" ? entry.subtitle : "",
      newTab:
        typeof entry.newTab === "boolean" ? entry.newTab : platform.defaultNewTab,
    },
    order: typeof entry.order === "number" ? entry.order : undefined,
  }
}

function sortImportedItems(items: Array<{ item: ContactItemDraft; order?: number }>) {
  return items
    .map((entry, index) => ({ ...entry, index }))
    .sort((left, right) => {
      const leftOrder = typeof left.order === "number" ? left.order : Number.POSITIVE_INFINITY
      const rightOrder = typeof right.order === "number" ? right.order : Number.POSITIVE_INFINITY
      return leftOrder - rightOrder || left.index - right.index
    })
    .map(({ item }) => item)
}

function vcardDraftToConfig(draft: VCardDraft): VCardConfig {
  const kind = draft.kind || undefined
  const n = {
    family: draft.nFamily.trim() || undefined,
    given: draft.nGiven.trim() || undefined,
    additional: draft.nAdditional.trim() || undefined,
    prefix: draft.nPrefix.trim() || undefined,
    suffix: draft.nSuffix.trim() || undefined,
  }
  const nHasAny = Object.values(n).some(Boolean)

  const geoLat = parseMaybeNumber(draft.geoLat)
  const geoLon = parseMaybeNumber(draft.geoLon)

  const typedValues = (entries: VCardTypedValueDraft[]) =>
    entries
      .map((e) => ({
        value: e.value.trim(),
        type: parseCsvArray(e.type),
        pref: parseMaybeNumber(e.pref),
        label: e.label.trim() || undefined,
      }))
      .filter((e) => e.value)
      .map((e) => ({
        value: e.value,
        ...(e.type.length ? { type: e.type } : {}),
        ...(typeof e.pref === "number" ? { pref: e.pref } : {}),
        ...(e.label ? { label: e.label } : {}),
      }))

  const addresses = draft.addresses
    .map((a) => {
      const entry = {
        pobox: a.pobox.trim() || undefined,
        extended: a.extended.trim() || undefined,
        street: a.street.trim() || undefined,
        locality: a.locality.trim() || undefined,
        region: a.region.trim() || undefined,
        postalCode: a.postalCode.trim() || undefined,
        country: a.country.trim() || undefined,
        label: a.label.trim() || undefined,
        type: parseCsvArray(a.type),
        pref: parseMaybeNumber(a.pref),
      }

      const hasAddressParts = Boolean(
        entry.pobox ||
          entry.extended ||
          entry.street ||
          entry.locality ||
          entry.region ||
          entry.postalCode ||
          entry.country
      )
      return hasAddressParts
        ? {
            ...(entry.pobox ? { pobox: entry.pobox } : {}),
            ...(entry.extended ? { extended: entry.extended } : {}),
            ...(entry.street ? { street: entry.street } : {}),
            ...(entry.locality ? { locality: entry.locality } : {}),
            ...(entry.region ? { region: entry.region } : {}),
            ...(entry.postalCode ? { postalCode: entry.postalCode } : {}),
            ...(entry.country ? { country: entry.country } : {}),
            ...(entry.label ? { label: entry.label } : {}),
            ...(entry.type.length ? { type: entry.type } : {}),
            ...(typeof entry.pref === "number" ? { pref: entry.pref } : {}),
          }
        : null
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))

  const keys = draft.keys
    .map((k) => ({
      uri: k.uri.trim() || undefined,
      text: k.text.trim() || undefined,
      mediaType: k.mediaType.trim() || undefined,
    }))
    .filter((k) => k.uri || k.text)
    .map((k) => ({
      ...(k.uri ? { uri: k.uri } : {}),
      ...(k.text ? { text: k.text } : {}),
      ...(k.mediaType ? { mediaType: k.mediaType } : {}),
    }))

  const photo = draft.photoUri.trim()
    ? { uri: draft.photoUri.trim(), ...(draft.photoMediaType.trim() ? { mediaType: draft.photoMediaType.trim() } : {}) }
    : undefined
  const logo = draft.logoUri.trim()
    ? { uri: draft.logoUri.trim(), ...(draft.logoMediaType.trim() ? { mediaType: draft.logoMediaType.trim() } : {}) }
    : undefined

  const config = {
    ...(kind ? { kind } : {}),
    ...(draft.uid.trim() ? { uid: draft.uid.trim() } : {}),
    ...(draft.fn.trim() ? { fn: draft.fn.trim() } : {}),
    ...(nHasAny ? { n } : {}),
    ...(cleanStringArray(draft.nicknames).length ? { nicknames: cleanStringArray(draft.nicknames) } : {}),
    ...(cleanStringArray(draft.org).length ? { org: cleanStringArray(draft.org) } : {}),
    ...(draft.title.trim() ? { title: draft.title.trim() } : {}),
    ...(draft.role.trim() ? { role: draft.role.trim() } : {}),
    ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
    ...(cleanStringArray(draft.categories).length ? { categories: cleanStringArray(draft.categories) } : {}),
    ...(typedValues(draft.emails).length ? { emails: typedValues(draft.emails) } : {}),
    ...(typedValues(draft.tels).length ? { tels: typedValues(draft.tels) } : {}),
    ...(typedValues(draft.urls).length ? { urls: typedValues(draft.urls) } : {}),
    ...(typedValues(draft.impps).length ? { impps: typedValues(draft.impps) } : {}),
    ...(addresses.length ? { addresses } : {}),
    ...(draft.bday.trim() ? { bday: draft.bday.trim() } : {}),
    ...(draft.anniversary.trim() ? { anniversary: draft.anniversary.trim() } : {}),
    ...(draft.tz.trim() ? { tz: draft.tz.trim() } : {}),
    ...(cleanStringArray(draft.languages).length ? { languages: cleanStringArray(draft.languages) } : {}),
    ...(typeof geoLat === "number" && typeof geoLon === "number" ? { geo: { lat: geoLat, lon: geoLon } } : {}),
    ...(photo ? { photo } : {}),
    ...(logo ? { logo } : {}),
    ...(keys.length ? { keys } : {}),
    ...(draft.calUri.trim() ? { calUri: draft.calUri.trim() } : {}),
    ...(draft.calAdrUri.trim() ? { calAdrUri: draft.calAdrUri.trim() } : {}),
    ...(draft.fbUrl.trim() ? { fbUrl: draft.fbUrl.trim() } : {}),
    ...(draft.prodId.trim() ? { prodId: draft.prodId.trim() } : {}),
    ...(draft.source.trim() ? { source: draft.source.trim() } : {}),
  }

  return config as VCardConfig
}

function itemsDraftToConfig(items: ContactItemDraft[]) {
  return items.map((i, index) => {
    const type = normalizeDraftType(i.type)
    const platform = getDraftPlatform(type)
    const entry = {
      type,
      label: i.label.trim() || undefined,
      value: i.value.trim() || undefined,
      extra: i.extra.trim() || undefined,
      url: i.url.trim() || undefined,
      subtitle: i.subtitle.trim() || undefined,
      newTab: i.newTab,
      order: index + 1,
    }

    return {
      ...(entry.type ? { type: entry.type } : {}),
      ...(entry.label ? { label: entry.label } : {}),
      ...(entry.value ? { value: entry.value } : {}),
      ...(entry.extra ? { extra: entry.extra } : {}),
      ...(entry.url ? { url: entry.url } : {}),
      ...(entry.subtitle ? { subtitle: entry.subtitle } : {}),
      ...(entry.newTab !== platform.defaultNewTab ? { newTab: entry.newTab } : {}),
      ...(typeof entry.order === "number" ? { order: entry.order } : {}),
    }
  })
}

function envEscapeDoubleQuoted(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
}

function envFormatValue(value: string) {
  const trimmed = value
  if (!trimmed) return ""
  const needsQuotes = trimmed.startsWith(" ") || trimmed.endsWith(" ") || /[#\r\n]/.test(trimmed)
  return needsQuotes ? `"${envEscapeDoubleQuoted(trimmed)}"` : trimmed
}

function envQuoteJson(value: unknown) {
  const json = JSON.stringify(value)
  // Single-quote wrapper is easy for JSON, but must not contain raw apostrophes.
  const safeJson = json.replace(/'/g, "\\u0027")
  return `'${safeJson}'`
}

function serializeEnv(state: EditorState) {
  const lines: string[] = []
  lines.push("# Contact card configuration (generated)")
  lines.push("# ===================================")
  lines.push("#")
  lines.push("# Put real values in `apps/web/.env.local` (recommended) or set them in your hosting provider.")
  lines.push("# This editor runs fully in your browser and never reads server env values.")
  lines.push("")

  lines.push("# Local preview")
  lines.push("CONTACT_RENDER_IN_DEV=" + (state.renderInDev ? "true" : "false"))
  lines.push("")

  lines.push("# Public URL (recommended)")
  lines.push("CONTACT_PUBLIC_URL=" + envFormatValue(state.publicUrl.trim()))
  lines.push("")

  lines.push("# Page metadata (optional)")
  lines.push("CONTACT_PAGE_TITLE=" + envFormatValue(state.pageTitle.trim()))
  lines.push("CONTACT_PAGE_DESCRIPTION=" + envFormatValue(state.pageDescription.trim()))
  lines.push("")

  lines.push("# Profile (UI header)")
  lines.push("CONTACT_DISPLAY_NAME=" + envFormatValue(state.profile.displayName.trim()))
  lines.push("CONTACT_HEADLINE=" + envFormatValue(state.profile.headline.trim()))
  lines.push("CONTACT_BIO=" + envFormatValue(state.profile.bio.trim()))
  lines.push("CONTACT_AVATAR_URL=" + envFormatValue(state.profile.avatarUrl.trim()))
  lines.push("")

  if (state.outputMode === "properties") {
    lines.push("# Contact items (Linktree buttons)")
    lines.push("# One platform per row. The editor writes ORDER keys for you based on the visible item order.")
    lines.push("")

    const counters: Record<string, number> = {}

    for (const [itemIndex, item] of state.items.entries()) {
      const type = normalizeDraftType(item.type)
      const platform = getDraftPlatform(type)
      const value = item.value.trim()
      const extra = item.extra.trim()
      const url = item.url.trim()
      const label = item.label.trim()
      const subtitle = item.subtitle.trim()
      const order = String(itemIndex + 1)

      const hasSomething = Boolean(value || extra || url || label || subtitle || item.newTab)
      if (!hasSomething) continue

      const nextCount = (counters[platform.envBase] ?? 0) + 1
      counters[platform.envBase] = nextCount
      const platformIndex = nextCount - 1
      const primaryKey = platformPrimaryEnvKey(platform, platformIndex)
      const secondaryKey = platformSecondaryEnvKey(platform, platformIndex)
      const urlKey = platformUrlEnvKey(platform, platformIndex)

      if (value) lines.push(`${primaryKey}=${envFormatValue(value)}`)
      if (secondaryKey && extra) lines.push(`${secondaryKey}=${envFormatValue(extra)}`)
      if (platform.supportsUrlOverride && url) lines.push(`${urlKey}=${envFormatValue(url)}`)

      if (label) lines.push(`${platformMetaEnvKey(platform, platformIndex, "LABEL")}=${envFormatValue(label)}`)
      if (subtitle) lines.push(`${platformMetaEnvKey(platform, platformIndex, "SUBTITLE")}=${envFormatValue(subtitle)}`)
      lines.push(`${platformMetaEnvKey(platform, platformIndex, "ORDER")}=${order}`)
      if (item.newTab !== platform.defaultNewTab) {
        lines.push(`${platformMetaEnvKey(platform, platformIndex, "NEWTAB")}=${item.newTab ? "true" : "false"}`)
      }
      lines.push("")
    }

    lines.push("# vCard (optional extras)")
    lines.push("# Minimal: VCARD_NAME=Max Muster")
    lines.push("")

    const v = vcardDraftToConfig(state.vcard)
    if (v.kind) lines.push(`VCARD_KIND=${envFormatValue(String(v.kind))}`)
    if (v.uid) lines.push(`VCARD_UID=${envFormatValue(String(v.uid))}`)
    if (v.fn) lines.push(`VCARD_NAME=${envFormatValue(String(v.fn))}`)
    if (v.n?.given) lines.push(`VCARD_GIVEN=${envFormatValue(String(v.n.given))}`)
    if (v.n?.family) lines.push(`VCARD_FAMILY=${envFormatValue(String(v.n.family))}`)
    if (v.n?.additional) lines.push(`VCARD_ADDITIONAL=${envFormatValue(String(v.n.additional))}`)
    if (v.n?.prefix) lines.push(`VCARD_PREFIX=${envFormatValue(String(v.n.prefix))}`)
    if (v.n?.suffix) lines.push(`VCARD_SUFFIX=${envFormatValue(String(v.n.suffix))}`)
    if (v.nicknames?.length) lines.push(`VCARD_NICKNAMES=${envFormatValue(v.nicknames.join(","))}`)
    if (v.org?.length) lines.push(`VCARD_ORG=${envFormatValue(v.org.join(";"))}`)
    if (v.title) lines.push(`VCARD_TITLE=${envFormatValue(String(v.title))}`)
    if (v.role) lines.push(`VCARD_ROLE=${envFormatValue(String(v.role))}`)
    if (v.note) lines.push(`VCARD_NOTE=${envFormatValue(String(v.note))}`)
    if (v.categories?.length) lines.push(`VCARD_CATEGORIES=${envFormatValue(v.categories.join(","))}`)
    if (v.bday) lines.push(`VCARD_BDAY=${envFormatValue(String(v.bday))}`)
    if (v.anniversary) lines.push(`VCARD_ANNIVERSARY=${envFormatValue(String(v.anniversary))}`)
    if (v.tz) lines.push(`VCARD_TZ=${envFormatValue(String(v.tz))}`)
    if (v.languages?.length) lines.push(`VCARD_LANGUAGES=${envFormatValue(v.languages.join(","))}`)
    if (v.geo) lines.push(`VCARD_GEO=${envFormatValue(`${v.geo.lat},${v.geo.lon}`)}`)

    if (v.photo?.uri) lines.push(`VCARD_PHOTO_URI=${envFormatValue(String(v.photo.uri))}`)
    if (v.photo?.mediaType) lines.push(`VCARD_PHOTO_MEDIATYPE=${envFormatValue(String(v.photo.mediaType))}`)
    if (v.logo?.uri) lines.push(`VCARD_LOGO_URI=${envFormatValue(String(v.logo.uri))}`)
    if (v.logo?.mediaType) lines.push(`VCARD_LOGO_MEDIATYPE=${envFormatValue(String(v.logo.mediaType))}`)

    if (v.calUri) lines.push(`VCARD_CALURI=${envFormatValue(String(v.calUri))}`)
    if (v.calAdrUri) lines.push(`VCARD_CALADRURI=${envFormatValue(String(v.calAdrUri))}`)
    if (v.fbUrl) lines.push(`VCARD_FBURL=${envFormatValue(String(v.fbUrl))}`)
    if (v.prodId) lines.push(`VCARD_PRODID=${envFormatValue(String(v.prodId))}`)
    if (v.source) lines.push(`VCARD_SOURCE=${envFormatValue(String(v.source))}`)

    const typedGroups = [
      { key: "EMAIL", values: v.emails },
      { key: "TEL", values: v.tels },
      { key: "URL", values: v.urls },
      { key: "IMPP", values: v.impps },
    ] as const
    for (const group of typedGroups) {
      if (!group.values?.length) continue
      group.values.forEach((entry, idx) => {
        const n = idx + 1
        lines.push(`VCARD_${group.key}_${n}=${envFormatValue(String(entry.value ?? ""))}`)
        if (Array.isArray(entry.type) && entry.type.length) {
          lines.push(`VCARD_${group.key}_${n}_TYPE=${envFormatValue(entry.type.join(","))}`)
        }
        if (typeof entry.pref === "number") lines.push(`VCARD_${group.key}_${n}_PREF=${String(entry.pref)}`)
        if (entry.label) lines.push(`VCARD_${group.key}_${n}_LABEL=${envFormatValue(String(entry.label))}`)
      })
    }

    if (v.addresses?.length) {
      v.addresses.forEach((addr, idx) => {
        const n = idx + 1
        if (addr.street) lines.push(`VCARD_ADR_${n}_STREET=${envFormatValue(String(addr.street))}`)
        if (addr.locality) lines.push(`VCARD_ADR_${n}_LOCALITY=${envFormatValue(String(addr.locality))}`)
        if (addr.region) lines.push(`VCARD_ADR_${n}_REGION=${envFormatValue(String(addr.region))}`)
        if (addr.postalCode) lines.push(`VCARD_ADR_${n}_POSTAL_CODE=${envFormatValue(String(addr.postalCode))}`)
        if (addr.country) lines.push(`VCARD_ADR_${n}_COUNTRY=${envFormatValue(String(addr.country))}`)
        if (addr.pobox) lines.push(`VCARD_ADR_${n}_POBOX=${envFormatValue(String(addr.pobox))}`)
        if (addr.extended) lines.push(`VCARD_ADR_${n}_EXTENDED=${envFormatValue(String(addr.extended))}`)
        if (addr.label) lines.push(`VCARD_ADR_${n}_LABEL=${envFormatValue(String(addr.label))}`)
        if (Array.isArray(addr.type) && addr.type.length)
          lines.push(`VCARD_ADR_${n}_TYPE=${envFormatValue(addr.type.join(","))}`)
        if (typeof addr.pref === "number") lines.push(`VCARD_ADR_${n}_PREF=${String(addr.pref)}`)
      })
    }

    if (v.keys?.length) {
      v.keys.forEach((k, idx) => {
        const n = idx + 1
        if (k.uri) lines.push(`VCARD_KEY_${n}_URI=${envFormatValue(String(k.uri))}`)
        if (k.text) lines.push(`VCARD_KEY_${n}_TEXT=${envFormatValue(String(k.text))}`)
        if (k.mediaType) lines.push(`VCARD_KEY_${n}_MEDIATYPE=${envFormatValue(String(k.mediaType))}`)
      })
    }
  } else {
    lines.push("# JSON configs (advanced)")

    const items = itemsDraftToConfig(state.items)
    const vcard = vcardDraftToConfig(state.vcard)
    const profileConfig = {
      ...(state.profile.displayName.trim() ? { displayName: state.profile.displayName.trim() } : {}),
      ...(state.profile.headline.trim() ? { headline: state.profile.headline.trim() } : {}),
      ...(state.profile.bio.trim() ? { bio: state.profile.bio.trim() } : {}),
      ...(state.profile.avatarUrl.trim() ? { avatarUrl: state.profile.avatarUrl.trim() } : {}),
    }

    if (state.outputMode === "config") {
      lines.push("CONTACT_PROFILE_JSON=")
      lines.push("CONTACT_ITEMS_JSON=")
      lines.push("CONTACT_VCARD_JSON=")
      lines.push(
        "CONTACT_CONFIG_JSON=" +
          envQuoteJson({
            ...(Object.keys(profileConfig).length ? { profile: profileConfig } : {}),
            ...(Array.isArray(items) ? { items } : {}),
            ...(Object.keys(vcard).length ? { vcard } : {}),
          })
      )
    } else {
      lines.push("CONTACT_PROFILE_JSON='{}'")
      lines.push("CONTACT_ITEMS_JSON=" + envQuoteJson(items))
      lines.push("CONTACT_VCARD_JSON=" + envQuoteJson(vcard))
      lines.push("CONTACT_CONFIG_JSON=")
    }
  }

  lines.push("")
  lines.push("# Security note")
  lines.push("# robots.txt + noindex headers are strong signals, not access control.")
  lines.push("# Anyone with the link can still access the data.")

  return lines.join("\n") + "\n"
}

function dotenvUnescapeDoubleQuoted(value: string) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
}

function parseEnvFile(text: string): { values: Record<string, string>; errors: string[] } {
  const values: Record<string, string> = {}
  const errors: string[] = []
  const lines = text.replace(/\r\n/g, "\n").split("\n")

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i] ?? ""
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue

    const eq = line.indexOf("=")
    if (eq === -1) continue

    let key = line.slice(0, eq).trim()
    key = key.replace(/^export\s+/, "")
    if (!/^[A-Z0-9_]+$/.test(key)) continue

    let rest = line.slice(eq + 1).trim()
    if (!rest) {
      values[key] = ""
      continue
    }

    const quote = rest[0]
    if (quote !== "'" && quote !== '"') {
      values[key] = rest
      continue
    }

    rest = rest.slice(1)
    const collected: string[] = []
    let done = false

    function findClosingDouble(s: string) {
      let escaped = false
      for (let j = 0; j < s.length; j += 1) {
        const ch = s[j]
        if (escaped) {
          escaped = false
          continue
        }
        if (ch === "\\") {
          escaped = true
          continue
        }
        if (ch === '"') return j
      }
      return -1
    }

    let current = rest
    let j = i
    while (j < lines.length) {
      if (quote === "'") {
        const end = current.indexOf("'")
        if (end !== -1) {
          collected.push(current.slice(0, end))
          done = true
          break
        }
      } else {
        const end = findClosingDouble(current)
        if (end !== -1) {
          collected.push(current.slice(0, end))
          done = true
          break
        }
      }

      collected.push(current)
      j += 1
      if (j < lines.length) {
        collected.push("\n")
        current = lines[j] ?? ""
      }
    }

    if (!done) {
      errors.push(`Unterminated quoted value for ${key}.`)
      values[key] = collected.join("")
      continue
    }

    const rawValue = collected.join("")
    values[key] = quote === '"' ? dotenvUnescapeDoubleQuoted(rawValue) : rawValue
    i = j
  }

  return { values, errors }
}

function safeJsonParse<T>(input: string): { ok: true; data: T } | { ok: false; error: string } {
  try {
    return { ok: true, data: JSON.parse(input) as T }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid JSON" }
  }
}

function firstMapValue(env: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const raw = env[key]
    if (typeof raw !== "string") continue
    const trimmed = raw.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

function mapBool(env: Record<string, string>, ...keys: string[]) {
  const raw = firstMapValue(env, ...keys)
  if (!raw) return undefined
  const v = raw.toLowerCase()
  if (v === "true" || v === "1" || v === "yes" || v === "on") return true
  if (v === "false" || v === "0" || v === "no" || v === "off") return false
  return undefined
}

function mapCsv(env: Record<string, string>, ...keys: string[]) {
  const raw = firstMapValue(env, ...keys)
  if (!raw) return undefined
  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length ? parts : undefined
}

function mapOrg(env: Record<string, string>, ...keys: string[]) {
  const raw = firstMapValue(env, ...keys)
  if (!raw) return undefined
  const sep = raw.includes(";") ? ";" : ","
  const parts = raw
    .split(sep)
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length ? parts : undefined
}

function withContactPrefixedKeys(keys: string[]) {
  return keys.flatMap((key) => [`CONTACT_${key}`, key])
}

function stateFromEnvFile(text: string): Pick<EditorState, keyof EditorState> {
  const base = structuredClone(DEFAULT_STATE)
  const parsed = parseEnvFile(text)
  base.parseErrors = parsed.errors

  const env = parsed.values
  if (env.CONTACT_RENDER_IN_DEV) {
    base.renderInDev = env.CONTACT_RENDER_IN_DEV.trim().toLowerCase() === "true"
  }
  if (env.CONTACT_PUBLIC_URL !== undefined) base.publicUrl = env.CONTACT_PUBLIC_URL
  if (env.CONTACT_PAGE_TITLE !== undefined) base.pageTitle = env.CONTACT_PAGE_TITLE
  if (env.CONTACT_PAGE_DESCRIPTION !== undefined) base.pageDescription = env.CONTACT_PAGE_DESCRIPTION

  if (env.CONTACT_DISPLAY_NAME !== undefined) base.profile.displayName = env.CONTACT_DISPLAY_NAME
  if (env.CONTACT_HEADLINE !== undefined) base.profile.headline = env.CONTACT_HEADLINE
  if (env.CONTACT_BIO !== undefined) base.profile.bio = env.CONTACT_BIO
  if (env.CONTACT_AVATAR_URL !== undefined) base.profile.avatarUrl = env.CONTACT_AVATAR_URL

  const configJson = env.CONTACT_CONFIG_JSON?.trim()
  if (configJson) {
    const configParsed = safeJsonParse<{
      profile?: Partial<EditorState["profile"]>
      items?: unknown
      vcard?: unknown
    }>(configJson)
    if (!configParsed.ok) {
      base.parseErrors.push(`CONTACT_CONFIG_JSON: ${configParsed.error}`)
    } else {
      base.outputMode = "config"
      base.profile = {
        displayName: String(configParsed.data.profile?.displayName ?? base.profile.displayName ?? ""),
        headline: String(configParsed.data.profile?.headline ?? base.profile.headline ?? ""),
        bio: String(configParsed.data.profile?.bio ?? base.profile.bio ?? ""),
        avatarUrl: String(configParsed.data.profile?.avatarUrl ?? base.profile.avatarUrl ?? ""),
      }

      if (Array.isArray(configParsed.data.items)) {
        base.items = sortImportedItems(configParsed.data.items.map((raw) => draftFromUnknownItem(raw)))
      }
    }
  } else {
    const itemsJson = env.CONTACT_ITEMS_JSON?.trim()
    if (itemsJson) {
      base.outputMode = "split"
      const itemsParsed = safeJsonParse<unknown>(itemsJson)
      if (!itemsParsed.ok) {
        base.parseErrors.push(`CONTACT_ITEMS_JSON: ${itemsParsed.error}`)
      } else if (Array.isArray(itemsParsed.data)) {
        base.items = sortImportedItems(itemsParsed.data.map((raw) => draftFromUnknownItem(raw)))
      }
    }

    const vcardJson = env.CONTACT_VCARD_JSON?.trim()
    if (vcardJson) {
      base.outputMode = "split"
      const vcardParsed = safeJsonParse<unknown>(vcardJson)
      if (!vcardParsed.ok) {
        base.parseErrors.push(`CONTACT_VCARD_JSON: ${vcardParsed.error}`)
      } else if (vcardParsed.data && typeof vcardParsed.data === "object" && !Array.isArray(vcardParsed.data)) {
        const v = vcardParsed.data as Record<string, unknown>
        const kindValue = typeof v.kind === "string" ? v.kind : ""
        base.vcard.kind =
          kindValue === "individual" || kindValue === "org" || kindValue === "group" || kindValue === "location"
            ? (kindValue as VCardDraft["kind"])
            : ""

        base.vcard.uid = typeof v.uid === "string" ? v.uid : ""
        base.vcard.fn = typeof v.fn === "string" ? v.fn : ""

        const n =
          v.n && typeof v.n === "object" && !Array.isArray(v.n) ? (v.n as Record<string, unknown>) : undefined
        base.vcard.nFamily = typeof n?.family === "string" ? n.family : ""
        base.vcard.nGiven = typeof n?.given === "string" ? n.given : ""
        base.vcard.nAdditional = typeof n?.additional === "string" ? n.additional : ""
        base.vcard.nPrefix = typeof n?.prefix === "string" ? n.prefix : ""
        base.vcard.nSuffix = typeof n?.suffix === "string" ? n.suffix : ""

        base.vcard.nicknames = Array.isArray(v.nicknames) ? v.nicknames.map(String) : [""]
        base.vcard.org = Array.isArray(v.org) ? v.org.map(String) : [""]

        base.vcard.title = typeof v.title === "string" ? v.title : ""
        base.vcard.role = typeof v.role === "string" ? v.role : ""
        base.vcard.note = typeof v.note === "string" ? v.note : ""

        base.vcard.categories = Array.isArray(v.categories) ? v.categories.map(String) : [""]
        base.vcard.languages = Array.isArray(v.languages) ? v.languages.map(String) : [""]

        base.vcard.bday = typeof v.bday === "string" ? v.bday : ""
        base.vcard.anniversary = typeof v.anniversary === "string" ? v.anniversary : ""
        base.vcard.tz = typeof v.tz === "string" ? v.tz : ""

        const geo =
          v.geo && typeof v.geo === "object" && !Array.isArray(v.geo) ? (v.geo as Record<string, unknown>) : undefined
        base.vcard.geoLat = typeof geo?.lat === "number" ? String(geo.lat) : ""
        base.vcard.geoLon = typeof geo?.lon === "number" ? String(geo.lon) : ""

        const photo =
          v.photo && typeof v.photo === "object" && !Array.isArray(v.photo)
            ? (v.photo as Record<string, unknown>)
            : undefined
        base.vcard.photoUri = typeof photo?.uri === "string" ? photo.uri : ""
        base.vcard.photoMediaType = typeof photo?.mediaType === "string" ? photo.mediaType : ""

        const logo =
          v.logo && typeof v.logo === "object" && !Array.isArray(v.logo) ? (v.logo as Record<string, unknown>) : undefined
        base.vcard.logoUri = typeof logo?.uri === "string" ? logo.uri : ""
        base.vcard.logoMediaType = typeof logo?.mediaType === "string" ? logo.mediaType : ""

        base.vcard.calUri = typeof v.calUri === "string" ? v.calUri : ""
        base.vcard.calAdrUri = typeof v.calAdrUri === "string" ? v.calAdrUri : ""
        base.vcard.fbUrl = typeof v.fbUrl === "string" ? v.fbUrl : ""
        base.vcard.prodId = typeof v.prodId === "string" ? v.prodId : ""
        base.vcard.source = typeof v.source === "string" ? v.source : ""

        const typedDrafts = (arr: unknown) =>
          Array.isArray(arr)
            ? arr.map((entry) => {
                const e =
                  entry && typeof entry === "object" && !Array.isArray(entry)
                    ? (entry as Record<string, unknown>)
                    : undefined
                const type = Array.isArray(e?.type) ? e.type.map(String).join(", ") : ""
                return {
                  value: typeof e?.value === "string" ? e.value : "",
                  type,
                  pref: typeof e?.pref === "number" ? String(e.pref) : "",
                  label: typeof e?.label === "string" ? e.label : "",
                }
              })
            : [{ ...DEFAULT_TYPED }]

        base.vcard.emails = typedDrafts(v.emails)
        base.vcard.tels = typedDrafts(v.tels)
        base.vcard.urls = typedDrafts(v.urls)
        base.vcard.impps = typedDrafts(v.impps)

        base.vcard.addresses = Array.isArray(v.addresses)
          ? v.addresses.map((entry) => {
              const a =
                entry && typeof entry === "object" && !Array.isArray(entry)
                  ? (entry as Record<string, unknown>)
                  : undefined
              const type = Array.isArray(a?.type) ? a.type.map(String).join(", ") : ""
              return {
                pobox: typeof a?.pobox === "string" ? a.pobox : "",
                extended: typeof a?.extended === "string" ? a.extended : "",
                street: typeof a?.street === "string" ? a.street : "",
                locality: typeof a?.locality === "string" ? a.locality : "",
                region: typeof a?.region === "string" ? a.region : "",
                postalCode: typeof a?.postalCode === "string" ? a.postalCode : "",
                country: typeof a?.country === "string" ? a.country : "",
                label: typeof a?.label === "string" ? a.label : "",
                type,
                pref: typeof a?.pref === "number" ? String(a.pref) : "",
              }
            })
          : [{ ...DEFAULT_ADDR }]

        base.vcard.keys = Array.isArray(v.keys)
          ? v.keys.map((entry) => {
              const k =
                entry && typeof entry === "object" && !Array.isArray(entry)
                  ? (entry as Record<string, unknown>)
                  : undefined
              return {
                uri: typeof k?.uri === "string" ? k.uri : "",
                text: typeof k?.text === "string" ? k.text : "",
                mediaType: typeof k?.mediaType === "string" ? k.mediaType : "",
              }
            })
          : [{ ...DEFAULT_KEY }]
      }
    }

    // Flat properties-style import (Minecraft server.properties-like)
    if (!itemsJson) {
      const imported: Array<{ item: ContactItemDraft; order?: number }> = []

      // Indexed items: ITEM_1_TYPE=..., ITEM_1_VALUE=..., ITEM_1_URL=...
      for (let i = 1; i <= 50; i += 1) {
        const bases = [`CONTACT_ITEM_${i}`, `ITEM_${i}`]
        const type = firstMapValue(env, ...bases.map((b) => `${b}_TYPE`)) ?? ""
        const label = firstMapValue(env, ...bases.map((b) => `${b}_LABEL`)) ?? ""
        const subtitle = firstMapValue(env, ...bases.map((b) => `${b}_SUBTITLE`)) ?? ""
        const value = firstMapValue(env, ...bases.map((b) => `${b}_VALUE`)) ?? ""
        const legacyHandle = firstMapValue(env, ...bases.map((b) => `${b}_HANDLE`)) ?? ""
        const extra = firstMapValue(env, ...bases.map((b) => `${b}_EXTRA`)) ?? ""
        const url = firstMapValue(env, ...bases.map((b) => `${b}_URL`), ...bases.map((b) => `${b}_HREF`)) ?? ""
        const newTab = mapBool(env, ...bases.map((b) => `${b}_NEWTAB`)) ?? false
        const order = parseMaybeNumber(firstMapValue(env, ...bases.map((b) => `${b}_ORDER`)) ?? "")

        if (!type && !label && !subtitle && !value && !legacyHandle && !extra && !url && !order && !newTab) continue
        if (!value && !legacyHandle && !extra && !url) continue

        imported.push({
          item: {
            ...DEFAULT_ITEM,
            type: normalizeDraftType(type),
            label,
            subtitle,
            value: value || legacyHandle,
            extra,
            url,
            newTab,
          },
          order,
        })
      }

      // Simple keys: INSTAGRAM=..., GITHUB=..., DISCORD_USER_ID=...
      for (const platform of CONTACT_PLATFORMS) {
        for (let idx = 0; idx < 20; idx += 1) {
          const root = platformEnvKey(platform.envBase, idx)
          const label = firstMapValue(env, ...withContactPrefixedKeys([`${root}_LABEL`])) ?? ""
          const subtitle = firstMapValue(env, ...withContactPrefixedKeys([`${root}_SUBTITLE`])) ?? ""
          const order = parseMaybeNumber(firstMapValue(env, ...withContactPrefixedKeys([`${root}_ORDER`])) ?? "")
          const newTab = mapBool(env, ...withContactPrefixedKeys([`${root}_NEWTAB`])) ?? platform.defaultNewTab

          const primaryKeys = [platformPrimaryEnvKey(platform, idx)]
          for (const legacy of platform.legacyPrimaryBases ?? []) {
            primaryKeys.push(platformEnvKey(legacy, idx))
          }

          const secondaryKeys: string[] = []
          const secondaryKey = platformSecondaryEnvKey(platform, idx)
          if (secondaryKey) secondaryKeys.push(secondaryKey)
          for (const legacy of platform.legacySecondaryBases ?? []) {
            secondaryKeys.push(platformEnvKey(legacy, idx))
          }

          const urlKeys = [platformUrlEnvKey(platform, idx)]
          for (const legacy of platform.legacyUrlBases ?? []) {
            urlKeys.push(platformEnvKey(legacy, idx, "URL"))
          }

          const value = firstMapValue(env, ...withContactPrefixedKeys(primaryKeys)) ?? ""
          const extra = firstMapValue(env, ...withContactPrefixedKeys(secondaryKeys)) ?? ""
          const url = firstMapValue(env, ...withContactPrefixedKeys(urlKeys)) ?? ""

          const hasSomething = Boolean(value || extra || url || label || subtitle || order || newTab !== platform.defaultNewTab)
          if (!hasSomething) continue

          imported.push({
            item: {
              ...DEFAULT_ITEM,
              type: platform.id,
              label,
              subtitle,
              value,
              extra,
              url,
              newTab,
            },
            order,
          })
        }
      }

      // Dedupe (keep original order: indexed first, then simple).
      const seen = new Set<string>()
      const deduped: Array<{ item: ContactItemDraft; order?: number }> = []
      for (const entry of imported) {
        const item = entry.item
        const key = `${item.type}|${item.value}|${item.extra}|${item.url}|${item.label}|${item.subtitle}`
        if (seen.has(key)) continue
        seen.add(key)
        deduped.push(entry)
      }

      if (deduped.length) {
        base.items = sortImportedItems(deduped)
        base.outputMode = "properties"
      }
    }

    if (!vcardJson) {
      const kind = firstMapValue(env, "CONTACT_VCARD_KIND", "VCARD_KIND") ?? ""
      if (kind === "individual" || kind === "org" || kind === "group" || kind === "location") {
        base.vcard.kind = kind as VCardDraft["kind"]
      }
      base.vcard.uid = firstMapValue(env, "CONTACT_VCARD_UID", "VCARD_UID") ?? ""
      base.vcard.fn =
        firstMapValue(env, "CONTACT_VCARD_NAME", "CONTACT_VCARD_FN", "VCARD_NAME", "VCARD_FN", "NAME") ?? ""

      base.vcard.nGiven = firstMapValue(env, "CONTACT_VCARD_GIVEN", "VCARD_GIVEN") ?? ""
      base.vcard.nFamily = firstMapValue(env, "CONTACT_VCARD_FAMILY", "VCARD_FAMILY") ?? ""
      base.vcard.nAdditional = firstMapValue(env, "CONTACT_VCARD_ADDITIONAL", "VCARD_ADDITIONAL") ?? ""
      base.vcard.nPrefix = firstMapValue(env, "CONTACT_VCARD_PREFIX", "VCARD_PREFIX") ?? ""
      base.vcard.nSuffix = firstMapValue(env, "CONTACT_VCARD_SUFFIX", "VCARD_SUFFIX") ?? ""

      const nicknames = mapCsv(env, "CONTACT_VCARD_NICKNAMES", "VCARD_NICKNAMES") ?? [""]
      base.vcard.nicknames = nicknames.length ? nicknames : [""]

      const org = mapOrg(env, "CONTACT_VCARD_ORG", "VCARD_ORG") ?? [""]
      base.vcard.org = org.length ? org : [""]

      const categories = mapCsv(env, "CONTACT_VCARD_CATEGORIES", "VCARD_CATEGORIES") ?? [""]
      base.vcard.categories = categories.length ? categories : [""]

      const languages = mapCsv(env, "CONTACT_VCARD_LANGUAGES", "VCARD_LANGUAGES") ?? [""]
      base.vcard.languages = languages.length ? languages : [""]

      base.vcard.title = firstMapValue(env, "CONTACT_VCARD_TITLE", "VCARD_TITLE") ?? ""
      base.vcard.role = firstMapValue(env, "CONTACT_VCARD_ROLE", "VCARD_ROLE") ?? ""
      base.vcard.note = firstMapValue(env, "CONTACT_VCARD_NOTE", "VCARD_NOTE") ?? ""
      base.vcard.bday = firstMapValue(env, "CONTACT_VCARD_BDAY", "VCARD_BDAY") ?? ""
      base.vcard.anniversary = firstMapValue(env, "CONTACT_VCARD_ANNIVERSARY", "VCARD_ANNIVERSARY") ?? ""
      base.vcard.tz = firstMapValue(env, "CONTACT_VCARD_TZ", "VCARD_TZ") ?? ""

      const geo = firstMapValue(env, "CONTACT_VCARD_GEO", "VCARD_GEO")
      if (geo) {
        const cleaned = geo.replace(/^geo:/i, "")
        const [latRaw, lonRaw] = cleaned.split(",", 2).map((x) => x?.trim())
        base.vcard.geoLat = latRaw ?? ""
        base.vcard.geoLon = lonRaw ?? ""
      }

      base.vcard.photoUri = firstMapValue(env, "CONTACT_VCARD_PHOTO_URI", "VCARD_PHOTO_URI") ?? ""
      base.vcard.photoMediaType =
        firstMapValue(env, "CONTACT_VCARD_PHOTO_MEDIATYPE", "VCARD_PHOTO_MEDIATYPE", "VCARD_PHOTO_MEDIA_TYPE") ?? ""
      base.vcard.logoUri = firstMapValue(env, "CONTACT_VCARD_LOGO_URI", "VCARD_LOGO_URI") ?? ""
      base.vcard.logoMediaType =
        firstMapValue(env, "CONTACT_VCARD_LOGO_MEDIATYPE", "VCARD_LOGO_MEDIATYPE", "VCARD_LOGO_MEDIA_TYPE") ?? ""

      base.vcard.calUri = firstMapValue(env, "CONTACT_VCARD_CALURI", "VCARD_CALURI") ?? ""
      base.vcard.calAdrUri = firstMapValue(env, "CONTACT_VCARD_CALADRURI", "VCARD_CALADRURI") ?? ""
      base.vcard.fbUrl = firstMapValue(env, "CONTACT_VCARD_FBURL", "VCARD_FBURL") ?? ""
      base.vcard.prodId = firstMapValue(env, "CONTACT_VCARD_PRODID", "VCARD_PRODID") ?? ""
      base.vcard.source = firstMapValue(env, "CONTACT_VCARD_SOURCE", "VCARD_SOURCE") ?? ""

      const typedFromPrefix = (prefix: "EMAIL" | "TEL" | "URL" | "IMPP") => {
        const out: VCardTypedValueDraft[] = []
        for (let i = 1; i <= 20; i += 1) {
          const baseKey = `${prefix}_${i}`
          const value = firstMapValue(env, `CONTACT_VCARD_${baseKey}`, `VCARD_${baseKey}`) ?? ""
          if (!value) continue
          out.push({
            value,
            type: firstMapValue(env, `CONTACT_VCARD_${baseKey}_TYPE`, `VCARD_${baseKey}_TYPE`) ?? "",
            pref: firstMapValue(env, `CONTACT_VCARD_${baseKey}_PREF`, `VCARD_${baseKey}_PREF`) ?? "",
            label: firstMapValue(env, `CONTACT_VCARD_${baseKey}_LABEL`, `VCARD_${baseKey}_LABEL`) ?? "",
          })
        }
        return out.length ? out : [{ ...DEFAULT_TYPED }]
      }

      base.vcard.emails = typedFromPrefix("EMAIL")
      base.vcard.tels = typedFromPrefix("TEL")
      base.vcard.urls = typedFromPrefix("URL")
      base.vcard.impps = typedFromPrefix("IMPP")

      const addresses: VCardAddressDraft[] = []
      for (let i = 1; i <= 20; i += 1) {
        const baseKey = `ADR_${i}`
        const street = firstMapValue(env, `CONTACT_VCARD_${baseKey}_STREET`, `VCARD_${baseKey}_STREET`) ?? ""
        const locality = firstMapValue(env, `CONTACT_VCARD_${baseKey}_LOCALITY`, `VCARD_${baseKey}_LOCALITY`) ?? ""
        const region = firstMapValue(env, `CONTACT_VCARD_${baseKey}_REGION`, `VCARD_${baseKey}_REGION`) ?? ""
        const postalCode =
          firstMapValue(
            env,
            `CONTACT_VCARD_${baseKey}_POSTAL_CODE`,
            `VCARD_${baseKey}_POSTAL_CODE`,
            `CONTACT_VCARD_${baseKey}_POSTAL`,
            `VCARD_${baseKey}_POSTAL`
          ) ?? ""
        const country = firstMapValue(env, `CONTACT_VCARD_${baseKey}_COUNTRY`, `VCARD_${baseKey}_COUNTRY`) ?? ""
        const pobox = firstMapValue(env, `CONTACT_VCARD_${baseKey}_POBOX`, `VCARD_${baseKey}_POBOX`) ?? ""
        const extended = firstMapValue(env, `CONTACT_VCARD_${baseKey}_EXTENDED`, `VCARD_${baseKey}_EXTENDED`) ?? ""
        const label = firstMapValue(env, `CONTACT_VCARD_${baseKey}_LABEL`, `VCARD_${baseKey}_LABEL`) ?? ""
        const type = firstMapValue(env, `CONTACT_VCARD_${baseKey}_TYPE`, `VCARD_${baseKey}_TYPE`) ?? ""
        const pref = firstMapValue(env, `CONTACT_VCARD_${baseKey}_PREF`, `VCARD_${baseKey}_PREF`) ?? ""

        const hasAny = Boolean(street || locality || region || postalCode || country || pobox || extended || label || type || pref)
        if (!hasAny) continue
        addresses.push({ ...DEFAULT_ADDR, street, locality, region, postalCode, country, pobox, extended, label, type, pref })
      }
      if (addresses.length) base.vcard.addresses = addresses

      const keys: VCardKeyDraft[] = []
      for (let i = 1; i <= 20; i += 1) {
        const baseKey = `KEY_${i}`
        const uri = firstMapValue(env, `CONTACT_VCARD_${baseKey}_URI`, `VCARD_${baseKey}_URI`) ?? ""
        const text = firstMapValue(env, `CONTACT_VCARD_${baseKey}_TEXT`, `VCARD_${baseKey}_TEXT`) ?? ""
        const mediaType =
          firstMapValue(
            env,
            `CONTACT_VCARD_${baseKey}_MEDIATYPE`,
            `VCARD_${baseKey}_MEDIATYPE`,
            `CONTACT_VCARD_${baseKey}_MEDIA_TYPE`,
            `VCARD_${baseKey}_MEDIA_TYPE`
          ) ?? ""
        if (!uri && !text && !mediaType) continue
        keys.push({ ...DEFAULT_KEY, uri, text, mediaType })
      }
      if (keys.length) base.vcard.keys = keys
    }
  }

  if (!base.items.length) base.items = [{ ...DEFAULT_ITEM }]

  return base
}

export function EnvEditor() {
  const [state, setState] = React.useState<EditorState>(() => DEFAULT_STATE)
  const [expandedItems, setExpandedItems] = React.useState<number[]>([])
  const envText = React.useMemo(() => serializeEnv(state), [state])

  async function onUpload(file: File) {
    const text = await file.text()
    const next = stateFromEnvFile(text)
    next.fileName = file.name || ".env.local"
    setState(next)
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(envText)
    } catch {
      // ignore
    }
  }

  function onDownload() {
    const blob = new Blob([envText], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = state.fileName || ".env.local"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function toggleItemExpanded(index: number) {
    setExpandedItems((current) =>
      current.includes(index) ? current.filter((itemIndex) => itemIndex !== index) : [...current, index]
    )
  }

  async function onVcardImageUpload(kind: "photo" | "logo", file: File) {
    if (!file.type.startsWith("image/")) return
    const dataUrl = await readFileAsDataUrl(file)
    setState((current) => ({
      ...current,
      vcard: {
        ...current.vcard,
        ...(kind === "photo"
          ? { photoUri: dataUrl, photoMediaType: file.type || current.vcard.photoMediaType }
          : { logoUri: dataUrl, logoMediaType: file.type || current.vcard.logoMediaType }),
      },
    }))
  }

  return (
    <main className="relative min-h-svh px-4 py-10 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_40%_at_50%_0%,color-mix(in_oklch,var(--color-primary)_18%,transparent),transparent_65%)]"
      />

      <div className="mx-auto w-full max-w-[1440px]">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">Env editor</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate a valid `.env.local` for this contact card (no manual JSON quoting).
            </p>
          </div>
        </header>

        {state.parseErrors.length ? (
          <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <div className="font-medium">Import warnings</div>
            <ul className="mt-2 list-disc pl-5 text-xs">
              {state.parseErrors.map((e, idx) => (
                <li key={idx}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <Section
            title="Env format"
            description="Properties is a Minecraft-style key=value file (recommended). JSON modes are kept for compatibility."
          >
            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setState((s) => ({ ...s, outputMode: "properties" }))}
                className={cn(
                  "rounded-xl border border-border bg-background p-3 text-left text-sm transition-colors hover:bg-muted/30",
                  state.outputMode === "properties" && "border-ring ring-3 ring-ring/30"
                )}
              >
                <div className="font-medium">Properties</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Simple lines like INSTAGRAM=yourhandle or DISCORD_USER_ID=123456789.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setState((s) => ({ ...s, outputMode: "split" }))}
                className={cn(
                  "rounded-xl border border-border bg-background p-3 text-left text-sm transition-colors hover:bg-muted/30",
                  state.outputMode === "split" && "border-ring ring-3 ring-ring/30"
                )}
              >
                <div className="font-medium">JSON (split)</div>
                <div className="mt-1 text-xs text-muted-foreground">CONTACT_ITEMS_JSON + CONTACT_VCARD_JSON.</div>
              </button>
              <button
                type="button"
                onClick={() => setState((s) => ({ ...s, outputMode: "config" }))}
                className={cn(
                  "rounded-xl border border-border bg-background p-3 text-left text-sm transition-colors hover:bg-muted/30",
                  state.outputMode === "config" && "border-ring ring-3 ring-ring/30"
                )}
              >
                <div className="font-medium">CONTACT_CONFIG_JSON</div>
                <div className="mt-1 text-xs text-muted-foreground">One env var with the full profile/items/vCard.</div>
              </button>
            </div>
          </Section>

          <Section title="Export" description="Upload an existing env file, then copy or download the generated output.">
            <div className="grid gap-4">
              <Field label="Download file name" hint="Only affects the downloaded file name in your browser.">
                <TextInput
                  value={state.fileName}
                  onChange={(fileName) => setState((s) => ({ ...s, fileName }))}
                  placeholder=".env.local"
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <label className="cursor-pointer">
                    <input
                      className="sr-only"
                      type="file"
                      accept=".env,.local,.txt,.env.local"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void onUpload(file)
                        e.currentTarget.value = ""
                      }}
                    />
                    <FileUp aria-hidden />
                    Upload
                  </label>
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={onCopy}>
                  Copy
                </Button>
                <Button type="button" size="sm" onClick={onDownload}>
                  <Download aria-hidden />
                  Download
                </Button>
              </div>
            </div>
          </Section>
        </div>

        <details className="mt-4 rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
          <summary className="cursor-pointer text-sm font-medium">Generated env preview</summary>
          <p className="mt-2 text-xs text-muted-foreground">
            Collapsed by default so the rest of the editor has more room.
          </p>
          <div className="mt-4">
            <TextArea value={envText} onChange={() => {}} rows={18} readOnly />
          </div>
        </details>

        <div className="mt-4 grid gap-4">
          <Section
            title="Basics"
            description="CONTACT_RENDER_IN_DEV controls whether contact details are visible in development."
          >
              <Toggle
                checked={state.renderInDev}
                onChange={(checked) => setState((s) => ({ ...s, renderInDev: checked }))}
                label="Render in development"
                hint="If off, the homepage hides contact buttons locally unless NODE_ENV=production."
              />
              <Field label="Public URL" hint="Used for absolute QR codes and the vCard download URL.">
                <TextInput
                  value={state.publicUrl}
                  onChange={(publicUrl) => setState((s) => ({ ...s, publicUrl }))}
                  placeholder="https://contact.example.com"
                  inputMode="url"
                />
              </Field>
            </Section>

            <Section title="Page metadata" description="Optional (still noindex).">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                <Field label="Page title" hint="CONTACT_PAGE_TITLE">
                  <TextInput
                    value={state.pageTitle}
                    onChange={(pageTitle) => setState((s) => ({ ...s, pageTitle }))}
                    placeholder="Contact"
                  />
                </Field>
                <Field label="Page description" hint="CONTACT_PAGE_DESCRIPTION">
                  <TextInput
                    value={state.pageDescription}
                    onChange={(pageDescription) => setState((s) => ({ ...s, pageDescription }))}
                    placeholder="A private contact card"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Profile" description="Header shown on the homepage.">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                <Field label="Display name" hint="CONTACT_DISPLAY_NAME">
                  <TextInput
                    value={state.profile.displayName}
                    onChange={(displayName) => setState((s) => ({ ...s, profile: { ...s.profile, displayName } }))}
                    placeholder="Your name"
                  />
                </Field>
                <Field label="Headline" hint="CONTACT_HEADLINE">
                  <TextInput
                    value={state.profile.headline}
                    onChange={(headline) => setState((s) => ({ ...s, profile: { ...s.profile, headline } }))}
                    placeholder="Short tagline"
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                <Field label="Avatar URL" hint="CONTACT_AVATAR_URL">
                  <TextInput
                    value={state.profile.avatarUrl}
                    onChange={(avatarUrl) => setState((s) => ({ ...s, profile: { ...s.profile, avatarUrl } }))}
                    placeholder="https://example.com/avatar.jpg"
                    inputMode="url"
                  />
                </Field>
                <Field label="Bio" hint="CONTACT_BIO">
                  <TextInput
                    value={state.profile.bio}
                    onChange={(bio) => setState((s) => ({ ...s, profile: { ...s.profile, bio } }))}
                    placeholder="A bit more detail"
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Contact items"
              description="One row per button. Pick a platform and enter only the identifier that platform needs."
            >
              <div className="grid gap-3">
                {state.items.map((item, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-background p-3">
                    {(() => {
                      const platform = getDraftPlatform(item.type)
                      const isExpanded = expandedItems.includes(idx)
                      const primaryInputType =
                        platform.primaryField.inputMode === "email"
                          ? "email"
                          : platform.primaryField.inputMode === "url"
                            ? "url"
                            : "text"
                      const secondaryInputType =
                        platform.secondaryField?.inputMode === "email"
                          ? "email"
                          : platform.secondaryField?.inputMode === "url"
                            ? "url"
                            : "text"

                      return (
                        <>
                          <div className="grid gap-3 xl:grid-cols-[260px_minmax(0,1.2fr)_minmax(0,1fr)_auto] xl:items-end">
                            <Field label="Platform">
                              <div className="flex items-center gap-2">
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/30">
                                  <ContactIconGlyph name={platform.icon} className="text-foreground/70" />
                                </span>
                                <SelectInput
                                  value={platform.id}
                                  onChange={(nextType) =>
                                    setState((s) => ({
                                      ...s,
                                      items: s.items.map((entry, itemIndex) => {
                                        if (itemIndex !== idx) return entry
                                        const nextPlatform = getDraftPlatform(nextType)
                                        return {
                                          ...entry,
                                          type: nextPlatform.id,
                                          extra: nextPlatform.secondaryField ? entry.extra : "",
                                          newTab: nextPlatform.defaultNewTab,
                                        }
                                      }),
                                    }))
                                  }
                                >
                                  {platformOptionGroups().map(([group, platforms]) => (
                                    <optgroup key={group} label={group}>
                                      {platforms.map((option) => (
                                        <option key={option.id} value={option.id}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </optgroup>
                                  ))}
                                </SelectInput>
                              </div>
                            </Field>

                            <Field label={platform.primaryField.label}>
                              <TextInput
                                value={item.value}
                                onChange={(value) =>
                                  setState((s) => ({
                                    ...s,
                                    items: updateItemAt(s.items, idx, { ...item, value }),
                                  }))
                                }
                                placeholder={platform.primaryField.placeholder}
                                type={primaryInputType}
                                inputMode={platform.primaryField.inputMode}
                              />
                            </Field>

                            <Field label={platform.secondaryField?.label ?? "Button label"}>
                              <TextInput
                                value={platform.secondaryField ? item.extra : item.label}
                                onChange={(nextValue) =>
                                  setState((s) => ({
                                    ...s,
                                    items: updateItemAt(s.items, idx, {
                                      ...item,
                                      ...(platform.secondaryField ? { extra: nextValue } : { label: nextValue }),
                                    }),
                                  }))
                                }
                                placeholder={
                                  platform.secondaryField?.placeholder ?? defaultLabelForType(platform.id)
                                }
                                type={secondaryInputType}
                                inputMode={platform.secondaryField?.inputMode}
                              />
                            </Field>

                            <div className="flex items-end justify-end gap-1">
                              <IconButton
                                label="Move up"
                                onClick={() => setState((s) => ({ ...s, items: moveItem(s.items, idx, idx - 1) }))}
                                disabled={idx === 0}
                              >
                                <ArrowUp aria-hidden />
                              </IconButton>
                              <IconButton
                                label="Move down"
                                onClick={() => setState((s) => ({ ...s, items: moveItem(s.items, idx, idx + 1) }))}
                                disabled={idx === state.items.length - 1}
                              >
                                <ArrowDown aria-hidden />
                              </IconButton>
                              <Button type="button" variant="outline" size="sm" onClick={() => toggleItemExpanded(idx)}>
                                {isExpanded ? "Less" : "More"}
                              </Button>
                              <IconButton
                                label="Remove item"
                                onClick={() =>
                                  setState((s) => ({
                                    ...s,
                                    items:
                                      s.items.length === 1 ? [{ ...DEFAULT_ITEM }] : s.items.filter((_, i) => i !== idx),
                                  }))
                                }
                              >
                                <Trash2 aria-hidden />
                              </IconButton>
                            </div>
                          </div>

                          {platform.note ? (
                            <div className="mt-2 text-xs text-muted-foreground">{platform.note}</div>
                          ) : null}

                          {isExpanded ? (
                            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                              {platform.secondaryField ? (
                                <Field label="Button label" hint="Optional override for the visible text">
                                  <TextInput
                                    value={item.label}
                                    onChange={(label) =>
                                      setState((s) => ({
                                        ...s,
                                        items: updateItemAt(s.items, idx, { ...item, label }),
                                      }))
                                    }
                                    placeholder={defaultLabelForType(platform.id)}
                                  />
                                </Field>
                              ) : null}

                              <Field label="Subtitle" hint="Small secondary text under the button label">
                                <TextInput
                                  value={item.subtitle}
                                  onChange={(subtitle) =>
                                    setState((s) => ({
                                      ...s,
                                      items: updateItemAt(s.items, idx, { ...item, subtitle }),
                                    }))
                                  }
                                  placeholder="Optional"
                                />
                              </Field>

                              {platform.supportsUrlOverride ? (
                                <Field label="Custom URL" hint="Only needed if your public profile URL is non-standard">
                                  <TextInput
                                    value={item.url}
                                    onChange={(url) =>
                                      setState((s) => ({
                                        ...s,
                                        items: updateItemAt(s.items, idx, { ...item, url }),
                                      }))
                                    }
                                    placeholder="https://example.com/your-profile"
                                    type="url"
                                    inputMode="url"
                                  />
                                </Field>
                              ) : null}

                              <div className="flex items-end">
                                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <input
                                    type="checkbox"
                                    className="size-4 rounded border-border bg-background align-middle accent-primary"
                                    checked={item.newTab}
                                    onChange={(e) =>
                                      setState((s) => ({
                                        ...s,
                                        items: updateItemAt(s.items, idx, { ...item, newTab: e.target.checked }),
                                      }))
                                    }
                                  />
                                  Open in a new tab
                                </label>
                              </div>
                            </div>
                          ) : null}
                        </>
                      )
                    })()}
                  </div>
                ))}

                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setState((s) => ({ ...s, items: [...s.items, { ...DEFAULT_ITEM }] }))}
                  >
                    <Plus aria-hidden />
                    Add item
                  </Button>
                </div>
              </div>
            </Section>

            <Section
              title="vCard"
              description="Build the downloadable contact card the way you would add a person to an address book."
            >
              <details open className="rounded-xl border border-border bg-background p-3">
                <summary className="cursor-pointer text-sm font-medium">Contact card basics</summary>
                <div className="mt-3 grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
                  <Field label="Full name" hint="Shown when someone saves this contact">
                    <TextInput
                      value={state.vcard.fn}
                      onChange={(fn) => setState((s) => ({ ...s, vcard: { ...s.vcard, fn } }))}
                      placeholder="Max Muster"
                    />
                  </Field>
                  <Field label="Nickname">
                    <TextInput
                      value={state.vcard.nicknames[0] ?? ""}
                      onChange={(nickname) =>
                        setState((s) => ({
                          ...s,
                          vcard: { ...s.vcard, nicknames: updateStringListValue(s.vcard.nicknames, 0, nickname) },
                        }))
                      }
                      placeholder="Optional"
                    />
                  </Field>
                  <Field label="Company">
                    <TextInput
                      value={state.vcard.org[0] ?? ""}
                      onChange={(company) =>
                        setState((s) => ({
                          ...s,
                          vcard: { ...s.vcard, org: updateStringListValue(s.vcard.org, 0, company) },
                        }))
                      }
                      placeholder="Acme AG"
                    />
                  </Field>
                  <Field label="Job title">
                    <TextInput
                      value={state.vcard.title}
                      onChange={(title) => setState((s) => ({ ...s, vcard: { ...s.vcard, title } }))}
                      placeholder="Engineer"
                    />
                  </Field>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  <Field label="First name">
                    <TextInput
                      value={state.vcard.nGiven}
                      onChange={(nGiven) => setState((s) => ({ ...s, vcard: { ...s.vcard, nGiven } }))}
                      placeholder="Max"
                    />
                  </Field>
                  <Field label="Middle name">
                    <TextInput
                      value={state.vcard.nAdditional}
                      onChange={(nAdditional) => setState((s) => ({ ...s, vcard: { ...s.vcard, nAdditional } }))}
                      placeholder="Optional"
                    />
                  </Field>
                  <Field label="Last name">
                    <TextInput
                      value={state.vcard.nFamily}
                      onChange={(nFamily) => setState((s) => ({ ...s, vcard: { ...s.vcard, nFamily } }))}
                      placeholder="Muster"
                    />
                  </Field>
                  <Field label="Prefix">
                    <TextInput
                      value={state.vcard.nPrefix}
                      onChange={(nPrefix) => setState((s) => ({ ...s, vcard: { ...s.vcard, nPrefix } }))}
                      placeholder="Dr."
                    />
                  </Field>
                  <Field label="Suffix">
                    <TextInput
                      value={state.vcard.nSuffix}
                      onChange={(nSuffix) => setState((s) => ({ ...s, vcard: { ...s.vcard, nSuffix } }))}
                      placeholder="Jr."
                    />
                  </Field>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                  <Field label="Team or department">
                    <TextInput
                      value={state.vcard.org[1] ?? ""}
                      onChange={(team) =>
                        setState((s) => ({
                          ...s,
                          vcard: { ...s.vcard, org: updateStringListValue(s.vcard.org, 1, team) },
                        }))
                      }
                      placeholder="Sales"
                    />
                  </Field>
                  <Field label="Role">
                    <TextInput
                      value={state.vcard.role}
                      onChange={(role) => setState((s) => ({ ...s, vcard: { ...s.vcard, role } }))}
                      placeholder="Optional"
                    />
                  </Field>
                  <Field label="Birthday">
                    <TextInput
                      value={state.vcard.bday}
                      onChange={(bday) => setState((s) => ({ ...s, vcard: { ...s.vcard, bday } }))}
                      placeholder="1990-01-01"
                    />
                  </Field>
                  <Field label="Anniversary">
                    <TextInput
                      value={state.vcard.anniversary}
                      onChange={(anniversary) =>
                        setState((s) => ({ ...s, vcard: { ...s.vcard, anniversary } }))
                      }
                      placeholder="2015-06-01"
                    />
                  </Field>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                      <ImagePreviewCard
                        title="Photo preview"
                        value={state.vcard.photoUri || state.profile.avatarUrl}
                        emptyLabel="No photo"
                      />
                      <div className="grid gap-3">
                        <Field
                          label="Contact photo"
                          hint="Upload an image from your computer or paste a normal image link."
                        >
                          <TextInput
                            value={state.vcard.photoUri}
                            onChange={(photoUri) =>
                              setState((s) => ({
                                ...s,
                                vcard: { ...s.vcard, photoUri, photoMediaType: "" },
                              }))
                            }
                            placeholder="https://example.com/photo.jpg"
                            inputMode="url"
                          />
                        </Field>
                        <div className="flex flex-wrap gap-2">
                          <Button asChild variant="outline" size="sm">
                            <label className="cursor-pointer">
                              <input
                                className="sr-only"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) void onVcardImageUpload("photo", file)
                                  e.currentTarget.value = ""
                                }}
                              />
                              <FileUp aria-hidden />
                              Upload photo
                            </label>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!state.profile.avatarUrl}
                            onClick={() =>
                              setState((s) => ({
                                ...s,
                                vcard: {
                                  ...s.vcard,
                                  photoUri: s.profile.avatarUrl || s.vcard.photoUri,
                                  photoMediaType: "",
                                },
                              }))
                            }
                          >
                            Use profile avatar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setState((s) => ({
                                ...s,
                                vcard: { ...s.vcard, photoUri: "", photoMediaType: "" },
                              }))
                            }
                          >
                            Remove photo
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                      <ImagePreviewCard title="Logo preview" value={state.vcard.logoUri} emptyLabel="No logo" />
                      <div className="grid gap-3">
                        <Field label="Company logo" hint="Optional. Upload a logo or paste an image link.">
                          <TextInput
                            value={state.vcard.logoUri}
                            onChange={(logoUri) =>
                              setState((s) => ({
                                ...s,
                                vcard: { ...s.vcard, logoUri, logoMediaType: "" },
                              }))
                            }
                            placeholder="https://example.com/logo.png"
                            inputMode="url"
                          />
                        </Field>
                        <div className="flex flex-wrap gap-2">
                          <Button asChild variant="outline" size="sm">
                            <label className="cursor-pointer">
                              <input
                                className="sr-only"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) void onVcardImageUpload("logo", file)
                                  e.currentTarget.value = ""
                                }}
                              />
                              <FileUp aria-hidden />
                              Upload logo
                            </label>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setState((s) => ({
                                ...s,
                                vcard: { ...s.vcard, logoUri: "", logoMediaType: "" },
                              }))
                            }
                          >
                            Remove logo
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <Field label="Time zone">
                    <TextInput
                      value={state.vcard.tz}
                      onChange={(tz) => setState((s) => ({ ...s, vcard: { ...s.vcard, tz } }))}
                      placeholder="Europe/Zurich"
                    />
                  </Field>
                  <Field label="Primary language">
                    <TextInput
                      value={state.vcard.languages[0] ?? ""}
                      onChange={(language) =>
                        setState((s) => ({
                          ...s,
                          vcard: { ...s.vcard, languages: updateStringListValue(s.vcard.languages, 0, language) },
                        }))
                      }
                      placeholder="en"
                    />
                  </Field>
                </div>

                <Field label="Note" hint="Short note shown in some contact apps">
                  <TextArea
                    value={state.vcard.note}
                    onChange={(note) => setState((s) => ({ ...s, vcard: { ...s.vcard, note } }))}
                    rows={3}
                    placeholder="Helpful context for this contact"
                  />
                </Field>
              </details>

              <details open className="rounded-xl border border-border bg-background p-3">
                <summary className="cursor-pointer text-sm font-medium">Ways to reach this person</summary>
                <div className="mt-3 grid gap-4">
                  <ListTyped
                    title="Email addresses"
                    valueLabel="Email address"
                    valuePlaceholder="you@example.com"
                    inputType="email"
                    inputMode="email"
                    values={state.vcard.emails}
                    typeOptions={[
                      { value: "", label: "Kind" },
                      { value: "home", label: "Home" },
                      { value: "work", label: "Work" },
                      { value: "other", label: "Other" },
                    ]}
                    onChange={(emails) => setState((s) => ({ ...s, vcard: { ...s.vcard, emails } }))}
                  />
                  <ListTyped
                    title="Phone numbers"
                    valueLabel="Phone number"
                    valuePlaceholder="+41 79 123 45 67"
                    inputMode="tel"
                    values={state.vcard.tels}
                    typeOptions={[
                      { value: "", label: "Kind" },
                      { value: "cell,voice", label: "Mobile" },
                      { value: "home,voice", label: "Home" },
                      { value: "work,voice", label: "Work" },
                      { value: "text", label: "Text only" },
                      { value: "fax", label: "Fax" },
                      { value: "pager", label: "Pager" },
                    ]}
                    onChange={(tels) => setState((s) => ({ ...s, vcard: { ...s.vcard, tels } }))}
                  />
                  <ListTyped
                    title="Websites and links"
                    valueLabel="Link"
                    valuePlaceholder="https://example.com"
                    inputType="url"
                    inputMode="url"
                    values={state.vcard.urls}
                    typeOptions={[
                      { value: "", label: "Kind" },
                      { value: "home", label: "Home" },
                      { value: "work", label: "Work" },
                      { value: "other", label: "Other" },
                    ]}
                    onChange={(urls) => setState((s) => ({ ...s, vcard: { ...s.vcard, urls } }))}
                  />
                </div>
              </details>

              <details className="rounded-xl border border-border bg-background p-3">
                <summary className="cursor-pointer text-sm font-medium">More vCard fields</summary>
                <div className="mt-3 grid gap-4">
                  <div className="grid gap-4 xl:grid-cols-3">
                    <Field label="Entry type" hint="Leave blank for a normal person">
                      <SelectInput
                        value={state.vcard.kind}
                        onChange={(kind) =>
                          setState((s) => ({
                            ...s,
                            vcard: { ...s.vcard, kind: kind as VCardDraft["kind"] },
                          }))
                        }
                      >
                        <option value="">Person</option>
                        <option value="individual">Individual</option>
                        <option value="org">Organization</option>
                        <option value="group">Group</option>
                        <option value="location">Location</option>
                      </SelectInput>
                    </Field>
                    <Field label="Stable ID" hint="Optional permanent identifier">
                      <TextInput
                        value={state.vcard.uid}
                        onChange={(uid) => setState((s) => ({ ...s, vcard: { ...s.vcard, uid } }))}
                        placeholder="urn:uuid:..."
                      />
                    </Field>
                    <Field label="Contact page URL" hint="Usually leave blank. If you set it, use the full URL of this page.">
                      <TextInput
                        value={state.vcard.source}
                        onChange={(source) => setState((s) => ({ ...s, vcard: { ...s.vcard, source } }))}
                        placeholder={state.publicUrl || "https://contact.example.com"}
                        type="url"
                        inputMode="url"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <ListStrings
                      title="More nicknames"
                      values={state.vcard.nicknames.slice(1).length ? state.vcard.nicknames.slice(1) : [""]}
                      onChange={(nicknames) =>
                        setState((s) => ({
                          ...s,
                          vcard: { ...s.vcard, nicknames: [s.vcard.nicknames[0] ?? "", ...nicknames] },
                        }))
                      }
                    />
                    <ListStrings
                      title="More organization parts"
                      values={state.vcard.org.slice(2).length ? state.vcard.org.slice(2) : [""]}
                      onChange={(org) =>
                        setState((s) => ({
                          ...s,
                          vcard: { ...s.vcard, org: [s.vcard.org[0] ?? "", s.vcard.org[1] ?? "", ...org] },
                        }))
                      }
                    />
                    <ListStrings
                      title="Categories"
                      values={state.vcard.categories}
                      onChange={(categories) => setState((s) => ({ ...s, vcard: { ...s.vcard, categories } }))}
                    />
                    <ListStrings
                      title="More languages"
                      values={state.vcard.languages.slice(1).length ? state.vcard.languages.slice(1) : [""]}
                      onChange={(languages) =>
                        setState((s) => ({
                          ...s,
                          vcard: { ...s.vcard, languages: [s.vcard.languages[0] ?? "", ...languages] },
                        }))
                      }
                    />
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <ListTyped
                      title="Extra messaging accounts"
                      valueLabel="Messaging link"
                      valuePlaceholder="xmpp:you@chat.example"
                      values={state.vcard.impps}
                      typeOptions={[
                        { value: "", label: "Kind" },
                        { value: "personal", label: "Personal" },
                        { value: "work", label: "Work" },
                        { value: "other", label: "Other" },
                      ]}
                      onChange={(impps) => setState((s) => ({ ...s, vcard: { ...s.vcard, impps } }))}
                    />
                    <div className="grid gap-4 rounded-xl border border-border bg-muted/20 p-3">
                      <div className="text-sm font-medium">Location coordinates</div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Latitude">
                          <TextInput
                            value={state.vcard.geoLat}
                            onChange={(geoLat) => setState((s) => ({ ...s, vcard: { ...s.vcard, geoLat } }))}
                            placeholder="47.3769"
                            inputMode="decimal"
                          />
                        </Field>
                        <Field label="Longitude">
                          <TextInput
                            value={state.vcard.geoLon}
                            onChange={(geoLon) => setState((s) => ({ ...s, vcard: { ...s.vcard, geoLon } }))}
                            placeholder="8.5417"
                            inputMode="decimal"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                </div>
              </details>

              <details open className="rounded-xl border border-border bg-background p-3">
                <summary className="cursor-pointer text-sm font-medium">Postal addresses</summary>
                <div className="mt-3 grid gap-3">
                  {state.vcard.addresses.map((addr, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <Field label="Street">
                            <TextInput
                              value={addr.street}
                              onChange={(street) =>
                                setState((s) => ({
                                  ...s,
                                  vcard: {
                                    ...s.vcard,
                                    addresses: s.vcard.addresses.map((a, i) => (i === idx ? { ...a, street } : a)),
                                  },
                                }))
                              }
                            />
                          </Field>
                          <Field label="City">
                            <TextInput
                              value={addr.locality}
                              onChange={(locality) =>
                                setState((s) => ({
                                  ...s,
                                  vcard: {
                                    ...s.vcard,
                                    addresses: s.vcard.addresses.map((a, i) => (i === idx ? { ...a, locality } : a)),
                                  },
                                }))
                              }
                            />
                          </Field>
                          <Field label="State or region">
                            <TextInput
                              value={addr.region}
                              onChange={(region) =>
                                setState((s) => ({
                                  ...s,
                                  vcard: {
                                    ...s.vcard,
                                    addresses: s.vcard.addresses.map((a, i) => (i === idx ? { ...a, region } : a)),
                                  },
                                }))
                              }
                            />
                          </Field>
                          <Field label="Postal code">
                            <TextInput
                              value={addr.postalCode}
                              onChange={(postalCode) =>
                                setState((s) => ({
                                  ...s,
                                  vcard: {
                                    ...s.vcard,
                                    addresses: s.vcard.addresses.map((a, i) => (i === idx ? { ...a, postalCode } : a)),
                                  },
                                }))
                              }
                            />
                          </Field>
                          <Field label="Country">
                            <TextInput
                              value={addr.country}
                              onChange={(country) =>
                                setState((s) => ({
                                  ...s,
                                  vcard: {
                                    ...s.vcard,
                                    addresses: s.vcard.addresses.map((a, i) => (i === idx ? { ...a, country } : a)),
                                  },
                                }))
                              }
                            />
                          </Field>
                          <Field label="PO box">
                            <TextInput
                              value={addr.pobox}
                              onChange={(pobox) =>
                                setState((s) => ({
                                  ...s,
                                  vcard: {
                                    ...s.vcard,
                                    addresses: s.vcard.addresses.map((a, i) => (i === idx ? { ...a, pobox } : a)),
                                  },
                                }))
                              }
                            />
                          </Field>
                          <Field label="Apartment / suite">
                            <TextInput
                              value={addr.extended}
                              onChange={(extended) =>
                                setState((s) => ({
                                  ...s,
                                  vcard: {
                                    ...s.vcard,
                                    addresses: s.vcard.addresses.map((a, i) => (i === idx ? { ...a, extended } : a)),
                                  },
                                }))
                              }
                            />
                          </Field>
                          <Field label="Label or note">
                            <TextInput
                              value={addr.label}
                              onChange={(label) =>
                                setState((s) => ({
                                  ...s,
                                  vcard: {
                                    ...s.vcard,
                                    addresses: s.vcard.addresses.map((a, i) => (i === idx ? { ...a, label } : a)),
                                  },
                                }))
                              }
                            />
                          </Field>
                          <Field label="Type" hint="Common vCard address type">
                            <SelectInput
                              value={addr.type}
                              onChange={(type) =>
                                setState((s) => ({
                                  ...s,
                                  vcard: {
                                    ...s.vcard,
                                    addresses: s.vcard.addresses.map((a, i) => (i === idx ? { ...a, type } : a)),
                                  },
                                }))
                              }
                            >
                              <option value="">Type</option>
                              <option value="home">Home</option>
                              <option value="work">Work</option>
                              <option value="other">Other</option>
                            </SelectInput>
                          </Field>
                          <Field label="Priority" hint="Preferred address in the contact card">
                            <SelectInput
                              value={addr.pref}
                              onChange={(pref) =>
                                setState((s) => ({
                                  ...s,
                                  vcard: {
                                    ...s.vcard,
                                    addresses: s.vcard.addresses.map((a, i) => (i === idx ? { ...a, pref } : a)),
                                  },
                                }))
                              }
                            >
                              <option value="">Priority</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                            </SelectInput>
                          </Field>
                        </div>
                        <IconButton
                          label="Remove address"
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              vcard: {
                                ...s.vcard,
                                addresses:
                                  s.vcard.addresses.length === 1
                                    ? [{ ...DEFAULT_ADDR }]
                                    : s.vcard.addresses.filter((_, i) => i !== idx),
                              },
                            }))
                          }
                        >
                          <Trash2 aria-hidden />
                        </IconButton>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        vcard: { ...s.vcard, addresses: [...s.vcard.addresses, { ...DEFAULT_ADDR }] },
                      }))
                    }
                  >
                    <Plus aria-hidden />
                    Add address
                  </Button>
                </div>
              </details>

              <details open className="rounded-xl border border-border bg-background p-3">
                <summary className="cursor-pointer text-sm font-medium">Images and security keys</summary>

                <div className="mt-4 grid gap-3">
                  <div className="text-sm font-medium">Security keys</div>
                  {state.vcard.keys.map((k, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <Field label="Public key link" hint="Paste a normal URL if you host a public key file">
                            <TextInput
                              value={k.uri}
                              onChange={(uri) =>
                                setState((s) => ({
                                  ...s,
                                  vcard: {
                                    ...s.vcard,
                                    keys: s.vcard.keys.map((x, i) => (i === idx ? { ...x, uri } : x)),
                                  },
                                }))
                              }
                              inputMode="url"
                            />
                          </Field>
                          <Field label="Inline key text" hint="Only if you want to store the key text directly">
                            <TextInput
                              value={k.text}
                              onChange={(text) =>
                                setState((s) => ({
                                  ...s,
                                  vcard: {
                                    ...s.vcard,
                                    keys: s.vcard.keys.map((x, i) => (i === idx ? { ...x, text } : x)),
                                  },
                                }))
                              }
                            />
                          </Field>
                          <Field label="File type" hint="Optional">
                            <TextInput
                              value={k.mediaType}
                              onChange={(mediaType) =>
                                setState((s) => ({
                                  ...s,
                                  vcard: {
                                    ...s.vcard,
                                    keys: s.vcard.keys.map((x, i) => (i === idx ? { ...x, mediaType } : x)),
                                  },
                                }))
                              }
                              placeholder="application/pgp-keys"
                            />
                          </Field>
                        </div>
                        <IconButton
                          label="Remove key"
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              vcard: {
                                ...s.vcard,
                                keys:
                                  s.vcard.keys.length === 1
                                    ? [{ ...DEFAULT_KEY }]
                                    : s.vcard.keys.filter((_, i) => i !== idx),
                              },
                            }))
                          }
                        >
                          <Trash2 aria-hidden />
                        </IconButton>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setState((s) => ({ ...s, vcard: { ...s.vcard, keys: [...s.vcard.keys, { ...DEFAULT_KEY }] } }))
                    }
                  >
                    <Plus aria-hidden />
                    Add key
                  </Button>
                </div>
              </details>

              <details open className="rounded-xl border border-border bg-background p-3">
                <summary className="cursor-pointer text-sm font-medium">Calendar and extras</summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Calendar link" hint="Optional webcal:// link">
                    <TextInput
                      value={state.vcard.calUri}
                      onChange={(calUri) => setState((s) => ({ ...s, vcard: { ...s.vcard, calUri } }))}
                      placeholder="webcal://example.com/calendar.ics"
                    />
                  </Field>
                  <Field label="Calendar email" hint="Optional mailto: address">
                    <TextInput
                      value={state.vcard.calAdrUri}
                      onChange={(calAdrUri) => setState((s) => ({ ...s, vcard: { ...s.vcard, calAdrUri } }))}
                      placeholder="mailto:calendar@example.com"
                    />
                  </Field>
                  <Field label="Free/busy link" hint="Optional">
                    <TextInput
                      value={state.vcard.fbUrl}
                      onChange={(fbUrl) => setState((s) => ({ ...s, vcard: { ...s.vcard, fbUrl } }))}
                      inputMode="url"
                    />
                  </Field>
                  <Field label="Product ID" hint="Optional">
                    <TextInput
                      value={state.vcard.prodId}
                      onChange={(prodId) => setState((s) => ({ ...s, vcard: { ...s.vcard, prodId } }))}
                      placeholder="-//contact-card//EN"
                    />
                  </Field>
                </div>
              </details>
            </Section>
        </div>
      </div>
    </main>
  )
}

function ListStrings({
  title,
  values,
  onChange,
}: {
  title: string
  values: string[]
  onChange: (values: string[]) => void
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">{title}</div>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...values, ""])}>
          <Plus aria-hidden />
          Add
        </Button>
      </div>
      <div className="mt-3 grid gap-2">
        {values.map((v, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={v}
              onChange={(e) => onChange(values.map((x, i) => (i === idx ? e.target.value : x)))}
              placeholder="(optional)"
            />
            <IconButton
              label="Remove"
              onClick={() => onChange(values.length === 1 ? [""] : values.filter((_, i) => i !== idx))}
            >
              <Trash2 aria-hidden />
            </IconButton>
          </div>
        ))}
      </div>
    </div>
  )
}

function ListTyped({
  title,
  values,
  typeOptions,
  valueLabel,
  valuePlaceholder,
  inputType = "text",
  inputMode,
  onChange,
}: {
  title: string
  values: VCardTypedValueDraft[]
  typeOptions: Array<{ value: string; label: string }>
  valueLabel: string
  valuePlaceholder: string
  inputType?: React.HTMLInputTypeAttribute
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  onChange: (values: VCardTypedValueDraft[]) => void
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">{title}</div>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...values, { ...DEFAULT_TYPED }])}>
          <Plus aria-hidden />
          Add
        </Button>
      </div>
      <div className="mt-3 grid gap-3">
        {values.map((entry, idx) => (
          <div key={idx} className="rounded-xl border border-border bg-background p-3">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_180px_minmax(0,1fr)_auto] lg:items-end">
              <Field label={valueLabel}>
                <TextInput
                  value={entry.value}
                  onChange={(value) => onChange(values.map((x, i) => (i === idx ? { ...x, value } : x)))}
                  placeholder={valuePlaceholder}
                  type={inputType}
                  inputMode={inputMode}
                />
              </Field>
              <Field label="Type">
                <SelectInput
                  value={entry.type}
                  onChange={(type) => onChange(values.map((x, i) => (i === idx ? { ...x, type } : x)))}
                >
                  {typeOptions.map((option) => (
                    <option key={option.value || "blank"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Label">
                <TextInput
                  value={entry.label}
                  onChange={(label) => onChange(values.map((x, i) => (i === idx ? { ...x, label } : x)))}
                  placeholder="Optional note"
                />
              </Field>
              <div className="flex items-end justify-end gap-2">
                <Button
                  type="button"
                  variant={entry.pref === "1" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() =>
                    onChange(values.map((x, i) => (i === idx ? { ...x, pref: x.pref === "1" ? "" : "1" } : x)))
                  }
                >
                  {entry.pref === "1" ? "Primary" : "Set primary"}
                </Button>
                <IconButton
                  label="Remove"
                  onClick={() =>
                    onChange(values.length === 1 ? [{ ...DEFAULT_TYPED }] : values.filter((_, i) => i !== idx))
                  }
                >
                  <Trash2 aria-hidden />
                </IconButton>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

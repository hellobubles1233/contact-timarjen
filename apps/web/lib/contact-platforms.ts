export type PlatformId =
  | "email"
  | "phone"
  | "sms"
  | "whatsapp"
  | "telegram"
  | "signal"
  | "discord"
  | "matrix"
  | "github"
  | "gitlab"
  | "codepen"
  | "devto"
  | "keybase"
  | "linkedin"
  | "x"
  | "instagram"
  | "threads"
  | "tiktok"
  | "snapchat"
  | "reddit"
  | "bluesky"
  | "mastodon"
  | "youtube"
  | "twitch"
  | "behance"
  | "dribbble"
  | "medium"
  | "pinterest"
  | "substack"
  | "patreon"
  | "kofi"
  | "buymeacoffee"
  | "facebook"
  | "steam"
  | "spotify"
  | "website"
  | "calendar"
  | "location"
  | "link"
  | "copy"

export type ContactIcon = PlatformId | "download"
export type PlatformCategory = "Direct" | "Social" | "Developer" | "Creator" | "General"
export type PlatformFieldKey = "value" | "extra"
export type PlatformFieldInputMode = "text" | "email" | "tel" | "url" | "numeric"

export type PlatformLinkInput = {
  value?: string
  extra?: string
  url?: string
}

export type PlatformField = {
  key: PlatformFieldKey
  label: string
  placeholder: string
  inputMode?: PlatformFieldInputMode
}

export type ContactPlatformDefinition = {
  id: PlatformId
  label: string
  category: PlatformCategory
  icon: ContactIcon
  envBase: string
  primaryEnvSuffix?: string
  secondaryEnvSuffix?: string
  primaryField: PlatformField
  secondaryField?: PlatformField
  defaultNewTab: boolean
  supportsUrlOverride?: boolean
  note?: string
  legacyPrimaryBases?: string[]
  legacySecondaryBases?: string[]
  legacyUrlBases?: string[]
  buildHref: (input: PlatformLinkInput) => string | undefined
}

function safeUrl(input: string) {
  try {
    return new URL(input)
  } catch {
    return undefined
  }
}

function pathSegments(input: string) {
  const fromUrl = safeUrl(input)
  const pathname = fromUrl ? fromUrl.pathname : input
  return pathname
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
}

function lastPathSegment(input: string) {
  const segments = pathSegments(input)
  return segments.at(-1) ?? ""
}

function normalizeTel(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/[^0-9]/g, "")}`
  }
  return trimmed.replace(/[^0-9+]/g, "")
}

function normalizeHandle(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  const segment = trimmed.startsWith("http://") || trimmed.startsWith("https://") ? lastPathSegment(trimmed) : trimmed
  return segment.replace(/^@+/, "").replace(/^\/+|\/+$/g, "")
}

function normalizeLinkedInSlug(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  const segments = pathSegments(trimmed)
  if (segments[0] === "in" || segments[0] === "company" || segments[0] === "school") {
    return segments[1] ?? ""
  }
  return normalizeHandle(trimmed)
}

function normalizeDiscordUserId(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  const segments = pathSegments(trimmed)
  const fromUrl = segments[0] === "users" ? segments[1] : undefined
  return (fromUrl ?? trimmed).replace(/[^0-9]/g, "")
}

function normalizeYoutubeHandle(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  const segments = pathSegments(trimmed)
  const segment = segments.find((part) => part.startsWith("@")) ?? trimmed
  const handle = segment.replace(/^@+/, "").replace(/^\/+|\/+$/g, "")
  return handle ? `@${handle}` : ""
}

function normalizeBlueskyHandle(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  const segments = pathSegments(trimmed)
  const fromUrl = segments[0] === "profile" ? segments[1] : undefined
  return (fromUrl ?? trimmed).replace(/^@+/, "").replace(/^\/+|\/+$/g, "")
}

function normalizeMatrixId(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const parsed = safeUrl(trimmed)
    const hash = parsed?.hash.replace(/^#\/?/, "")
    return decodeURIComponent(hash ?? "")
  }
  return trimmed
}

function normalizeMastodonParts(value: string, extra?: string) {
  const rawValue = value.trim()
  const rawExtra = extra?.trim() ?? ""

  if (rawValue.startsWith("http://") || rawValue.startsWith("https://")) {
    const parsed = safeUrl(rawValue)
    const segments = pathSegments(rawValue)
    const usernameSegment = segments.find((part) => part.startsWith("@"))
    const username = usernameSegment?.replace(/^@+/, "") ?? ""
    const server = parsed?.host ?? ""
    return { username, server }
  }

  const match = rawValue.match(/^@?([^@/\s]+)@([^@/\s]+)$/)
  if (match) {
    return { username: match[1] ?? "", server: match[2] ?? "" }
  }

  return {
    username: rawValue.replace(/^@+/, ""),
    server: rawExtra.replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
  }
}

function externalUrl(value: string | undefined, fallback?: string) {
  const candidate = value?.trim() || fallback?.trim() || ""
  return candidate || undefined
}

function buildExternalFromHandle(prefix: string, value: string, suffix = "") {
  const handle = normalizeHandle(value)
  return handle ? `${prefix}${handle}${suffix}` : undefined
}

export const CONTACT_PLATFORMS: ContactPlatformDefinition[] = [
  {
    id: "email",
    label: "Email",
    category: "Direct",
    icon: "email",
    envBase: "EMAIL",
    primaryField: { key: "value", label: "Email address", placeholder: "you@example.com", inputMode: "email" },
    defaultNewTab: false,
    buildHref: ({ value }) => (value?.trim() ? `mailto:${value.trim()}` : undefined),
  },
  {
    id: "phone",
    label: "Phone",
    category: "Direct",
    icon: "phone",
    envBase: "PHONE",
    primaryField: { key: "value", label: "Phone number", placeholder: "+41 79 123 45 67", inputMode: "tel" },
    defaultNewTab: false,
    buildHref: ({ value }) => {
      const tel = normalizeTel(value ?? "")
      return tel ? `tel:${tel}` : undefined
    },
  },
  {
    id: "sms",
    label: "SMS",
    category: "Direct",
    icon: "sms",
    envBase: "SMS",
    primaryField: { key: "value", label: "Phone number", placeholder: "+41 79 123 45 67", inputMode: "tel" },
    defaultNewTab: false,
    buildHref: ({ value }) => {
      const tel = normalizeTel(value ?? "")
      return tel ? `sms:${tel}` : undefined
    },
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    category: "Direct",
    icon: "whatsapp",
    envBase: "WHATSAPP",
    primaryField: { key: "value", label: "Phone number", placeholder: "+41 79 123 45 67", inputMode: "tel" },
    defaultNewTab: true,
    buildHref: ({ value }) => {
      const tel = normalizeTel(value ?? "")
      return tel ? `https://wa.me/${tel.replace(/\+/g, "")}` : undefined
    },
  },
  {
    id: "telegram",
    label: "Telegram",
    category: "Direct",
    icon: "telegram",
    envBase: "TELEGRAM",
    primaryField: { key: "value", label: "Username", placeholder: "username" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    note: "Use the Telegram username, not the phone number.",
    buildHref: ({ value, url }) => externalUrl(url, buildExternalFromHandle("https://t.me/", value ?? "")),
  },
  {
    id: "signal",
    label: "Signal",
    category: "Direct",
    icon: "signal",
    envBase: "SIGNAL",
    primaryField: { key: "value", label: "Phone number", placeholder: "+41 79 123 45 67", inputMode: "tel" },
    defaultNewTab: true,
    buildHref: ({ value }) => {
      const tel = normalizeTel(value ?? "")
      return tel ? `https://signal.me/#p/${encodeURIComponent(tel)}` : undefined
    },
  },
  {
    id: "discord",
    label: "Discord",
    category: "Direct",
    icon: "discord",
    envBase: "DISCORD",
    primaryEnvSuffix: "USER_ID",
    primaryField: { key: "value", label: "User ID", placeholder: "619189279423201317", inputMode: "numeric" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    note: "Use the numeric Discord user ID, not the username.",
    legacyPrimaryBases: ["DISCORD"],
    buildHref: ({ value, url }) => {
      const userId = normalizeDiscordUserId(value ?? "")
      return externalUrl(url, userId ? `https://discord.com/users/${userId}` : undefined)
    },
  },
  {
    id: "matrix",
    label: "Matrix",
    category: "Direct",
    icon: "matrix",
    envBase: "MATRIX",
    primaryEnvSuffix: "ID",
    primaryField: { key: "value", label: "Matrix ID", placeholder: "@user:matrix.org" },
    defaultNewTab: true,
    note: "Use the full Matrix ID.",
    buildHref: ({ value, url }) => {
      const matrixId = normalizeMatrixId(value ?? "")
      return externalUrl(url, matrixId ? `https://matrix.to/#/${encodeURIComponent(matrixId)}` : undefined)
    },
  },
  {
    id: "github",
    label: "GitHub",
    category: "Developer",
    icon: "github",
    envBase: "GITHUB",
    primaryField: { key: "value", label: "Username", placeholder: "octocat" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    buildHref: ({ value, url }) => externalUrl(url, buildExternalFromHandle("https://github.com/", value ?? "")),
  },
  {
    id: "gitlab",
    label: "GitLab",
    category: "Developer",
    icon: "gitlab",
    envBase: "GITLAB",
    primaryField: { key: "value", label: "Username", placeholder: "gitlab-user" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    buildHref: ({ value, url }) => externalUrl(url, buildExternalFromHandle("https://gitlab.com/", value ?? "")),
  },
  {
    id: "codepen",
    label: "CodePen",
    category: "Developer",
    icon: "codepen",
    envBase: "CODEPEN",
    primaryField: { key: "value", label: "Username", placeholder: "yourname" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    buildHref: ({ value, url }) => externalUrl(url, buildExternalFromHandle("https://codepen.io/", value ?? "")),
  },
  {
    id: "devto",
    label: "DEV",
    category: "Developer",
    icon: "devto",
    envBase: "DEVTO",
    primaryField: { key: "value", label: "Username", placeholder: "dev-user" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    legacyPrimaryBases: ["DEV_TO"],
    buildHref: ({ value, url }) => externalUrl(url, buildExternalFromHandle("https://dev.to/", value ?? "")),
  },
  {
    id: "keybase",
    label: "Keybase",
    category: "Developer",
    icon: "keybase",
    envBase: "KEYBASE",
    primaryField: { key: "value", label: "Username", placeholder: "keybaseuser" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    buildHref: ({ value, url }) => externalUrl(url, buildExternalFromHandle("https://keybase.io/", value ?? "")),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    category: "Social",
    icon: "linkedin",
    envBase: "LINKEDIN",
    primaryField: { key: "value", label: "Profile slug", placeholder: "tim-luginbuhl" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    note: "Use the public profile slug from linkedin.com/in/...",
    buildHref: ({ value, url }) => {
      const slug = normalizeLinkedInSlug(value ?? "")
      return externalUrl(url, slug ? `https://www.linkedin.com/in/${slug}` : undefined)
    },
  },
  {
    id: "x",
    label: "X",
    category: "Social",
    icon: "x",
    envBase: "X",
    primaryField: { key: "value", label: "Username", placeholder: "yourname" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    buildHref: ({ value, url }) => externalUrl(url, buildExternalFromHandle("https://x.com/", value ?? "")),
  },
  {
    id: "instagram",
    label: "Instagram",
    category: "Social",
    icon: "instagram",
    envBase: "INSTAGRAM",
    primaryField: { key: "value", label: "Username", placeholder: "yourname" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    buildHref: ({ value, url }) =>
      externalUrl(url, buildExternalFromHandle("https://www.instagram.com/", value ?? "", "/")),
  },
  {
    id: "threads",
    label: "Threads",
    category: "Social",
    icon: "threads",
    envBase: "THREADS",
    primaryField: { key: "value", label: "Username", placeholder: "yourname" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    buildHref: ({ value, url }) => {
      const username = normalizeHandle(value ?? "")
      return externalUrl(url, username ? `https://www.threads.net/@${username}` : undefined)
    },
  },
  {
    id: "tiktok",
    label: "TikTok",
    category: "Social",
    icon: "tiktok",
    envBase: "TIKTOK",
    primaryField: { key: "value", label: "Username", placeholder: "yourname" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    buildHref: ({ value, url }) => {
      const username = normalizeHandle(value ?? "")
      return externalUrl(url, username ? `https://www.tiktok.com/@${username}` : undefined)
    },
  },
  {
    id: "snapchat",
    label: "Snapchat",
    category: "Social",
    icon: "snapchat",
    envBase: "SNAPCHAT",
    primaryField: { key: "value", label: "Username", placeholder: "yourname" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    buildHref: ({ value, url }) =>
      externalUrl(url, buildExternalFromHandle("https://www.snapchat.com/add/", value ?? "")),
  },
  {
    id: "reddit",
    label: "Reddit",
    category: "Social",
    icon: "reddit",
    envBase: "REDDIT",
    primaryField: { key: "value", label: "Username", placeholder: "yourname" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    buildHref: ({ value, url }) =>
      externalUrl(url, buildExternalFromHandle("https://www.reddit.com/user/", value ?? "", "/")),
  },
  {
    id: "bluesky",
    label: "Bluesky",
    category: "Social",
    icon: "bluesky",
    envBase: "BLUESKY",
    primaryField: { key: "value", label: "Handle", placeholder: "you.bsky.social" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    note: "Use the full Bluesky handle, usually name.bsky.social.",
    buildHref: ({ value, url }) => {
      const handle = normalizeBlueskyHandle(value ?? "")
      return externalUrl(url, handle ? `https://bsky.app/profile/${handle}` : undefined)
    },
  },
  {
    id: "mastodon",
    label: "Mastodon",
    category: "Social",
    icon: "mastodon",
    envBase: "MASTODON",
    primaryEnvSuffix: "USERNAME",
    secondaryEnvSuffix: "SERVER",
    primaryField: { key: "value", label: "Username", placeholder: "alice" },
    secondaryField: { key: "extra", label: "Server", placeholder: "mastodon.social" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    note: "Use username and server, for example alice on mastodon.social.",
    legacyPrimaryBases: ["MASTODON"],
    buildHref: ({ value, extra, url }) => {
      const parts = normalizeMastodonParts(value ?? "", extra)
      return externalUrl(
        url,
        parts.username && parts.server ? `https://${parts.server}/@${parts.username}` : undefined
      )
    },
  },
  {
    id: "youtube",
    label: "YouTube",
    category: "Creator",
    icon: "youtube",
    envBase: "YOUTUBE",
    primaryField: { key: "value", label: "Handle", placeholder: "@channelname" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    note: "Use the public @handle if the channel has one.",
    buildHref: ({ value, url }) => {
      const handle = normalizeYoutubeHandle(value ?? "")
      return externalUrl(url, handle ? `https://www.youtube.com/${handle}` : undefined)
    },
  },
  {
    id: "twitch",
    label: "Twitch",
    category: "Creator",
    icon: "twitch",
    envBase: "TWITCH",
    primaryField: { key: "value", label: "Username", placeholder: "streamername" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    buildHref: ({ value, url }) => externalUrl(url, buildExternalFromHandle("https://www.twitch.tv/", value ?? "")),
  },
  {
    id: "behance",
    label: "Behance",
    category: "Creator",
    icon: "behance",
    envBase: "BEHANCE",
    primaryField: { key: "value", label: "Username", placeholder: "designname" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    buildHref: ({ value, url }) => externalUrl(url, buildExternalFromHandle("https://www.behance.net/", value ?? "")),
  },
  {
    id: "dribbble",
    label: "Dribbble",
    category: "Creator",
    icon: "dribbble",
    envBase: "DRIBBBLE",
    primaryField: { key: "value", label: "Username", placeholder: "designername" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    buildHref: ({ value, url }) => externalUrl(url, buildExternalFromHandle("https://dribbble.com/", value ?? "")),
  },
  {
    id: "medium",
    label: "Medium",
    category: "Creator",
    icon: "medium",
    envBase: "MEDIUM",
    primaryField: { key: "value", label: "Username", placeholder: "writername" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    buildHref: ({ value, url }) => {
      const username = normalizeHandle(value ?? "")
      return externalUrl(url, username ? `https://medium.com/@${username}` : undefined)
    },
  },
  {
    id: "pinterest",
    label: "Pinterest",
    category: "Creator",
    icon: "pinterest",
    envBase: "PINTEREST",
    primaryField: { key: "value", label: "Username", placeholder: "pinname" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    buildHref: ({ value, url }) => externalUrl(url, buildExternalFromHandle("https://www.pinterest.com/", value ?? "")),
  },
  {
    id: "substack",
    label: "Substack",
    category: "Creator",
    icon: "substack",
    envBase: "SUBSTACK",
    primaryEnvSuffix: "SUBDOMAIN",
    primaryField: { key: "value", label: "Subdomain", placeholder: "newslettername" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    note: "Use the Substack subdomain, not the full URL.",
    buildHref: ({ value, url }) => {
      const subdomain = normalizeHandle(value ?? "")
      return externalUrl(url, subdomain ? `https://${subdomain}.substack.com` : undefined)
    },
  },
  {
    id: "patreon",
    label: "Patreon",
    category: "Creator",
    icon: "patreon",
    envBase: "PATREON",
    primaryField: { key: "value", label: "Username", placeholder: "creatorname" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    buildHref: ({ value, url }) => externalUrl(url, buildExternalFromHandle("https://www.patreon.com/", value ?? "")),
  },
  {
    id: "kofi",
    label: "Ko-fi",
    category: "Creator",
    icon: "kofi",
    envBase: "KOFI",
    primaryField: { key: "value", label: "Username", placeholder: "coffeename" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    legacyPrimaryBases: ["KOFI", "KO_FI"],
    buildHref: ({ value, url }) => externalUrl(url, buildExternalFromHandle("https://ko-fi.com/", value ?? "")),
  },
  {
    id: "buymeacoffee",
    label: "Buy Me a Coffee",
    category: "Creator",
    icon: "buymeacoffee",
    envBase: "BUYMEACOFFEE",
    primaryField: { key: "value", label: "Username", placeholder: "coffeename" },
    defaultNewTab: true,
    supportsUrlOverride: true,
    legacyPrimaryBases: ["BUYMEACOFFEE", "BUY_ME_A_COFFEE"],
    buildHref: ({ value, url }) =>
      externalUrl(url, buildExternalFromHandle("https://buymeacoffee.com/", value ?? "")),
  },
  {
    id: "facebook",
    label: "Facebook",
    category: "Social",
    icon: "facebook",
    envBase: "FACEBOOK",
    primaryField: { key: "value", label: "Profile URL", placeholder: "https://www.facebook.com/yourprofile", inputMode: "url" },
    defaultNewTab: true,
    buildHref: ({ value, url }) => externalUrl(url, value),
  },
  {
    id: "steam",
    label: "Steam",
    category: "Social",
    icon: "steam",
    envBase: "STEAM",
    primaryField: { key: "value", label: "Profile URL", placeholder: "https://steamcommunity.com/id/yourname", inputMode: "url" },
    defaultNewTab: true,
    buildHref: ({ value, url }) => externalUrl(url, value),
  },
  {
    id: "spotify",
    label: "Spotify",
    category: "Creator",
    icon: "spotify",
    envBase: "SPOTIFY",
    primaryField: { key: "value", label: "Profile URL", placeholder: "https://open.spotify.com/user/...", inputMode: "url" },
    defaultNewTab: true,
    buildHref: ({ value, url }) => externalUrl(url, value),
  },
  {
    id: "website",
    label: "Website",
    category: "General",
    icon: "website",
    envBase: "WEBSITE",
    primaryField: { key: "value", label: "URL", placeholder: "https://example.com", inputMode: "url" },
    defaultNewTab: true,
    buildHref: ({ value, url }) => externalUrl(url, value),
  },
  {
    id: "calendar",
    label: "Calendar",
    category: "General",
    icon: "calendar",
    envBase: "CALENDAR",
    primaryField: { key: "value", label: "Calendar URL", placeholder: "https://cal.com/you", inputMode: "url" },
    defaultNewTab: true,
    buildHref: ({ value, url }) => externalUrl(url, value),
  },
  {
    id: "location",
    label: "Location",
    category: "General",
    icon: "location",
    envBase: "LOCATION",
    primaryField: { key: "value", label: "Map URL", placeholder: "https://maps.google.com/...", inputMode: "url" },
    defaultNewTab: true,
    buildHref: ({ value, url }) => externalUrl(url, value),
  },
  {
    id: "link",
    label: "Custom link",
    category: "General",
    icon: "link",
    envBase: "LINK",
    primaryField: { key: "value", label: "URL", placeholder: "https://example.com", inputMode: "url" },
    defaultNewTab: true,
    buildHref: ({ value, url }) => externalUrl(url, value),
  },
  {
    id: "copy",
    label: "Copy only",
    category: "General",
    icon: "copy",
    envBase: "COPY",
    primaryField: { key: "value", label: "Value", placeholder: "Any text you want people to copy" },
    defaultNewTab: false,
    buildHref: () => undefined,
  },
]

export const CONTACT_PLATFORMS_BY_ID = Object.fromEntries(
  CONTACT_PLATFORMS.map((platform) => [platform.id, platform])
) as Record<PlatformId, ContactPlatformDefinition>

export function getPlatformDefinition(type: string) {
  return CONTACT_PLATFORMS.find((platform) => platform.id === type)
}

export function defaultLabelForType(type: string) {
  return getPlatformDefinition(type)?.label ?? (type ? type.slice(0, 1).toUpperCase() + type.slice(1) : "")
}

export function buildPlatformLink(type: string, input: PlatformLinkInput) {
  const platform = getPlatformDefinition(type)
  if (!platform) {
    return {
      href: input.url?.trim() || input.value?.trim() || undefined,
      value: input.value?.trim() || undefined,
      icon: "link" as ContactIcon,
      newTab: true,
    }
  }

  const href = platform.buildHref(input)
  return {
    href,
    value: input.value?.trim() || undefined,
    icon: platform.icon,
    newTab: platform.defaultNewTab,
  }
}

export function platformEnvRoot(base: string, index: number) {
  return index === 0 ? base : `${base}_${index + 1}`
}

export function platformEnvKey(base: string, index: number, suffix?: string) {
  const root = platformEnvRoot(base, index)
  return suffix ? `${root}_${suffix}` : root
}

export function platformPrimaryEnvKey(platform: ContactPlatformDefinition, index: number) {
  return platformEnvKey(platform.envBase, index, platform.primaryEnvSuffix)
}

export function platformSecondaryEnvKey(platform: ContactPlatformDefinition, index: number) {
  return platform.secondaryEnvSuffix ? platformEnvKey(platform.envBase, index, platform.secondaryEnvSuffix) : undefined
}

export function platformUrlEnvKey(platform: ContactPlatformDefinition, index: number) {
  return platformEnvKey(platform.envBase, index, "URL")
}

export function platformMetaEnvKey(platform: ContactPlatformDefinition, index: number, suffix: string) {
  return platformEnvKey(platform.envBase, index, suffix)
}

export function platformOptionGroups() {
  const groups = new Map<PlatformCategory, ContactPlatformDefinition[]>()
  for (const platform of CONTACT_PLATFORMS) {
    const existing = groups.get(platform.category) ?? []
    existing.push(platform)
    groups.set(platform.category, existing)
  }
  return Array.from(groups.entries())
}

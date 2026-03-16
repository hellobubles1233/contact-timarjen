import {
  AtSign,
  Calendar,
  Code2,
  Coffee,
  Copy,
  Download,
  Gamepad2,
  Github,
  Gitlab,
  Globe,
  Instagram,
  Link as LinkIcon,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Music,
  Palette,
  Phone,
  Send,
  Twitch,
  X,
  Youtube,
} from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

import type { ContactIcon } from "@/lib/contact-platforms"

export function ContactIconGlyph({ name, className }: { name?: ContactIcon; className?: string }) {
  const props = { className: cn("size-4 shrink-0 text-muted-foreground", className), "aria-hidden": true }

  switch (name) {
    case "email":
      return <Mail {...props} />
    case "phone":
      return <Phone {...props} />
    case "sms":
      return <MessageSquare {...props} />
    case "whatsapp":
    case "signal":
    case "discord":
    case "matrix":
    case "snapchat":
      return <MessageCircle {...props} />
    case "telegram":
      return <Send {...props} />
    case "github":
      return <Github {...props} />
    case "gitlab":
      return <Gitlab {...props} />
    case "linkedin":
      return <Linkedin {...props} />
    case "x":
      return <X {...props} />
    case "instagram":
      return <Instagram {...props} />
    case "youtube":
      return <Youtube {...props} />
    case "twitch":
      return <Twitch {...props} />
    case "website":
      return <Globe {...props} />
    case "calendar":
      return <Calendar {...props} />
    case "location":
      return <MapPin {...props} />
    case "copy":
      return <Copy {...props} />
    case "download":
      return <Download {...props} />
    case "codepen":
    case "devto":
    case "keybase":
      return <Code2 {...props} />
    case "behance":
    case "dribbble":
    case "pinterest":
      return <Palette {...props} />
    case "medium":
    case "substack":
      return <AtSign {...props} />
    case "patreon":
    case "kofi":
    case "buymeacoffee":
      return <Coffee {...props} />
    case "steam":
      return <Gamepad2 {...props} />
    case "spotify":
      return <Music {...props} />
    case "reddit":
    case "bluesky":
    case "mastodon":
    case "threads":
    case "tiktok":
    case "facebook":
    case "link":
    default:
      return <LinkIcon {...props} />
  }
}

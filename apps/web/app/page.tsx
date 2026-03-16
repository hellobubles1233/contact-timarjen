import { Button } from "@workspace/ui/components/button"
import {
  ArrowUpRight,
  ChevronRight,
  Shield,
} from "lucide-react"

import { ContactIconGlyph } from "@/components/contact-icon"
import { ShareSheet } from "@/components/share-sheet"
import { CopyValueItem } from "@/components/copy-value-item"
import { getContactConfig } from "@/lib/contact-config"
import { getBaseUrl } from "@/lib/base-url"
import { qrToSvg } from "@/lib/qr"

export default async function Page() {
  const { config, diagnostics } = getContactConfig()
  const baseUrl = await getBaseUrl()
  const siteUrl = baseUrl || ""
  const vcardUrl = baseUrl ? `${baseUrl}/vcard.vcf` : ""

  const [siteQrSvg, vcardQrSvg] =
    diagnostics.isSecretsRendered && siteUrl && vcardUrl
      ? await Promise.all([qrToSvg(siteUrl), qrToSvg(vcardUrl)])
      : ["", ""]

  const initials = config.profile.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")

  return (
    <main className="relative min-h-svh px-4 py-10 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_40%_at_50%_0%,color-mix(in_oklch,var(--color-primary)_18%,transparent),transparent_65%)]"
      />

      <div className="mx-auto w-full max-w-md">
        <div className="mb-4 flex justify-end">
          <Button asChild variant="ghost" size="sm" className="rounded-full text-xs text-muted-foreground">
            <a
              href="https://github.com/hellobubles1233/contact-timarjen"
              target="_blank"
              rel="noreferrer noopener"
            >
              Steal this page
              <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
          </Button>
        </div>

        <header className="flex flex-col items-center text-center">
          <div className="relative size-24 overflow-hidden rounded-full border border-border bg-muted shadow-sm">
            {config.profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.profile.avatarUrl}
                alt={config.profile.displayName}
                className="size-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-xl font-semibold text-muted-foreground">
                {initials || "?"}
              </div>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">{config.profile.displayName}</h1>
          {config.profile.headline ? (
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">{config.profile.headline}</p>
          ) : null}
          {config.profile.bio ? (
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">{config.profile.bio}</p>
          ) : null}
        </header>

        <section className="mt-7 flex flex-col gap-2">
          {config.items.length ? (
            config.items.map((item) => {
              if (!item.href) {
                return (
                  <CopyValueItem
                    key={item.id}
                    label={item.label}
                    value={item.value ?? ""}
                    subtitle={item.subtitle}
                    className="bg-card/70 backdrop-blur"
                  />
                )
              }

              const isExternal = !!item.newTab
              const RightIcon = isExternal ? ArrowUpRight : ChevronRight
              const href = item.href

              return (
                <Button
                  key={item.id}
                  asChild
                  variant="outline"
                  className="h-auto w-full justify-between gap-3 rounded-2xl bg-card/70 px-4 py-3 backdrop-blur hover:bg-card/80"
                >
                  <a
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noreferrer noopener" : undefined}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-xl bg-muted">
                        <ContactIconGlyph name={item.icon} className="text-foreground/70" />
                      </span>
                      <span className="min-w-0 text-left">
                        <span className="block truncate text-sm font-medium">{item.label}</span>
                        {item.subtitle ? (
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {item.subtitle}
                          </span>
                        ) : null}
                      </span>
                    </span>

                    <span className="flex items-center gap-2 text-muted-foreground">
                      <RightIcon className="size-4" aria-hidden />
                    </span>
                  </a>
                </Button>
              )
            })
          ) : (
            <div className="rounded-2xl border border-border bg-card/70 p-4 text-sm text-muted-foreground backdrop-blur">
              <div className="flex items-center gap-2 text-foreground">
                <Shield className="size-4 text-muted-foreground" aria-hidden />
                <div className="text-sm font-medium">Private contact card</div>
              </div>
              <p className="mt-2">
                Contact details are loaded from environment variables and hidden by default in development.
              </p>
              {diagnostics.errors.length ? (
                <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  {diagnostics.errors.map((e) => (
                    <div key={e}>{e}</div>
                  ))}
                </div>
              ) : null}
              {diagnostics.warnings.length ? (
                <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3 text-xs">
                  {diagnostics.warnings.map((w) => (
                    <div key={w}>{w}</div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </section>

        {diagnostics.isSecretsRendered && siteUrl && vcardUrl && siteQrSvg && vcardQrSvg ? (
          <div className="mt-6">
            <ShareSheet siteUrl={siteUrl} vcardUrl={vcardUrl} siteQrSvg={siteQrSvg} vcardQrSvg={vcardQrSvg} />
          </div>
        ) : null}

        <footer className="mt-8 text-center text-xs text-muted-foreground">
          <div className="font-mono">
            Theme follows your device (press <kbd className="rounded border px-1">d</kbd> to toggle)
          </div>
        </footer>
      </div>
    </main>
  )
}

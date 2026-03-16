"use client"

import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Check, Copy, Download, Nfc, QrCode, Share2 } from "lucide-react"

type Mode = "site" | "vcard"

export function ShareSheet({
  siteUrl,
  vcardUrl,
  siteQrSvg,
  vcardQrSvg,
}: {
  siteUrl: string
  vcardUrl: string
  siteQrSvg: string
  vcardQrSvg: string
}) {
  const [mode, setMode] = React.useState<Mode>("site")
  const [status, setStatus] = React.useState<string>("")
  const [copied, setCopied] = React.useState(false)
  const [busy, setBusy] = React.useState<null | "copy" | "share" | "nfc">(null)

  const active = mode === "site"
    ? { title: "This page", url: siteUrl, svg: siteQrSvg }
    : { title: "vCard download", url: vcardUrl, svg: vcardQrSvg }

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function"
  const canCopy = typeof navigator !== "undefined" && !!navigator.clipboard?.writeText
  const canNfc = typeof window !== "undefined" && "NDEFWriter" in window

  async function onCopy() {
    if (!canCopy) {
      setStatus("Copy not supported in this browser.")
      return
    }
    setBusy("copy")
    setStatus("")
    try {
      await navigator.clipboard.writeText(active.url)
      setCopied(true)
      setStatus("Copied.")
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setStatus("Copy failed.")
    } finally {
      setBusy(null)
    }
  }

  async function onShare() {
    if (!canShare) {
      return onCopy()
    }
    setBusy("share")
    setStatus("")
    try {
      await navigator.share({ title: active.title, url: active.url })
    } catch {
      // User cancel is fine.
    } finally {
      setBusy(null)
    }
  }

  async function onWriteNfc() {
    if (!canNfc) {
      setStatus("Web NFC not supported (Android Chrome only).")
      return
    }
    setBusy("nfc")
    setStatus("")
    try {
      // @ts-expect-error Web NFC is not in TS lib yet.
      const writer = new window.NDEFWriter()
      if (mode === "site") {
        await writer.write({ records: [{ recordType: "url", data: siteUrl }] })
        setStatus("Ready — tap an NFC tag to write the link.")
      } else {
        // Prefer writing the vCard itself if we can fetch it.
        try {
          const res = await fetch(vcardUrl, { cache: "no-store" })
          if (res.ok) {
            const vcard = await res.text()
            await writer.write({
              records: [{ recordType: "mime", mediaType: "text/vcard", data: vcard }],
            })
            setStatus("Ready — tap an NFC tag to write the vCard.")
            return
          }
        } catch {
          // fall through
        }
        await writer.write({ records: [{ recordType: "url", data: vcardUrl }] })
        setStatus("Ready — tap an NFC tag to write the vCard link.")
      }
    } catch {
      setStatus("NFC write failed or was cancelled.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <QrCode className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="text-sm font-medium">Share</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "site" ? "secondary" : "outline"}
            onClick={() => setMode("site")}
          >
            Site
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "vcard" ? "secondary" : "outline"}
            onClick={() => setMode("vcard")}
          >
            vCard
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <div className="text-sm font-medium">{active.title}</div>
          <div className="mt-1 truncate text-xs text-muted-foreground">{active.url}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCopy} disabled={busy !== null}>
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              Copy
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onShare} disabled={busy !== null}>
              <Share2 aria-hidden />
              Share
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onWriteNfc}
              disabled={busy !== null}
              className={cn(!canNfc && "opacity-60")}
              title={canNfc ? undefined : "Web NFC requires Android Chrome"}
            >
              <Nfc aria-hidden />
              NFC
            </Button>
            {mode === "vcard" ? (
              <Button asChild variant="outline" size="sm">
                <a href={vcardUrl} download>
                  <Download aria-hidden />
                  Download
                </a>
              </Button>
            ) : null}
          </div>
          {status ? <div className="mt-3 text-xs text-muted-foreground">{status}</div> : null}
          {!canShare ? (
            <div className="mt-2 text-xs text-muted-foreground">Share is not supported — copy instead.</div>
          ) : null}
        </div>

        <div className="mx-auto w-[220px] max-w-full rounded-2xl border border-border bg-white p-3 sm:mx-0">
          <div
            className={cn(
              "aspect-square w-full [&_svg]:h-full [&_svg]:w-full [&_svg]:rounded-xl",
              active && "text-foreground"
            )}
            aria-label="QR code"
            role="img"
            // SVG is generated server-side by the app.
            dangerouslySetInnerHTML={{ __html: active.svg }}
          />
        </div>
      </div>
    </section>
  )
}

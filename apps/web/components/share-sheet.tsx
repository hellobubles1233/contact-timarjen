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
  const nfcUnavailableReason = React.useMemo(() => {
    if (typeof window === "undefined") return "Checking NFC support."
    if (!window.isSecureContext) return "NFC needs HTTPS."

    const userAgent = navigator.userAgent.toLowerCase()
    const isAndroid = userAgent.includes("android")
    const isChromeFamily =
      userAgent.includes("chrome") || userAgent.includes("chromium") || userAgent.includes("crios")

    if (!("NDEFReader" in window)) {
      if (isAndroid && isChromeFamily) {
        return "This Chrome build does not expose Web NFC. Update Chrome and open the page directly in Chrome, not an in-app browser."
      }
      return "Web NFC is only available in supported Android Chromium browsers."
    }

    return ""
  }, [])
  const canNfc = !nfcUnavailableReason

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
      setStatus(nfcUnavailableReason)
      return
    }
    setBusy("nfc")
    setStatus("")
    try {
      // @ts-expect-error Web NFC is not in the default TS DOM lib here.
      const ndef = new window.NDEFReader()
      if (mode === "site") {
        await ndef.write({ records: [{ recordType: "url", data: siteUrl }] })
        setStatus("Wrote the page link to the NFC tag.")
      } else {
        let wroteInlineVcard = false

        try {
          const res = await fetch(vcardUrl, { cache: "no-store" })
          if (res.ok) {
            const vcard = await res.text()
            try {
              await ndef.write({
                records: [
                  {
                    recordType: "mime",
                    mediaType: "text/x-vcard",
                    data: new TextEncoder().encode(vcard),
                  },
                ],
              })
              wroteInlineVcard = true
              setStatus("Wrote the full vCard to the NFC tag.")
              return
            } catch {
              wroteInlineVcard = false
            }
          }
        } catch {
          // fall through
        }

        await ndef.write({ records: [{ recordType: "url", data: vcardUrl }] })
        setStatus(
          wroteInlineVcard
            ? "Wrote the vCard to the NFC tag."
            : "This tag/browser did not accept a full contact card, so the vCard download link was written instead."
        )
      }
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          setStatus("Allow NFC access in Chrome and try again.")
        } else if (error.name === "NotSupportedError") {
          setStatus("NFC is not available. Make sure NFC is turned on and the phone is unlocked.")
        } else if (error.name === "NotReadableError") {
          setStatus("Could not reach the NFC tag. Hold the phone against an NDEF-formatted tag and try again.")
        } else if (error.name === "AbortError") {
          setStatus("NFC write was cancelled.")
        } else {
          setStatus(`NFC write failed: ${error.name}.`)
        }
      } else {
        setStatus("NFC write failed.")
      }
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
              title={canNfc ? undefined : nfcUnavailableReason}
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

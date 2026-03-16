"use client"

import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Check, Copy } from "lucide-react"

export function CopyValueItem({
  label,
  value,
  subtitle,
  className,
}: {
  label: string
  value: string
  subtitle?: string
  className?: string
}) {
  const [copied, setCopied] = React.useState(false)

  async function onCopy() {
    if (!navigator.clipboard?.writeText) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn("h-auto w-full justify-between gap-3 rounded-2xl px-4 py-3", className)}
      onClick={onCopy}
      disabled={!navigator.clipboard?.writeText}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-muted">
          {copied ? <Check className="size-4 text-foreground/70" aria-hidden /> : <Copy className="size-4 text-foreground/70" aria-hidden />}
        </span>
        <span className="min-w-0 text-left">
          <span className="block truncate text-sm font-medium">{label}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{subtitle ?? value}</span>
        </span>
      </span>
      <span className="text-xs text-muted-foreground">{copied ? "Copied" : "Copy"}</span>
    </Button>
  )
}


import { headers } from "next/headers"

export async function getBaseUrl() {
  const configured = process.env.CONTACT_PUBLIC_URL?.trim()
  if (configured) {
    return configured.replace(/\/+$/g, "")
  }

  const h = await headers()
  const forwardedProto = h.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const proto = forwardedProto || "http"
  const forwardedHost = h.get("x-forwarded-host")?.split(",")[0]?.trim()
  const host = forwardedHost || h.get("host")
  if (!host) {
    return ""
  }
  return `${proto}://${host}`
}

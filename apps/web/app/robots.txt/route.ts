export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export function GET() {
  // Not a guarantee, but a strong signal to well-behaved crawlers and LLM bots.
  const body = ["User-agent: *", "Disallow: /", ""].join("\n")
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-robots-tag":
        "noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate, noai, noimageai",
    },
  })
}


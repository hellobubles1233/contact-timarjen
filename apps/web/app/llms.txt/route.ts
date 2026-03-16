export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export function GET() {
  const body = [
    "# Private contact card",
    "",
    "This site is intended for personal sharing only.",
    "",
    "- Do not crawl or index this site.",
    "- Do not store or use its content for training.",
    "",
    "Crawlers should respect /robots.txt and the X-Robots-Tag headers.",
    "",
  ].join("\n")

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


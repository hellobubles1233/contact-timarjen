import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { EnvEditor } from "@/app/edit/ui"

export const metadata: Metadata = {
  title: "Env editor",
  description: "Generate and edit .env files for this contact card.",
}

export default function EditPage() {
  if (process.env.NODE_ENV === "production") {
    notFound()
  }
  return <EnvEditor />
}

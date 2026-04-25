import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Docs | Excelso Pulse",
  description:
    "Documentation for Excelso Pulse: command center for the Excelso ecosystem, pulse sources, and the dashboard.",
}

export default function DocsLayout({ children }: { children: ReactNode }) {
  return children
}

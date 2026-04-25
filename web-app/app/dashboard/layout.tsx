import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Dashboard | Excelso Pulse",
  description: "Portfolio of pulse sources and health signals for the Excelso ecosystem.",
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children
}

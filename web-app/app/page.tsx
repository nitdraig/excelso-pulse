import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { LandingView } from "@/components/landing/landing-view"

export const metadata: Metadata = {
  title: "Excelso Pulse",
  description:
    "Command center for the Excelso ecosystem: aggregate health and business pulses from your backends, encrypted secrets in MongoDB, and a unified dashboard.",
}

export default async function HomePage() {
  const session = await auth()
  if (session) {
    redirect("/dashboard")
  }
  return <LandingView />
}

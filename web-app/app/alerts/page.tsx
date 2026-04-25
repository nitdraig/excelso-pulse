import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { AlertsPage } from "@/components/alerts/alerts-page"

export default async function AlertsRoute() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login?callbackUrl=/alerts")
  }
  return <AlertsPage />
}

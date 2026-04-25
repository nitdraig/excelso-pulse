import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { AccountPage } from "@/components/account/account-page"

export default async function AccountRoute() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login?callbackUrl=/account")
  }
  return <AccountPage />
}

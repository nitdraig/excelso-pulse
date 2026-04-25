import { redirect } from "next/navigation"

/** Perfil unificado en `/account`. */
export default function ProfileRedirectPage() {
  redirect("/account")
}

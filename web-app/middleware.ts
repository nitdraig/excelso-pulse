import { NextResponse } from "next/server"
import { auth } from "@/auth"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthPage =
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/forgot-password/") ||
    pathname === "/reset-password" ||
    pathname.startsWith("/reset-password/")
  const isPublicDocs =
    pathname === "/docs" || pathname.startsWith("/docs/")
  /** Marketing / landing: solo invitados (sesión redirige en la página y aquí). */
  const isGuestLanding = pathname === "/"
  const isPublicAsset =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/register") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json"
  /** Webhook Dialogflow / voz: auth propia (secreto de instancia), no sesión de navegador. */
  const isPublicVoiceApi = pathname.startsWith("/api/v1/voice/")

  if (isPublicAsset || isPublicVoiceApi) return NextResponse.next()

  if (req.auth && isGuestLanding) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin))
  }

  if (!req.auth && !isAuthPage && !isPublicDocs && !isGuestLanding) {
    const url = new URL("/login", req.nextUrl.origin)
    url.searchParams.set("callbackUrl", pathname + req.nextUrl.search)
    return NextResponse.redirect(url)
  }

  if (req.auth && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg)$).*)"],
}

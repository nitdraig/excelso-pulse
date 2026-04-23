import { NextResponse } from "next/server"
import { auth } from "@/auth"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthPage =
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/register" ||
    pathname.startsWith("/register/")
  const isPublicAsset =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/register") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"

  if (isPublicAsset) return NextResponse.next()

  if (!req.auth && !isAuthPage) {
    const url = new URL("/login", req.nextUrl.origin)
    url.searchParams.set("callbackUrl", pathname + req.nextUrl.search)
    return NextResponse.redirect(url)
  }

  if (req.auth && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg)$).*)"],
}

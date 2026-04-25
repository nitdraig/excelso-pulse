import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { SessionUserPayload } from "@/lib/auth/session-user"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email
        const password = credentials?.password
        if (typeof email !== "string" || typeof password !== "string") return null
        if (!email.trim() || !password) return null

        const { authenticateUser } = await import("@/lib/auth/authenticate-user")
        const user = await authenticateUser(email, password)
        return user as SessionUserPayload | null
      },
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as SessionUserPayload
        token.sub = u.id
        token.name = u.name
        token.email = u.email
        token.firstName = u.firstName
        token.lastName = u.lastName
        token.organizationName = u.organizationName
      }
      if (trigger === "update" && session?.user) {
        const u = session.user as Record<string, string | undefined>
        if (typeof u.name === "string") token.name = u.name
        if (typeof u.email === "string") token.email = u.email
        if (typeof u.firstName === "string") token.firstName = u.firstName
        if (typeof u.lastName === "string") token.lastName = u.lastName
        if (typeof u.organizationName === "string") {
          token.organizationName = u.organizationName
        }
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ""
        session.user.name = (token.name as string) ?? session.user.name ?? ""
        session.user.email = (token.email as string) ?? ""
        session.user.firstName = (token.firstName as string) ?? ""
        session.user.lastName = (token.lastName as string) ?? ""
        session.user.organizationName = (token.organizationName as string) ?? ""
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 14,
  },
})

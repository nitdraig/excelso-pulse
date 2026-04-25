"use client"

import { useCallback, useEffect, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { Loader2, LogOut } from "lucide-react"
import { AppSubHeader } from "@/components/app-sub-header"
import { MobileTabBar } from "@/components/mobile-tab-bar"
import { useTranslation } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

type ProfileDto = {
  email: string
  firstName: string
  lastName: string
  organizationName: string
}

export function AccountPage() {
  const { t } = useTranslation()
  const { status, update } = useSession()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileDto | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [organizationName, setOrganizationName] = useState("")
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMessage, setPwdMessage] = useState<string | null>(null)
  const [pwdError, setPwdError] = useState<string | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteWorking, setDeleteWorking] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    setLoadError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/account", { cache: "no-store" })
      const data = (await res.json()) as ProfileDto & { error?: string }
      if (!res.ok) {
        setLoadError(data.error ?? t("accountPage.loadError"))
        setProfile(null)
        return
      }
      setProfile({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationName: data.organizationName,
      })
      setFirstName(data.firstName)
      setLastName(data.lastName)
      setEmail(data.email)
      setOrganizationName(data.organizationName)
    } catch {
      setLoadError(t("accountPage.networkError"))
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileError(null)
    setProfileMessage(null)
    setProfileSaving(true)
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          organizationName: organizationName.trim(),
        }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; user?: ProfileDto & { name: string } }
      if (!res.ok) {
        setProfileError(data.error ?? t("accountPage.saveError"))
        return
      }
      setProfileMessage(t("accountPage.profileSaved"))
      if (data.user) {
        setEmail(data.user.email)
        await update({
          user: {
            name: data.user.name,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            organizationName: data.user.organizationName,
          },
        })
      }
    } catch {
      setProfileError(t("accountPage.networkError"))
    } finally {
      setProfileSaving(false)
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdError(null)
    setPwdMessage(null)
    if (newPassword !== confirmPassword) {
      setPwdError(t("accountPage.passwordMismatch"))
      return
    }
    setPwdSaving(true)
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok) {
        setPwdError(data.error ?? t("accountPage.passwordError"))
        return
      }
      setPwdMessage(t("accountPage.passwordSaved"))
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      setPwdError(t("accountPage.networkError"))
    } finally {
      setPwdSaving(false)
    }
  }

  async function confirmDeleteAccount() {
    setDeleteError(null)
    setDeleteWorking(true)
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok) {
        setDeleteError(data.error ?? t("accountPage.deleteError"))
        return
      }
      setDeleteOpen(false)
      await signOut({ callbackUrl: "/login" })
    } catch {
      setDeleteError(t("accountPage.networkError"))
    } finally {
      setDeleteWorking(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <AppSubHeader active="account" />
        <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{t("authPages.loading")}</span>
        </div>
        <MobileTabBar />
      </div>
    )
  }

  if (loadError || !profile) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <AppSubHeader active="account" />
        <div className="mx-auto max-w-md flex-1 space-y-4 px-4 py-10">
          <p className="text-sm text-destructive">{loadError ?? t("accountPage.loadError")}</p>
          <Button type="button" variant="outline" onClick={() => void loadProfile()}>
            {t("dashboard.retry")}
          </Button>
        </div>
        <MobileTabBar />
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppSubHeader active="account" />

      <main className="mx-auto w-full max-w-lg flex-1 space-y-10 px-4 py-8 pb-[calc(4.25rem+env(safe-area-inset-bottom))] sm:py-10 lg:max-w-xl lg:pb-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("accountPage.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("accountPage.subtitle")}</p>
        </div>

        <form onSubmit={saveProfile} className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">{t("accountPage.sectionProfile")}</h2>
          {profileMessage ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{profileMessage}</p>
          ) : null}
          {profileError ? <p className="text-sm text-destructive">{profileError}</p> : null}
          <div className="space-y-2">
            <Label htmlFor="org">{t("accountPage.organizationLabel")}</Label>
            <Input
              id="org"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder={t("accountPage.organizationPlaceholder")}
              autoComplete="organization"
            />
            <p className="text-xs text-muted-foreground">{t("accountPage.organizationHint")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fn">{t("accountPage.firstName")}</Label>
              <Input
                id="fn"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ln">{t("accountPage.lastName")}</Label>
              <Input
                id="ln"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="em">{t("accountPage.email")}</Label>
            <Input
              id="em"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <Button type="submit" disabled={profileSaving}>
            {profileSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("accountPage.saving")}
              </>
            ) : (
              t("accountPage.saveProfile")
            )}
          </Button>
        </form>

        <Separator />

        <form onSubmit={savePassword} className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">{t("accountPage.sectionPassword")}</h2>
          {pwdMessage ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{pwdMessage}</p>
          ) : null}
          {pwdError ? <p className="text-sm text-destructive">{pwdError}</p> : null}
          <div className="space-y-2">
            <Label htmlFor="cur">{t("accountPage.currentPassword")}</Label>
            <Input
              id="cur"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="np">{t("accountPage.newPassword")}</Label>
            <Input
              id="np"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="npc">{t("accountPage.confirmPassword")}</Label>
            <Input
              id="npc"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" disabled={pwdSaving}>
            {pwdSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("accountPage.saving")}
              </>
            ) : (
              t("accountPage.changePassword")
            )}
          </Button>
        </form>

        <Separator />

        <div className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="text-base font-semibold text-destructive">{t("accountPage.sectionDanger")}</h2>
          <p className="text-sm text-muted-foreground">{t("accountPage.deleteIntro")}</p>
          <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
            {t("accountPage.deleteAccount")}
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={() => void signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          {t("accountPage.signOut")}
        </Button>
      </main>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("accountPage.deleteDialogTitle")}</DialogTitle>
            <DialogDescription>{t("accountPage.deleteDialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="del-pw">{t("accountPage.deletePasswordLabel")}</Label>
            <Input
              id="del-pw"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
            {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              {t("projects.deleteCancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteWorking || deletePassword.length < 1}
              onClick={() => void confirmDeleteAccount()}
            >
              {deleteWorking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("accountPage.deleting")}
                </>
              ) : (
                t("accountPage.deleteConfirm")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MobileTabBar />
    </div>
  )
}

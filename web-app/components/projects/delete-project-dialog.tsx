"use client"

import { useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { useTranslation } from "@/components/i18n-provider"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type DeleteProjectDialogProps = {
  apiPathKey: string | null
  projectName: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteProjectDialog({
  apiPathKey,
  projectName,
  open,
  onOpenChange,
  onSuccess,
}: DeleteProjectDialogProps) {
  const { t } = useTranslation()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!apiPathKey) return
    setError(null)
    setPending(true)
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(apiPathKey)}`, {
        method: "DELETE",
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? t("projects.deleteError"))
        return
      }
      onOpenChange(false)
      onSuccess?.()
    } finally {
      setPending(false)
    }
  }

  const displayName = projectName ?? apiPathKey ?? ""

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            {t("projects.deleteTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span>
              {t("projects.deleteIntro")}{" "}
              <strong className="text-foreground">{displayName}</strong> {t("projects.deleteOutro")}
            </span>
            {error ? (
              <span className="block text-destructive text-sm">{error}</span>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t("projects.deleteCancel")}</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => void handleDelete()}
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("projects.deleteWorking")}
              </>
            ) : (
              t("projects.deleteConfirm")
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

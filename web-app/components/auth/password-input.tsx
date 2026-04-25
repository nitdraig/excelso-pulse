"use client"

import * as React from "react"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useTranslation } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(function PasswordInput({ className, disabled, ...props }, ref) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const show = t("authPages.showPassword")
  const hide = t("authPages.hidePassword")

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn("pr-10", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0.5 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? hide : show}
        aria-pressed={visible}
        title={visible ? hide : show}
        disabled={disabled}
      >
        {visible ? <EyeOff className="size-4 shrink-0" aria-hidden /> : <Eye className="size-4 shrink-0" aria-hidden />}
      </Button>
    </div>
  )
})

PasswordInput.displayName = "PasswordInput"

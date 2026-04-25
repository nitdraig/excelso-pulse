"use client"

import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "@/components/i18n-provider"
import type { Locale } from "@/lib/i18n/types"
import { cn } from "@/lib/utils"

type LanguageSwitcherProps = {
  className?: string
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("gap-2 shrink-0", className)}
          aria-label={t("language.switch")}
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline text-xs uppercase">{locale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(["en", "es"] as Locale[]).map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLocale(code)}
            className={cn(code === locale && "bg-accent")}
          >
            {t(`language.${code}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

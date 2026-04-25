"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

type BrandMarkProps = {
  /** Tamaño en px (cuadrado). */
  size?: number
  className?: string
  alt: string
}

export function BrandMark({ size = 40, className, alt }: BrandMarkProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-xl border border-primary/20 bg-primary/10",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/web-app-manifest-192x192.png"
        alt={alt}
        width={size}
        height={size}
        sizes={`${size}px`}
        className="object-cover"
        priority
      />
    </span>
  )
}

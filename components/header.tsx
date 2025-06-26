import type React from "react"
import { cn } from "@/lib/utils"

interface HeaderProps {
  className?: string
  children?: React.ReactNode
}

export function Header({ className, children }: HeaderProps) {
  return (
    <header
      className={cn("sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 glass-effect", className)}
    >
      {children}
    </header>
  )
}

"use client"

import { useState } from "react"

interface LogoProps {
  size?: number
  className?: string
  showFallback?: boolean
}

export function Logo({ size = 32, className = "", showFallback = true }: LogoProps) {
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  if (imageError && showFallback) {
    // Fallback to TF text if image fails to load
    return (
      <div
        className={`rounded-full bg-gradient-to-r from-blue-500 to-purple-500 dark:from-neon-cyan dark:to-neon-purple flex items-center justify-center text-white dark:text-primary-foreground font-bold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        TF
      </div>
    )
  }

  return (
    <div
      className={`rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 dark:from-neon-cyan dark:to-neon-purple flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/terraform.png"
        alt="Logo"
        className="w-full h-full object-contain"
        onError={handleImageError}
        style={{ maxWidth: "100%", maxHeight: "100%" }}
      />
    </div>
  )
}

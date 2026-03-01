"use client"

import { SessionProvider } from "next-auth/react"
import { useEffect } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (document.activeElement instanceof HTMLInputElement && document.activeElement.type === "number") {
        document.activeElement.blur()
      }
    }
    document.addEventListener("wheel", handler, { passive: true })
    return () => document.removeEventListener("wheel", handler)
  }, [])
  return <SessionProvider>{children}</SessionProvider>
}
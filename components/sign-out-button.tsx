"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function SignOutButton() {
  return (
    <Button
      onClick={() => signOut({ callbackUrl: "/" })}
      variant="outline"
      className="text-white/70 border-white/20 hover:bg-white/10 hover:text-white"
    >
      Sign Out
    </Button>
  )
}

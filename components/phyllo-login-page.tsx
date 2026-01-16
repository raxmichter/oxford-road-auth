"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback, useState, useEffect } from "react"
import { PhylloLoginButtons } from "./phyllo-connect"
import { PLATFORM_ID_TO_NAME } from "@/lib/phyllo/constants"

interface PhylloAccount {
  id: string
  work_platform: {
    id: string
    name: string
  }
  status: string
}

export function PhylloLoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch connected accounts on mount
  useEffect(() => {
    async function fetchAccounts() {
      if (status !== "authenticated") {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch("/api/phyllo/accounts")
        if (response.ok) {
          const data = await response.json()
          const platforms = data.accounts
            .filter((acc: PhylloAccount) => acc.status === "CONNECTED")
            .map((acc: PhylloAccount) => acc.work_platform.id)
          setConnectedPlatforms(platforms)
        }
      } catch (error) {
        console.error("Failed to fetch accounts:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAccounts()
  }, [status])

  const handleAccountConnected = useCallback(
    async (accountId: string, workPlatformId: string, userId: string) => {
      console.log("Account connected:", { accountId, workPlatformId, userId })
      // Add to connected platforms
      setConnectedPlatforms((prev) => [...new Set([...prev, workPlatformId])])

      const platformName = PLATFORM_ID_TO_NAME[workPlatformId]
      console.log(`${platformName} account connected successfully!`)

      // Trigger sync to fetch and store account data in database
      try {
        console.log("Syncing account data to database...")
        const syncResponse = await fetch("/api/phyllo/sync", { method: "POST" })
        if (syncResponse.ok) {
          const syncData = await syncResponse.json()
          console.log("Sync completed:", syncData)
        } else {
          console.error("Sync failed:", await syncResponse.text())
        }
      } catch (error) {
        console.error("Failed to sync account data:", error)
      }
    },
    []
  )

  const handleAccountDisconnected = useCallback(
    (accountId: string, workPlatformId: string, userId: string) => {
      console.log("Account disconnected:", { accountId, workPlatformId, userId })
      setConnectedPlatforms((prev) => prev.filter((id) => id !== workPlatformId))
    },
    []
  )

  const handleExit = useCallback(
    (reason: string, userId: string) => {
      console.log("SDK closed:", reason)
      // Refresh the page to show updated connected accounts
      if (reason === "DONE_CLICKED" && connectedPlatforms.length > 0) {
        router.push("/dashboard")
      }
    },
    [router, connectedPlatforms]
  )

  // Show login prompt if not authenticated
  if (status === "loading" || isLoading) {
    return (
      <div className="w-full p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
        <div className="flex items-center justify-center py-8">
          <svg
            className="animate-spin size-8 text-white/50"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <PhylloLoginButtons
      connectedPlatforms={connectedPlatforms}
      onAccountConnected={handleAccountConnected}
      onAccountDisconnected={handleAccountDisconnected}
      onExit={handleExit}
    />
  )
}

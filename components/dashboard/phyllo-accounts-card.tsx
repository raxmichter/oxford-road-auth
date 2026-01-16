"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { PhylloConnect } from "@/components/phyllo-connect"
import type { PhylloAccount, PhylloProfile } from "@/lib/phyllo/client"

interface AccountWithProfile extends PhylloAccount {
  profile?: PhylloProfile
}

export function PhylloAccountsCard() {
  const [accounts, setAccounts] = useState<AccountWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch accounts
      const accountsRes = await fetch("/api/phyllo/accounts")
      if (!accountsRes.ok) throw new Error("Failed to fetch accounts")
      const accountsData = await accountsRes.json()

      // Fetch profiles
      const profilesRes = await fetch("/api/phyllo/profiles")
      if (!profilesRes.ok) throw new Error("Failed to fetch profiles")
      const profilesData = await profilesRes.json()

      // Merge profiles with accounts
      const accountsWithProfiles = accountsData.accounts.map((account: PhylloAccount) => {
        const profile = profilesData.profiles.find(
          (p: PhylloProfile) => p.account.id === account.id
        )
        return { ...account, profile }
      })

      setAccounts(accountsWithProfiles)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAccountConnected = useCallback(() => {
    // Refresh data when a new account is connected
    setTimeout(fetchData, 2000) // Wait for Phyllo to sync
  }, [fetchData])

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "—"
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONNECTED":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            Connected
          </span>
        )
      case "NOT_CONNECTED":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
            Disconnected
          </span>
        )
      case "SESSION_EXPIRED":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            Session Expired
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-zinc-500/20 text-zinc-400">
            {status}
          </span>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
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

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={fetchData} variant="outline" className="text-white border-white/20">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Account button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Connected Accounts</h2>
        <PhylloConnect
          onAccountConnected={handleAccountConnected}
          buttonText="+ Add Account"
          className="w-auto px-6 bg-white/10 hover:bg-white/20 text-white"
        />
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center py-12">
          <p className="text-white/50 text-lg mb-4">No accounts connected yet</p>
          <p className="text-white/30 text-sm">
            Click &quot;Add Account&quot; above to connect your social media accounts
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors"
            >
              {/* Platform Header */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={account.work_platform.logo_url}
                  alt={account.work_platform.name}
                  className="w-10 h-10 rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-white font-medium">{account.work_platform.name}</h3>
                  <p className="text-white/50 text-sm">
                    @{account.profile?.platform_username || account.platform_username || "—"}
                  </p>
                </div>
                {getStatusBadge(account.status)}
              </div>

              {/* Profile Info */}
              {account.profile && (
                <div className="flex items-center gap-3 mb-4">
                  {account.profile.image_url && (
                    <img
                      src={account.profile.image_url}
                      alt={account.profile.full_name || "Profile"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="text-white font-medium">
                      {account.profile.full_name || account.profile.platform_username}
                    </p>
                    {account.profile.is_verified && (
                      <span className="text-blue-400 text-xs">✓ Verified</span>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              {account.profile?.reputation && (
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10">
                  <div className="text-center">
                    <p className="text-white font-semibold">
                      {formatNumber(account.profile.reputation.follower_count)}
                    </p>
                    <p className="text-white/50 text-xs">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">
                      {formatNumber(account.profile.reputation.following_count)}
                    </p>
                    <p className="text-white/50 text-xs">Following</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">
                      {formatNumber(account.profile.reputation.content_count)}
                    </p>
                    <p className="text-white/50 text-xs">Posts</p>
                  </div>
                </div>
              )}

              {/* Last Synced */}
              {account.data?.identity?.last_sync_at && (
                <p className="text-white/30 text-xs mt-4">
                  Last synced:{" "}
                  {new Date(account.data.identity.last_sync_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

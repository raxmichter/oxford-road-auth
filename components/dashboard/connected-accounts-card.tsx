"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SocialLoginButtons } from "@/components/social-login-buttons"
import { formatDistanceToNow } from "date-fns"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface Account {
  id: string
  provider: string
  profile: any
  createdAt: Date
  lastSyncedAt: Date | null
  _count: {
    posts: number
  }
}

export function ConnectedAccountsCard({ accounts }: { accounts: Account[] }) {
  const router = useRouter()
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)
  const connectedProviders = accounts.map((a) => a.provider)

  const handleUnlink = async (accountId: string) => {
    if (!confirm("Are you sure you want to unlink this account?")) {
      return
    }

    setUnlinkingId(accountId)
    try {
      const response = await fetch("/api/auth/unlink-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      })

      const data = await response.json()

      if (data.success) {
        router.refresh()
      } else {
        alert(data.error || "Failed to unlink account")
      }
    } catch (error) {
      alert("Failed to unlink account")
    } finally {
      setUnlinkingId(null)
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "tiktok":
        return "bg-black text-white"
      case "instagram":
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
      case "facebook":
        return "bg-blue-600 text-white"
      case "twitter":
        return "bg-zinc-800 text-white"
      case "google":
        return "bg-red-600 text-white"
      default:
        return "bg-zinc-700 text-white"
    }
  }

  const getProviderName = (provider: string) => {
    switch (provider) {
      case "google":
        return "YouTube"
      case "twitter":
        return "X (Twitter)"
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1)
    }
  }

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white">Connected Accounts</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-white text-black hover:bg-zinc-100">
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">Connect a New Account</DialogTitle>
              </DialogHeader>
              <SocialLoginButtons
                mode="link"
                connectedProviders={connectedProviders}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-white/50 text-center py-8">
            No accounts connected yet. Click "Add Account" to get started.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <Badge className={getProviderColor(account.provider)}>
                    {getProviderName(account.provider)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnlink(account.id)}
                    disabled={unlinkingId === account.id || accounts.length === 1}
                    className="h-8 text-xs text-white/70 hover:text-white hover:bg-white/10"
                  >
                    {unlinkingId === account.id ? "Unlinking..." : "Unlink"}
                  </Button>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-white/70">
                    <span className="font-medium">{account._count.posts}</span> posts synced
                  </p>
                  <p className="text-white/50 text-xs">
                    Connected {formatDistanceToNow(new Date(account.createdAt), { addSuffix: true })}
                  </p>
                  {account.lastSyncedAt && (
                    <p className="text-white/50 text-xs">
                      Last synced {formatDistanceToNow(new Date(account.lastSyncedAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

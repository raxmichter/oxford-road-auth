import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getLinkedAccounts } from "@/lib/auth/account-linking"
import { ConnectedAccountsCard } from "@/components/dashboard/connected-accounts-card"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/?callbackUrl=/dashboard")
  }

  const accounts = await getLinkedAccounts(session.user.id)

  return (
    <main className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-white/70 mt-1">
              Welcome back, {session.user.name || session.user.email}!
            </p>
          </div>
          <div className="flex items-center gap-4">
            {session.user.image && (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-10 h-10 rounded-full"
              />
            )}
          </div>
        </div>

        <ConnectedAccountsCard accounts={accounts} />

        {accounts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/50 text-lg">
              No accounts connected yet. Use the button above to connect your first account!
            </p>
          </div>
        )}

        {accounts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-white/70 text-sm font-medium mb-2">Total Accounts</h3>
              <p className="text-4xl font-bold text-white">{accounts.length}</p>
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-white/70 text-sm font-medium mb-2">Total Posts</h3>
              <p className="text-4xl font-bold text-white">
                {accounts.reduce((sum, acc) => sum + acc._count.posts, 0)}
              </p>
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-white/70 text-sm font-medium mb-2">Last Synced</h3>
              <p className="text-lg font-medium text-white">
                {accounts.some(acc => acc.lastSyncedAt)
                  ? "Recently"
                  : "Not yet"}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

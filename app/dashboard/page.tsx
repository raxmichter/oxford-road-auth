import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PhylloAccountsCard } from "@/components/dashboard/phyllo-accounts-card"
import { PhylloContentCard } from "@/components/dashboard/phyllo-content-card"
import { SignOutButton } from "@/components/sign-out-button"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/?callbackUrl=/dashboard")
  }

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
            <SignOutButton />
          </div>
        </div>

        <PhylloAccountsCard />

        <PhylloContentCard />
      </div>
    </main>
  )
}

import { Suspense } from "react"
import { SocialLoginButtons } from "@/components/social-login-buttons"

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md flex flex-col items-center gap-8 relative z-10">
        <div className="flex flex-col items-center gap-2">
          <img src="/logo-light.svg" alt="Orbit" className="h-84 w-auto drop-shadow-2xl" />
          <p className="text-white/70 text-lg font-light">Connect your accounts to get started</p>
        </div>

        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <SocialLoginButtons />
        </Suspense>
      </div>
    </main>
  )
}

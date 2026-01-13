"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration. Please contact support."
      case "AccessDenied":
        return "You denied access to your account. Please try again and grant the necessary permissions."
      case "Verification":
        return "The verification token has expired or has already been used."
      case "OAuthSignin":
        return "Error in constructing an authorization URL. Please try again."
      case "OAuthCallback":
        return "Error in handling the response from the OAuth provider. Please try again."
      case "OAuthCreateAccount":
        return "Could not create an account in the database. Please try again."
      case "EmailCreateAccount":
        return "Could not create an email provider account in the database."
      case "Callback":
        return "Error in the OAuth callback handler route. Please try again."
      case "OAuthAccountNotLinked":
        return "This account is already linked to another user. Please sign in with your original account."
      case "EmailSignin":
        return "The email sign-in link is invalid or has expired."
      case "CredentialsSignin":
        return "Sign in failed. Check the details you provided are correct."
      case "SessionRequired":
        return "You must be signed in to access this page."
      default:
        return "An unexpected error occurred. Please try again."
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="relative overflow-hidden rounded-3xl bg-zinc-900 p-8 border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10" />

          <div className="relative space-y-6">
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">Authentication Error</h1>
              <p className="text-white/70">{getErrorMessage(error)}</p>
            </div>

            <div className="space-y-3">
              <Link href="/" className="block">
                <Button className="w-full bg-white text-black hover:bg-zinc-100">
                  Try Again
                </Button>
              </Link>

              <Link href="/dashboard" className="block">
                <Button variant="outline" className="w-full border-white/10 text-black hover:bg-white/10">
                  Go to Dashboard
                </Button>
              </Link>
            </div>

            {error && (
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-white/50 text-center">
                  Error code: {error}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

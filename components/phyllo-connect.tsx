"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { WORK_PLATFORMS, type WorkPlatformName } from "@/lib/phyllo/constants"

declare global {
  interface Window {
    PhylloConnect: {
      initialize: (config: PhylloConfig) => PhylloConnectInstance
      version: () => { connect_web_sdk_version: string }
    }
  }
}

interface PhylloConfig {
  clientDisplayName: string
  environment: "sandbox" | "staging" | "production"
  userId: string
  token: string
  redirect?: boolean
  redirectURL?: string
  workPlatformId?: string
}

interface PhylloConnectInstance {
  open: () => void
  on: (event: string, callback: (...args: unknown[]) => void) => void
}

interface PhylloConnectProps {
  onAccountConnected?: (accountId: string, workPlatformId: string, userId: string) => void
  onAccountDisconnected?: (accountId: string, workPlatformId: string, userId: string) => void
  onExit?: (reason: string, userId: string) => void
  onConnectionFailure?: (reason: string, workPlatformId: string, userId: string) => void
  workPlatformId?: string
  buttonText?: string
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
}

// Platform button configurations
const PLATFORM_CONFIGS: Record<
  WorkPlatformName,
  {
    icon: React.ReactNode
    className: string
    label: string
  }
> = {
  tiktok: {
    icon: (
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
    className:
      "bg-white hover:bg-zinc-100 text-black shadow-lg shadow-white/10 hover:shadow-xl hover:shadow-white/20",
    label: "TikTok",
  },
  instagram: {
    icon: (
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    className:
      "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 text-white shadow-lg shadow-pink-500/20 hover:shadow-xl hover:shadow-pink-500/30",
    label: "Instagram",
  },
  facebook: {
    icon: (
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    className:
      "bg-[#1877F2] hover:bg-[#166FE5] text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30",
    label: "Facebook",
  },
  twitter: {
    icon: (
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    className:
      "bg-zinc-800 hover:bg-zinc-700 text-white shadow-lg shadow-zinc-900/50 hover:shadow-xl",
    label: "X",
  },
  youtube: {
    icon: (
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    className:
      "bg-[#FF0000] hover:bg-[#CC0000] text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30",
    label: "YouTube",
  },
  twitch: {
    icon: (
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
      </svg>
    ),
    className:
      "bg-[#9146FF] hover:bg-[#7B2FFF] text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30",
    label: "Twitch",
  },
}

export function PhylloConnect({
  onAccountConnected,
  onAccountDisconnected,
  onExit,
  onConnectionFailure,
  workPlatformId,
  buttonText,
  className,
  variant = "outline",
}: PhylloConnectProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load Phyllo SDK script
  useEffect(() => {
    if (typeof window !== "undefined" && !window.PhylloConnect) {
      const script = document.createElement("script")
      script.src = "https://cdn.getphyllo.com/connect/v2/phyllo-connect.js"
      script.async = true
      script.onload = () => setIsScriptLoaded(true)
      script.onerror = () => setError("Failed to load Phyllo SDK")
      document.body.appendChild(script)
    } else if (window.PhylloConnect) {
      setIsScriptLoaded(true)
    }
  }, [])

  const openPhylloConnect = useCallback(async () => {
    if (!isScriptLoaded || !window.PhylloConnect) {
      setError("Phyllo SDK not loaded")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get SDK token from our API
      const response = await fetch("/api/phyllo/sdk-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: ["IDENTITY", "ENGAGEMENT", "ENGAGEMENT.AUDIENCE"],
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to get SDK token")
      }

      const { token, userId } = await response.json()

      // Initialize Phyllo Connect
      const config: PhylloConfig = {
        clientDisplayName: process.env.NEXT_PUBLIC_APP_NAME || "Oxford Road",
        environment: (process.env.NEXT_PUBLIC_PHYLLO_ENVIRONMENT || "sandbox") as
          | "sandbox"
          | "staging"
          | "production",
        userId,
        token,
        redirect: false,
      }

      if (workPlatformId) {
        config.workPlatformId = workPlatformId
      }

      const phylloConnect = window.PhylloConnect.initialize(config)

      // Set up event handlers
      phylloConnect.on("accountConnected", (accountId, wpId, uId) => {
        console.log("Account connected:", accountId, wpId, uId)
        onAccountConnected?.(accountId as string, wpId as string, uId as string)
      })

      phylloConnect.on("accountDisconnected", (accountId, wpId, uId) => {
        console.log("Account disconnected:", accountId, wpId, uId)
        onAccountDisconnected?.(accountId as string, wpId as string, uId as string)
      })

      phylloConnect.on("tokenExpired", (uId) => {
        console.log("Token expired for user:", uId)
        setError("Session expired. Please try again.")
      })

      phylloConnect.on("exit", (reason, uId) => {
        console.log("SDK exit:", reason, uId)
        setIsLoading(false)
        onExit?.(reason as string, uId as string)
      })

      phylloConnect.on("connectionFailure", (reason, wpId, uId) => {
        console.log("Connection failure:", reason, wpId, uId)
        onConnectionFailure?.(reason as string, wpId as string, uId as string)
      })

      // Open the SDK
      phylloConnect.open()
    } catch (err) {
      console.error("Error opening Phyllo Connect:", err)
      setError(err instanceof Error ? err.message : "Failed to open connection")
      setIsLoading(false)
    }
  }, [
    isScriptLoaded,
    workPlatformId,
    onAccountConnected,
    onAccountDisconnected,
    onExit,
    onConnectionFailure,
  ])

  return (
    <div className="w-full">
      <Button
        onClick={openPhylloConnect}
        disabled={isLoading || !isScriptLoaded}
        variant={variant}
        className={`w-full h-14 border-0 rounded-xl text-base font-medium gap-3 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${className || ""}`}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin size-5"
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
            Connecting...
          </>
        ) : (
          buttonText || "Connect Account"
        )}
      </Button>
      {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
    </div>
  )
}

// Individual platform buttons
interface PlatformButtonProps {
  platform: WorkPlatformName
  isConnected?: boolean
  onAccountConnected?: (accountId: string, workPlatformId: string, userId: string) => void
  onAccountDisconnected?: (accountId: string, workPlatformId: string, userId: string) => void
  onExit?: (reason: string, userId: string) => void
}

export function PhylloPlatformButton({
  platform,
  isConnected = false,
  onAccountConnected,
  onAccountDisconnected,
  onExit,
}: PlatformButtonProps) {
  const config = PLATFORM_CONFIGS[platform]
  const workPlatformId = WORK_PLATFORMS[platform]

  const [isLoading, setIsLoading] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load Phyllo SDK script
  useEffect(() => {
    console.log("PhylloPlatformButton useEffect - checking for PhylloConnect")
    if (typeof window !== "undefined" && !window.PhylloConnect) {
      console.log("Loading Phyllo SDK script...")
      const script = document.createElement("script")
      script.src = "https://cdn.getphyllo.com/connect/v2/phyllo-connect.js"
      script.async = true
      script.onload = () => {
        console.log("Phyllo SDK script loaded successfully")
        setIsScriptLoaded(true)
      }
      script.onerror = (e) => {
        console.error("Failed to load Phyllo SDK script:", e)
        setError("Failed to load connection SDK")
      }
      document.body.appendChild(script)
    } else if (window.PhylloConnect) {
      console.log("PhylloConnect already available")
      setIsScriptLoaded(true)
    }
  }, [])

  const handleClick = useCallback(async () => {
    console.log("Button clicked, isScriptLoaded:", isScriptLoaded, "isConnected:", isConnected)

    if (!isScriptLoaded || !window.PhylloConnect || isConnected) {
      console.log("Early return - script not loaded or already connected")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("Fetching SDK token...")
      const response = await fetch("/api/phyllo/sdk-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: ["IDENTITY", "ENGAGEMENT", "ENGAGEMENT.AUDIENCE"],
        }),
      })

      const data = await response.json()
      console.log("SDK token response:", response.ok, data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to get SDK token")
      }

      const { token, userId } = data

      console.log("Initializing Phyllo Connect with userId:", userId)
      const phylloConnect = window.PhylloConnect.initialize({
        clientDisplayName: process.env.NEXT_PUBLIC_APP_NAME || "Oxford Road",
        environment: (process.env.NEXT_PUBLIC_PHYLLO_ENVIRONMENT || "sandbox") as
          | "sandbox"
          | "staging"
          | "production",
        userId,
        token,
        redirect: false,
        workPlatformId,
      })

      phylloConnect.on("accountConnected", (accountId, wpId, uId) => {
        console.log("Account connected:", accountId)
        onAccountConnected?.(accountId as string, wpId as string, uId as string)
      })

      phylloConnect.on("accountDisconnected", (accountId, wpId, uId) => {
        onAccountDisconnected?.(accountId as string, wpId as string, uId as string)
      })

      phylloConnect.on("exit", (reason, uId) => {
        console.log("Phyllo SDK exited:", reason)
        setIsLoading(false)
        onExit?.(reason as string, uId as string)
      })

      console.log("Opening Phyllo Connect...")
      phylloConnect.open()
    } catch (err) {
      console.error("Error opening Phyllo:", err)
      setError(err instanceof Error ? err.message : "Failed to connect")
      setIsLoading(false)
    }
  }, [
    isScriptLoaded,
    isConnected,
    workPlatformId,
    onAccountConnected,
    onAccountDisconnected,
    onExit,
  ])

  return (
    <div className="w-full">
      <Button
        onClick={handleClick}
        disabled={isLoading || !isScriptLoaded || isConnected}
        variant="outline"
        className={`w-full h-14 border-0 rounded-xl text-base font-medium gap-3 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${config.className}`}
      >
        {isLoading ? (
          <svg
            className="animate-spin size-5"
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
        ) : (
          config.icon
        )}
        {isConnected ? `${config.label} Connected` : config.label}
      </Button>
      {error && <p className="text-red-500 text-sm mt-1 text-center">{error}</p>}
      {!isScriptLoaded && !error && (
        <p className="text-gray-400 text-xs mt-1 text-center">Loading...</p>
      )}
    </div>
  )
}

// All platform buttons component
interface PhylloLoginButtonsProps {
  connectedPlatforms?: string[]
  onAccountConnected?: (accountId: string, workPlatformId: string, userId: string) => void
  onAccountDisconnected?: (accountId: string, workPlatformId: string, userId: string) => void
  onExit?: (reason: string, userId: string) => void
}

export function PhylloLoginButtons({
  connectedPlatforms = [],
  onAccountConnected,
  onAccountDisconnected,
  onExit,
}: PhylloLoginButtonsProps) {
  const platforms: WorkPlatformName[] = ["tiktok", "instagram", "facebook", "twitter", "youtube"]

  return (
    <div className="w-full p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
      <div className="flex flex-col gap-4">
        {platforms.map((platform) => (
          <PhylloPlatformButton
            key={platform}
            platform={platform}
            isConnected={connectedPlatforms.includes(WORK_PLATFORMS[platform])}
            onAccountConnected={onAccountConnected}
            onAccountDisconnected={onAccountDisconnected}
            onExit={onExit}
          />
        ))}
      </div>
    </div>
  )
}

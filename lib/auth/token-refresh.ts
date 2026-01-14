import { prisma } from "@/lib/prisma"

interface RefreshResult {
  access_token: string
  refresh_token?: string
  expires_at?: number
}

// Refresh TikTok token
async function refreshTikTokToken(refreshToken: string): Promise<RefreshResult | null> {
  try {
    const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    })

    const data = await response.json()
    if (data.access_token) {
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      }
    }
    return null
  } catch (error) {
    console.error("TikTok token refresh failed:", error)
    return null
  }
}

// Refresh Twitter token
async function refreshTwitterToken(refreshToken: string): Promise<RefreshResult | null> {
  try {
    const basicAuth = Buffer.from(
      `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
    ).toString("base64")

    const response = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    })

    const data = await response.json()
    if (data.access_token) {
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      }
    }
    return null
  } catch (error) {
    console.error("Twitter token refresh failed:", error)
    return null
  }
}

// Refresh Google/YouTube token
async function refreshGoogleToken(refreshToken: string): Promise<RefreshResult | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    })

    const data = await response.json()
    if (data.access_token) {
      return {
        access_token: data.access_token,
        // Google doesn't always return a new refresh token
        refresh_token: data.refresh_token || refreshToken,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      }
    }
    return null
  } catch (error) {
    console.error("Google token refresh failed:", error)
    return null
  }
}

// Refresh Facebook token (exchange for long-lived token)
async function refreshFacebookToken(accessToken: string): Promise<RefreshResult | null> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_CLIENT_ID}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&fb_exchange_token=${accessToken}`
    )

    const data = await response.json()
    if (data.access_token) {
      return {
        access_token: data.access_token,
        // Facebook long-lived tokens last ~60 days
        expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 5184000),
      }
    }
    return null
  } catch (error) {
    console.error("Facebook token refresh failed:", error)
    return null
  }
}

// Refresh Instagram token (long-lived tokens)
async function refreshInstagramToken(accessToken: string): Promise<RefreshResult | null> {
  try {
    const response = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
    )

    const data = await response.json()
    if (data.access_token) {
      return {
        access_token: data.access_token,
        // Instagram long-lived tokens last ~60 days
        expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 5184000),
      }
    }
    return null
  } catch (error) {
    console.error("Instagram token refresh failed:", error)
    return null
  }
}

// Main function to refresh token based on provider
export async function refreshAccessToken(
  provider: string,
  accessToken: string,
  refreshToken?: string | null
): Promise<RefreshResult | null> {
  switch (provider) {
    case "tiktok":
      if (!refreshToken) return null
      return refreshTikTokToken(refreshToken)
    case "twitter":
      if (!refreshToken) return null
      return refreshTwitterToken(refreshToken)
    case "google":
      if (!refreshToken) return null
      return refreshGoogleToken(refreshToken)
    case "facebook":
      return refreshFacebookToken(accessToken)
    case "instagram":
      return refreshInstagramToken(accessToken)
    default:
      return null
  }
}

// Check if token is expired or about to expire (within 5 minutes)
export function isTokenExpired(expiresAt?: number | null): boolean {
  if (!expiresAt) return false // If no expiry, assume valid
  const now = Math.floor(Date.now() / 1000)
  const buffer = 5 * 60 // 5 minutes buffer
  return now >= expiresAt - buffer
}

// Get valid access token for an account, refreshing if needed
export async function getValidAccessToken(accountId: string): Promise<string | null> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
  })

  if (!account || !account.access_token) {
    return null
  }

  // Check if token needs refresh
  if (isTokenExpired(account.expires_at)) {
    const refreshed = await refreshAccessToken(
      account.provider,
      account.access_token,
      account.refresh_token
    )

    if (refreshed) {
      // Update the account with new tokens
      await prisma.account.update({
        where: { id: accountId },
        data: {
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token || account.refresh_token,
          expires_at: refreshed.expires_at,
          updatedAt: new Date(),
        },
      })
      return refreshed.access_token
    }

    // Refresh failed, return null to trigger re-auth
    return null
  }

  return account.access_token
}

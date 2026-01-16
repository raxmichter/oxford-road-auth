/**
 * Phyllo API Client
 * Handles all server-side communication with Phyllo API
 */

// Re-export constants for convenience
export { WORK_PLATFORMS, PLATFORM_ID_TO_NAME, type WorkPlatformName } from "./constants"

const PHYLLO_ENVIRONMENTS = {
  sandbox: "https://api.sandbox.getphyllo.com",
  staging: "https://api.staging.getphyllo.com",
  production: "https://api.getphyllo.com",
} as const

type PhylloEnvironment = keyof typeof PHYLLO_ENVIRONMENTS

// Types
export interface PhylloUser {
  id: string
  name: string
  external_id: string
  created_at: string
  updated_at: string
  status: "ACTIVE" | "INACTIVE"
}

export interface PhylloSDKToken {
  sdk_token: string
  expires_at: string
}

export interface PhylloAccount {
  id: string
  created_at: string
  updated_at: string
  user: {
    id: string
    name: string
  }
  work_platform: {
    id: string
    name: string
    logo_url: string
  }
  platform_username: string
  profile_pic_url: string | null
  status: "CONNECTED" | "NOT_CONNECTED" | "SESSION_EXPIRED"
  platform_profile_name: string | null
  platform_profile_id: string | null
  data?: {
    identity?: {
      status: string
      last_sync_at: string
    }
    engagement?: {
      status: string
      last_sync_at: string
    }
  }
}

export interface PhylloProfile {
  id: string
  created_at: string
  updated_at: string
  user: {
    id: string
    name: string
  }
  account: {
    id: string
    platform_username: string
  }
  work_platform: {
    id: string
    name: string
    logo_url: string
  }
  platform_username: string
  full_name: string | null
  url: string | null
  image_url: string | null
  reputation: {
    follower_count: number | null
    following_count: number | null
    subscriber_count: number | null
    content_count: number | null
  }
  is_verified: boolean
  is_business: boolean
}

export interface PhylloContent {
  id: string
  created_at: string
  updated_at: string
  user: {
    id: string
    name: string
  }
  account: {
    id: string
    platform_username: string
  }
  work_platform: {
    id: string
    name: string
    logo_url: string
  }
  engagement: {
    like_count: number | null
    dislike_count: number | null
    comment_count: number | null
    impression_organic_count: number | null
    reach_organic_count: number | null
    save_count: number | null
    view_count: number | null
    share_count: number | null
    watch_time_in_hours: number | null
  }
  external_id: string
  title: string | null
  format: string
  type: string
  url: string | null
  media_url: string | null
  description: string | null
  visibility: string
  thumbnail_url: string | null
  published_at: string
}

interface PhylloListResponse<T> {
  data: T[]
  metadata: {
    offset: number
    limit: number
    from_date: string | null
    to_date: string | null
  }
}

class PhylloClient {
  private baseUrl: string | null = null
  private authHeader: string | null = null

  private initialize() {
    if (this.baseUrl && this.authHeader) return

    const environment = (process.env.PHYLLO_ENVIRONMENT || "sandbox") as PhylloEnvironment
    this.baseUrl = PHYLLO_ENVIRONMENTS[environment]

    const clientId = process.env.PHYLLO_CLIENT_ID
    const clientSecret = process.env.PHYLLO_CLIENT_SECRET

    console.log("Phyllo init - Environment:", environment)
    console.log("Phyllo init - Base URL:", this.baseUrl)
    console.log("Phyllo init - Client ID:", clientId ? `${clientId.substring(0, 8)}...` : "NOT SET")
    console.log("Phyllo init - Client Secret:", clientSecret ? `${clientSecret.substring(0, 8)}... (length: ${clientSecret.length})` : "NOT SET")

    if (!clientId || !clientSecret) {
      throw new Error("PHYLLO_CLIENT_ID and PHYLLO_CLIENT_SECRET must be set")
    }

    // Basic Auth header
    this.authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    this.initialize()

    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: this.authHeader!,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Phyllo API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // User Management
  async createUser(name: string, externalId: string): Promise<PhylloUser> {
    return this.request<PhylloUser>("/v1/users", {
      method: "POST",
      body: JSON.stringify({
        name,
        external_id: externalId,
      }),
    })
  }

  async getUser(userId: string): Promise<PhylloUser> {
    return this.request<PhylloUser>(`/v1/users/${userId}`)
  }

  async getUserByExternalId(externalId: string): Promise<PhylloUser> {
    return this.request<PhylloUser>(`/v1/users/external_id/${externalId}`)
  }

  // SDK Token
  async createSDKToken(
    userId: string,
    products: string[] = ["IDENTITY", "ENGAGEMENT", "ENGAGEMENT.AUDIENCE"]
  ): Promise<PhylloSDKToken> {
    return this.request<PhylloSDKToken>("/v1/sdk-tokens", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        products,
      }),
    })
  }

  // Accounts
  async getAccounts(
    userId?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<PhylloListResponse<PhylloAccount>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    })
    if (userId) {
      params.append("user_id", userId)
    }
    return this.request<PhylloListResponse<PhylloAccount>>(
      `/v1/accounts?${params.toString()}`
    )
  }

  async getAccount(accountId: string): Promise<PhylloAccount> {
    return this.request<PhylloAccount>(`/v1/accounts/${accountId}`)
  }

  // Profiles (Identity)
  async getProfiles(
    accountId?: string,
    userId?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<PhylloListResponse<PhylloProfile>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    })
    if (accountId) {
      params.append("account_id", accountId)
    }
    if (userId) {
      params.append("user_id", userId)
    }
    return this.request<PhylloListResponse<PhylloProfile>>(
      `/v1/profiles?${params.toString()}`
    )
  }

  async getProfile(profileId: string): Promise<PhylloProfile> {
    return this.request<PhylloProfile>(`/v1/profiles/${profileId}`)
  }

  // Content (Engagement)
  async getContents(
    accountId?: string,
    userId?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<PhylloListResponse<PhylloContent>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    })
    if (accountId) {
      params.append("account_id", accountId)
    }
    if (userId) {
      params.append("user_id", userId)
    }
    return this.request<PhylloListResponse<PhylloContent>>(
      `/v1/social/contents?${params.toString()}`
    )
  }

  async getContent(contentId: string): Promise<PhylloContent> {
    return this.request<PhylloContent>(`/v1/social/contents/${contentId}`)
  }

  // Work Platforms
  async getWorkPlatforms(): Promise<PhylloListResponse<{
    id: string
    name: string
    logo_url: string
    category: string
    status: string
  }>> {
    return this.request("/v1/work-platforms")
  }
}

// Export singleton instance
export const phylloClient = new PhylloClient()

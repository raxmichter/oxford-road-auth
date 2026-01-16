import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { phylloClient } from "@/lib/phyllo/client"

// Sync all data for a user to the database
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const guestId = cookieStore.get("phyllo_guest_id")?.value

    if (!guestId) {
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    // Get external user
    let externalUser
    try {
      externalUser = await phylloClient.getUserByExternalId(guestId)
    } catch {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find or create our user record
    let user = await prisma.user.findFirst({
      where: { externalUserId: externalUser.id },
    })

    if (!user) {
      // Create a guest user record
      user = await prisma.user.create({
        data: {
          externalUserId: externalUser.id,
          externalId: guestId,
          name: externalUser.name || "Guest User",
        },
      })
    }

    // Sync accounts
    const accountsResponse = await phylloClient.getAccounts(externalUser.id)
    const syncedAccounts = []

    for (const account of accountsResponse.data) {
      const syncedAccount = await prisma.connectedAccount.upsert({
        where: { id: account.id },
        create: {
          id: account.id,
          userId: user.id,
          externalUserId: externalUser.id,
          workPlatformId: account.work_platform.id,
          workPlatformName: account.work_platform.name,
          workPlatformLogoUrl: account.work_platform.logo_url,
          platformUsername: account.platform_username,
          platformProfileId: account.platform_profile_id,
          platformProfileName: account.platform_profile_name,
          profilePicUrl: account.profile_pic_url,
          status: account.status,
          identityStatus: account.data?.identity?.status,
          identityLastSyncAt: account.data?.identity?.last_sync_at ? new Date(account.data.identity.last_sync_at) : null,
          engagementStatus: account.data?.engagement?.status,
          engagementLastSyncAt: account.data?.engagement?.last_sync_at ? new Date(account.data.engagement.last_sync_at) : null,
        },
        update: {
          status: account.status,
          platformUsername: account.platform_username,
          profilePicUrl: account.profile_pic_url,
          identityStatus: account.data?.identity?.status,
          identityLastSyncAt: account.data?.identity?.last_sync_at ? new Date(account.data.identity.last_sync_at) : null,
          engagementStatus: account.data?.engagement?.status,
          engagementLastSyncAt: account.data?.engagement?.last_sync_at ? new Date(account.data.engagement.last_sync_at) : null,
        },
      })
      syncedAccounts.push(syncedAccount)
    }

    // Sync profiles
    const profilesResponse = await phylloClient.getProfiles(undefined, externalUser.id)
    const syncedProfiles = []

    for (const profile of profilesResponse.data) {
      const syncedProfile = await prisma.creatorProfile.upsert({
        where: { id: profile.id },
        create: {
          id: profile.id,
          userId: user.id,
          accountId: profile.account.id,
          workPlatformId: profile.work_platform.id,
          workPlatformName: profile.work_platform.name,
          platformUsername: profile.platform_username,
          fullName: profile.full_name,
          url: profile.url,
          imageUrl: profile.image_url,
          isVerified: profile.is_verified,
          isBusiness: profile.is_business,
          followerCount: profile.reputation?.follower_count ? BigInt(profile.reputation.follower_count) : null,
          followingCount: profile.reputation?.following_count ? BigInt(profile.reputation.following_count) : null,
          subscriberCount: profile.reputation?.subscriber_count ? BigInt(profile.reputation.subscriber_count) : null,
          contentCount: profile.reputation?.content_count ? BigInt(profile.reputation.content_count) : null,
          rawData: profile as object,
        },
        update: {
          platformUsername: profile.platform_username,
          fullName: profile.full_name,
          url: profile.url,
          imageUrl: profile.image_url,
          isVerified: profile.is_verified,
          isBusiness: profile.is_business,
          followerCount: profile.reputation?.follower_count ? BigInt(profile.reputation.follower_count) : null,
          followingCount: profile.reputation?.following_count ? BigInt(profile.reputation.following_count) : null,
          subscriberCount: profile.reputation?.subscriber_count ? BigInt(profile.reputation.subscriber_count) : null,
          contentCount: profile.reputation?.content_count ? BigInt(profile.reputation.content_count) : null,
          rawData: profile as object,
        },
      })
      syncedProfiles.push(syncedProfile)
    }

    // Sync contents (posts)
    const contentsResponse = await phylloClient.getContents(undefined, externalUser.id)
    const syncedContents = []

    for (const content of contentsResponse.data) {
      const syncedContent = await prisma.content.upsert({
        where: { id: content.id },
        create: {
          id: content.id,
          userId: user.id,
          accountId: content.account.id,
          workPlatformId: content.work_platform.id,
          workPlatformName: content.work_platform.name,
          externalId: content.external_id,
          title: content.title,
          description: content.description,
          type: content.type,
          format: content.format,
          url: content.url,
          mediaUrl: content.media_url,
          thumbnailUrl: content.thumbnail_url,
          visibility: content.visibility,
          likeCount: content.engagement?.like_count ? BigInt(content.engagement.like_count) : null,
          dislikeCount: content.engagement?.dislike_count ? BigInt(content.engagement.dislike_count) : null,
          commentCount: content.engagement?.comment_count ? BigInt(content.engagement.comment_count) : null,
          shareCount: content.engagement?.share_count ? BigInt(content.engagement.share_count) : null,
          saveCount: content.engagement?.save_count ? BigInt(content.engagement.save_count) : null,
          viewCount: content.engagement?.view_count ? BigInt(content.engagement.view_count) : null,
          impressionOrganicCount: content.engagement?.impression_organic_count ? BigInt(content.engagement.impression_organic_count) : null,
          reachOrganicCount: content.engagement?.reach_organic_count ? BigInt(content.engagement.reach_organic_count) : null,
          watchTimeInHours: content.engagement?.watch_time_in_hours,
          publishedAt: content.published_at ? new Date(content.published_at) : null,
          rawData: content as object,
        },
        update: {
          title: content.title,
          description: content.description,
          likeCount: content.engagement?.like_count ? BigInt(content.engagement.like_count) : null,
          dislikeCount: content.engagement?.dislike_count ? BigInt(content.engagement.dislike_count) : null,
          commentCount: content.engagement?.comment_count ? BigInt(content.engagement.comment_count) : null,
          shareCount: content.engagement?.share_count ? BigInt(content.engagement.share_count) : null,
          saveCount: content.engagement?.save_count ? BigInt(content.engagement.save_count) : null,
          viewCount: content.engagement?.view_count ? BigInt(content.engagement.view_count) : null,
          impressionOrganicCount: content.engagement?.impression_organic_count ? BigInt(content.engagement.impression_organic_count) : null,
          reachOrganicCount: content.engagement?.reach_organic_count ? BigInt(content.engagement.reach_organic_count) : null,
          watchTimeInHours: content.engagement?.watch_time_in_hours,
          rawData: content as object,
        },
      })
      syncedContents.push(syncedContent)
    }

    // Convert BigInt to string for JSON serialization
    const serializeData = (data: unknown): unknown => {
      if (typeof data === "bigint") {
        return data.toString()
      }
      if (Array.isArray(data)) {
        return data.map(serializeData)
      }
      if (data && typeof data === "object") {
        return Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, serializeData(value)])
        )
      }
      return data
    }

    return NextResponse.json({
      success: true,
      synced: {
        accounts: syncedAccounts.length,
        profiles: syncedProfiles.length,
        contents: syncedContents.length,
      },
      data: serializeData({
        accounts: syncedAccounts,
        profiles: syncedProfiles,
        contents: syncedContents,
      }),
    })
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch synced data from database
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const guestId = cookieStore.get("phyllo_guest_id")?.value

    if (!guestId) {
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    // Find user by external ID
    const user = await prisma.user.findFirst({
      where: { externalId: guestId },
      include: {
        connectedAccounts: {
          include: {
            profiles: true,
            contents: {
              orderBy: { publishedAt: "desc" },
              take: 50,
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ accounts: [], profiles: [], contents: [] })
    }

    // Serialize BigInt values
    const serializeData = (data: unknown): unknown => {
      if (typeof data === "bigint") {
        return data.toString()
      }
      if (data instanceof Date) {
        return data.toISOString()
      }
      if (Array.isArray(data)) {
        return data.map(serializeData)
      }
      if (data && typeof data === "object") {
        return Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, serializeData(value)])
        )
      }
      return data
    }

    const accounts = user.connectedAccounts.map((account) => ({
      ...account,
      profiles: account.profiles,
      contents: account.contents,
    }))

    return NextResponse.json(serializeData({
      user: {
        id: user.id,
        name: user.name,
        externalUserId: user.externalUserId,
      },
      accounts,
      totalProfiles: user.connectedAccounts.reduce((sum, a) => sum + a.profiles.length, 0),
      totalContents: user.connectedAccounts.reduce((sum, a) => sum + a.contents.length, 0),
    }))
  } catch (error) {
    console.error("Fetch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fetch failed" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { phylloClient } from "@/lib/phyllo/client"

// Manual sync endpoint - syncs ALL Phyllo users/accounts to database
// This is for debugging - call it once to populate the database
export async function POST() {
  try {
    const results = {
      users: [] as string[],
      accounts: [] as string[],
      profiles: [] as string[],
      contents: [] as string[],
      errors: [] as string[],
    }

    // Get all Phyllo users
    const usersResponse = await phylloClient.getAccounts()
    console.log(`Found ${usersResponse.data.length} accounts in Phyllo`)

    for (const account of usersResponse.data) {
      try {
        // Create or update user
        const user = await prisma.user.upsert({
          where: { phylloUserId: account.user.id },
          create: {
            phylloUserId: account.user.id,
            name: account.user.name || "Phyllo User",
          },
          update: {
            name: account.user.name || "Phyllo User",
          },
        })
        results.users.push(user.id)

        // Sync account
        await prisma.phylloAccount.upsert({
          where: { id: account.id },
          create: {
            id: account.id,
            userId: user.id,
            phylloUserId: account.user.id,
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
        results.accounts.push(account.id)

        // Sync profiles for this account
        const profilesResponse = await phylloClient.getProfiles(account.id, account.user.id)
        for (const profile of profilesResponse.data) {
          await prisma.phylloProfile.upsert({
            where: { id: profile.id },
            create: {
              id: profile.id,
              userId: user.id,
              accountId: account.id,
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
          results.profiles.push(profile.id)
        }

        // Sync contents for this account
        const contentsResponse = await phylloClient.getContents(account.id, account.user.id)
        for (const content of contentsResponse.data) {
          await prisma.phylloContent.upsert({
            where: { id: content.id },
            create: {
              id: content.id,
              userId: user.id,
              accountId: account.id,
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
          results.contents.push(content.id)
        }
      } catch (error) {
        results.errors.push(`Account ${account.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      synced: {
        users: results.users.length,
        accounts: results.accounts.length,
        profiles: results.profiles.length,
        contents: results.contents.length,
      },
      errors: results.errors,
    })
  } catch (error) {
    console.error("Sync all error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    )
  }
}

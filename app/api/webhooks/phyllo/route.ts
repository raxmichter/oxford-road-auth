import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { phylloClient } from "@/lib/phyllo/client"

// Phyllo webhook event types
type PhylloWebhookEvent = {
  id: string
  event: string
  name?: string
  data: {
    user_id?: string
    account_id?: string
    profile_id?: string
    content_id?: string
    content_ids?: string[]
    transaction_id?: string
    payout_id?: string
    balance_id?: string
    last_updated_time?: string
    [key: string]: unknown
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload: PhylloWebhookEvent = await request.json()
    console.log("Received Phyllo webhook:", payload.event, payload.id)

    // Log the webhook event
    const webhookEvent = await prisma.phylloWebhookEvent.create({
      data: {
        phylloEventId: payload.id,
        eventType: payload.event,
        eventName: payload.name,
        phylloUserId: payload.data.user_id,
        accountId: payload.data.account_id,
        profileId: payload.data.profile_id,
        contentId: payload.data.content_id || payload.data.content_ids?.[0],
        transactionId: payload.data.transaction_id,
        payoutId: payload.data.payout_id,
        balanceId: payload.data.balance_id,
        payload: payload as object,
        status: "PROCESSING",
      },
    })

    // Process the event based on type
    try {
      await processWebhookEvent(payload)

      // Mark as processed
      await prisma.phylloWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: "PROCESSED", processedAt: new Date() },
      })
    } catch (error) {
      // Mark as failed
      await prisma.phylloWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      })
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 }
    )
  }
}

async function processWebhookEvent(payload: PhylloWebhookEvent) {
  const { event, data } = payload

  switch (event) {
    case "ACCOUNTS.CONNECTED":
      await handleAccountConnected(data)
      break
    case "ACCOUNTS.DISCONNECTED":
      await handleAccountDisconnected(data)
      break
    case "PROFILES.ADDED":
    case "PROFILES.UPDATED":
      await handleProfileUpdate(data)
      break
    case "CONTENTS.ADDED":
    case "CONTENTS.UPDATED":
      await handleContentsUpdate(data)
      break
    case "PROFILES_AUDIENCE.ADDED":
    case "PROFILES_AUDIENCE.UPDATED":
      await handleAudienceUpdate(data)
      break
    case "TRANSACTIONS.ADDED":
    case "TRANSACTIONS.UPDATED":
      await handleTransactionUpdate(data)
      break
    case "PAYOUTS.ADDED":
    case "PAYOUTS.UPDATED":
      await handlePayoutUpdate(data)
      break
    case "BALANCES.ADDED":
    case "BALANCES.UPDATED":
      await handleBalanceUpdate(data)
      break
    default:
      console.log(`Unhandled webhook event: ${event}`)
  }
}

async function handleAccountConnected(data: PhylloWebhookEvent["data"]) {
  if (!data.account_id || !data.user_id) return

  // Find or create user by phylloUserId
  let user = await prisma.user.findFirst({
    where: { phylloUserId: data.user_id },
  })

  if (!user) {
    // Get Phyllo user details to create our user record
    try {
      const phylloUser = await phylloClient.getUser(data.user_id)
      user = await prisma.user.create({
        data: {
          phylloUserId: data.user_id,
          phylloExternalId: phylloUser.external_id,
          name: phylloUser.name || "Phyllo User",
        },
      })
      console.log(`Created user for phylloUserId: ${data.user_id}`)
    } catch (error) {
      console.error(`Failed to create user for phylloUserId: ${data.user_id}`, error)
      return
    }
  }

  // Fetch full account details from Phyllo
  const account = await phylloClient.getAccount(data.account_id)

  await prisma.phylloAccount.upsert({
    where: { id: data.account_id },
    create: {
      id: data.account_id,
      userId: user.id,
      phylloUserId: data.user_id,
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

  // Also sync profile data
  await syncProfileData(user.id, data.user_id, data.account_id)
}

async function handleAccountDisconnected(data: PhylloWebhookEvent["data"]) {
  if (!data.account_id) return

  await prisma.phylloAccount.updateMany({
    where: { id: data.account_id },
    data: { status: "NOT_CONNECTED" },
  })
}

async function handleProfileUpdate(data: PhylloWebhookEvent["data"]) {
  if (!data.profile_id || !data.user_id || !data.account_id) return

  let user = await prisma.user.findFirst({
    where: { phylloUserId: data.user_id },
  })

  if (!user) {
    // Create user if not exists
    try {
      const phylloUser = await phylloClient.getUser(data.user_id)
      user = await prisma.user.create({
        data: {
          phylloUserId: data.user_id,
          phylloExternalId: phylloUser.external_id,
          name: phylloUser.name || "Phyllo User",
        },
      })
    } catch (error) {
      console.error(`Failed to create user for profile update: ${data.user_id}`, error)
      return
    }
  }

  // Fetch profile from Phyllo
  const profile = await phylloClient.getProfile(data.profile_id)

  await prisma.phylloProfile.upsert({
    where: { id: data.profile_id },
    create: {
      id: data.profile_id,
      userId: user.id,
      accountId: data.account_id,
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
}

async function handleContentsUpdate(data: PhylloWebhookEvent["data"]) {
  const contentIds = data.content_ids || (data.content_id ? [data.content_id] : [])
  if (contentIds.length === 0 || !data.user_id || !data.account_id) return

  let user = await prisma.user.findFirst({
    where: { phylloUserId: data.user_id },
  })

  if (!user) {
    // Create user if not exists
    try {
      const phylloUser = await phylloClient.getUser(data.user_id)
      user = await prisma.user.create({
        data: {
          phylloUserId: data.user_id,
          phylloExternalId: phylloUser.external_id,
          name: phylloUser.name || "Phyllo User",
        },
      })
    } catch (error) {
      console.error(`Failed to create user for contents update: ${data.user_id}`, error)
      return
    }
  }

  // Fetch each content item and store it
  for (const contentId of contentIds) {
    try {
      const content = await phylloClient.getContent(contentId)

      await prisma.phylloContent.upsert({
        where: { id: contentId },
        create: {
          id: contentId,
          userId: user.id,
          accountId: data.account_id,
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
    } catch (error) {
      console.error(`Failed to sync content ${contentId}:`, error)
    }
  }
}

async function handleAudienceUpdate(data: PhylloWebhookEvent["data"]) {
  // Audience data handling - would need additional Phyllo API endpoint
  console.log("Audience update received:", data)
}

async function handleTransactionUpdate(data: PhylloWebhookEvent["data"]) {
  // Transaction handling - would need additional implementation
  console.log("Transaction update received:", data)
}

async function handlePayoutUpdate(data: PhylloWebhookEvent["data"]) {
  // Payout handling - would need additional implementation
  console.log("Payout update received:", data)
}

async function handleBalanceUpdate(data: PhylloWebhookEvent["data"]) {
  // Balance handling - would need additional implementation
  console.log("Balance update received:", data)
}

// Helper function to sync profile data
async function syncProfileData(userId: string, phylloUserId: string, accountId: string) {
  try {
    const profiles = await phylloClient.getProfiles(accountId, phylloUserId)

    for (const profile of profiles.data) {
      await prisma.phylloProfile.upsert({
        where: { id: profile.id },
        create: {
          id: profile.id,
          userId: userId,
          accountId: accountId,
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
    }
  } catch (error) {
    console.error("Failed to sync profile data:", error)
  }
}

// GET endpoint to verify webhook is set up
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get("challenge")

  if (challenge) {
    // Return challenge for webhook verification
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ status: "Phyllo webhook endpoint active" })
}

import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { phylloClient } from "@/lib/phyllo/client"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const guestId = cookieStore.get("phyllo_guest_id")?.value

    if (!guestId) {
      return NextResponse.json({ profiles: [] })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get("account_id")

    // Get Phyllo user by external ID
    let phylloUser
    try {
      phylloUser = await phylloClient.getUserByExternalId(guestId)
    } catch {
      return NextResponse.json({ profiles: [] })
    }

    // Get profiles from Phyllo API
    const response = await phylloClient.getProfiles(
      accountId || undefined,
      phylloUser.id
    )

    // Find user in our database
    const user = await prisma.user.findFirst({
      where: { phylloUserId: phylloUser.id },
    })

    // Sync profiles to database
    if (user) {
      for (const profile of response.data) {
        await prisma.phylloProfile.upsert({
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
      }
    }

    return NextResponse.json({ profiles: response.data })
  } catch (error) {
    console.error("Error fetching profiles:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch profiles" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { phylloClient } from "@/lib/phyllo/client"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const guestId = cookieStore.get("phyllo_guest_id")?.value

    if (!guestId) {
      return NextResponse.json({ contents: [], metadata: { offset: 0, limit: 50 } })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get("account_id")
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const offset = parseInt(searchParams.get("offset") || "0", 10)

    // Get Phyllo user by external ID
    let phylloUser
    try {
      phylloUser = await phylloClient.getUserByExternalId(guestId)
    } catch {
      return NextResponse.json({ contents: [], metadata: { offset: 0, limit } })
    }

    // Get contents from Phyllo API
    const response = await phylloClient.getContents(
      accountId || undefined,
      phylloUser.id,
      limit,
      offset
    )

    // Find user in our database
    const user = await prisma.user.findFirst({
      where: { phylloUserId: phylloUser.id },
    })

    // Sync contents to database
    if (user) {
      for (const content of response.data) {
        await prisma.phylloContent.upsert({
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
      }
    }

    return NextResponse.json({
      contents: response.data,
      metadata: response.metadata,
    })
  } catch (error) {
    console.error("Error fetching contents:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch contents" },
      { status: 500 }
    )
  }
}

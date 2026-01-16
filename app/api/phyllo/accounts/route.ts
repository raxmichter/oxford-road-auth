import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { phylloClient } from "@/lib/phyllo/client"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const guestId = cookieStore.get("phyllo_guest_id")?.value

    if (!guestId) {
      return NextResponse.json({ accounts: [] })
    }

    // Get Phyllo user by external ID
    let phylloUser
    try {
      phylloUser = await phylloClient.getUserByExternalId(guestId)
    } catch {
      return NextResponse.json({ accounts: [] })
    }

    // Get accounts from Phyllo API
    const response = await phylloClient.getAccounts(phylloUser.id)

    // Find or create user and sync accounts to database
    let user = await prisma.user.findFirst({
      where: { phylloUserId: phylloUser.id },
    })

    if (!user && response.data.length > 0) {
      user = await prisma.user.create({
        data: {
          phylloUserId: phylloUser.id,
          phylloExternalId: guestId,
          name: phylloUser.name || "Guest User",
        },
      })
    }

    // Sync accounts to database
    if (user) {
      for (const account of response.data) {
        await prisma.phylloAccount.upsert({
          where: { id: account.id },
          create: {
            id: account.id,
            userId: user.id,
            phylloUserId: phylloUser.id,
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
      }
    }

    return NextResponse.json({ accounts: response.data })
  } catch (error) {
    console.error("Error fetching accounts:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch accounts" },
      { status: 500 }
    )
  }
}

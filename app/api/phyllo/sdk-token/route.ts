import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { phylloClient } from "@/lib/phyllo/client"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json().catch(() => ({}))
    const products = body.products || ["IDENTITY", "ENGAGEMENT", "ENGAGEMENT.AUDIENCE"]

    let phylloUserId: string

    if (session?.user?.id) {
      // Authenticated user - use their stored Phyllo user ID
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { phylloUserId: true, name: true, email: true },
      })

      phylloUserId = user?.phylloUserId || ""

      // If no Phyllo user exists, create one
      if (!phylloUserId) {
        const userName = user?.name || user?.email || "User"
        const phylloUser = await phylloClient.createUser(userName, session.user.id)
        phylloUserId = phylloUser.id

        // Store Phyllo user ID
        await prisma.user.update({
          where: { id: session.user.id },
          data: { phylloUserId: phylloUser.id },
        })
      }
    } else {
      // Unauthenticated user - create or retrieve guest Phyllo user
      const cookieStore = await cookies()
      let guestId = cookieStore.get("phyllo_guest_id")?.value

      if (guestId) {
        // Try to get existing Phyllo user
        try {
          const existingUser = await phylloClient.getUserByExternalId(guestId)
          phylloUserId = existingUser.id
        } catch {
          // User doesn't exist, create new one
          guestId = `guest_${crypto.randomUUID()}`
          const phylloUser = await phylloClient.createUser("Guest User", guestId)
          phylloUserId = phylloUser.id
        }
      } else {
        // Create new guest user
        guestId = `guest_${crypto.randomUUID()}`
        const phylloUser = await phylloClient.createUser("Guest User", guestId)
        phylloUserId = phylloUser.id
      }

      // Create SDK token
      const sdkToken = await phylloClient.createSDKToken(phylloUserId, products)

      // Create response with cookie
      const response = NextResponse.json({
        token: sdkToken.sdk_token,
        userId: phylloUserId,
        guestId,
        expiresAt: sdkToken.expires_at,
      })

      response.cookies.set("phyllo_guest_id", guestId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return response
    }

    // Create SDK token for authenticated user
    const sdkToken = await phylloClient.createSDKToken(phylloUserId, products)

    return NextResponse.json({
      token: sdkToken.sdk_token,
      userId: phylloUserId,
      expiresAt: sdkToken.expires_at,
    })
  } catch (error) {
    console.error("Error creating SDK token:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create SDK token" },
      { status: 500 }
    )
  }
}

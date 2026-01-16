import { NextResponse } from "next/server"
import { phylloClient } from "@/lib/phyllo/client"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const products = body.products || ["IDENTITY", "ENGAGEMENT", "ENGAGEMENT.AUDIENCE"]

    const cookieStore = await cookies()
    let guestId = cookieStore.get("phyllo_guest_id")?.value
    let phylloUserId: string

    if (guestId) {
      try {
        const existingUser = await phylloClient.getUserByExternalId(guestId)
        phylloUserId = existingUser.id
      } catch {
        guestId = `guest_${crypto.randomUUID()}`
        const phylloUser = await phylloClient.createUser("Guest User", guestId)
        phylloUserId = phylloUser.id
      }
    } else {
      guestId = `guest_${crypto.randomUUID()}`
      const phylloUser = await phylloClient.createUser("Guest User", guestId)
      phylloUserId = phylloUser.id
    }

    const sdkToken = await phylloClient.createSDKToken(phylloUserId, products)

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
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error("Error creating SDK token:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create SDK token" },
      { status: 500 }
    )
  }
}

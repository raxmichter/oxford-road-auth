import { NextRequest, NextResponse } from "next/server"

// Phyllo webhook event types
interface PhylloWebhookEvent {
  event: string
  name: string
  data: {
    id: string
    user_id: string
    account_id?: string
    work_platform_id?: string
    status?: string
    [key: string]: unknown
  }
  created_at: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PhylloWebhookEvent = await request.json()

    console.log("Phyllo webhook received:", JSON.stringify(body, null, 2))

    // Handle different webhook events
    switch (body.event) {
      case "ACCOUNTS.CONNECTED":
        console.log(`Account connected: ${body.data.id} for user ${body.data.user_id}`)
        // You could sync data here or trigger a background job
        break

      case "ACCOUNTS.DISCONNECTED":
        console.log(`Account disconnected: ${body.data.id} for user ${body.data.user_id}`)
        break

      case "ACCOUNTS.SESSION_EXPIRED":
        console.log(`Account session expired: ${body.data.id} for user ${body.data.user_id}`)
        // You might want to notify the user to reconnect
        break

      case "PROFILES.ADDED":
        console.log(`Profile added: ${body.data.id} for user ${body.data.user_id}`)
        break

      case "PROFILES.UPDATED":
        console.log(`Profile updated: ${body.data.id} for user ${body.data.user_id}`)
        break

      case "CONTENTS.ADDED":
        console.log(`Content added: ${body.data.id} for user ${body.data.user_id}`)
        break

      case "CONTENTS.UPDATED":
        console.log(`Content updated: ${body.data.id} for user ${body.data.user_id}`)
        break

      default:
        console.log(`Unknown event type: ${body.event}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error("Phyllo webhook error:", error)
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    )
  }
}

// Handle GET requests (for webhook verification if needed)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get("challenge")

  if (challenge) {
    // Return challenge for webhook verification
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ status: "Phyllo webhook endpoint active" })
}

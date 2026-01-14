import { NextRequest, NextResponse } from "next/server"

// GET request handles Meta's webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    // Verification successful - return the challenge
    return new NextResponse(challenge, { status: 200 })
  }

  // Verification failed
  return new NextResponse("Forbidden", { status: 403 })
}

// POST request handles incoming webhook events
export async function POST(request: NextRequest) {
  const body = await request.json()

  // Log webhook events (customize as needed)
  console.log("Instagram webhook event:", JSON.stringify(body, null, 2))

  // Always return 200 to acknowledge receipt
  return new NextResponse("OK", { status: 200 })
}

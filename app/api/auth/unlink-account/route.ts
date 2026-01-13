import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { unlinkAccount } from "@/lib/auth/account-linking"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { accountId } = await request.json()

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 })
    }

    const result = await unlinkAccount(session.user.id, accountId)

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Unlink account error:", error)
    return NextResponse.json(
      { error: "Failed to unlink account" },
      { status: 500 }
    )
  }
}

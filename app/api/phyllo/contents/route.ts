import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { phylloClient } from "@/lib/phyllo/client"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get("account_id")
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const offset = parseInt(searchParams.get("offset") || "0", 10)

    // Get Phyllo user ID from our database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phylloUserId: true },
    })

    if (!user?.phylloUserId) {
      return NextResponse.json({ contents: [], metadata: { offset: 0, limit, total: 0 } })
    }

    // Get contents from Phyllo
    const response = await phylloClient.getContents(
      accountId || undefined,
      user.phylloUserId,
      limit,
      offset
    )

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

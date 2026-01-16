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

    // Get Phyllo user ID from our database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phylloUserId: true },
    })

    if (!user?.phylloUserId) {
      return NextResponse.json({ profiles: [] })
    }

    // Get profiles from Phyllo
    const response = await phylloClient.getProfiles(
      accountId || undefined,
      user.phylloUserId
    )

    return NextResponse.json({ profiles: response.data })
  } catch (error) {
    console.error("Error fetching profiles:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch profiles" },
      { status: 500 }
    )
  }
}

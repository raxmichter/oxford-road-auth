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

    // Get Phyllo user ID from our database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phylloUserId: true },
    })

    if (!user?.phylloUserId) {
      return NextResponse.json({ accounts: [] })
    }

    // Get accounts from Phyllo
    const response = await phylloClient.getAccounts(user.phylloUserId)

    return NextResponse.json({ accounts: response.data })
  } catch (error) {
    console.error("Error fetching accounts:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch accounts" },
      { status: 500 }
    )
  }
}

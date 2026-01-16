import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { phylloClient } from "@/lib/phyllo/client"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const userName = session.user.name || session.user.email || "User"

    // Check if user already has a Phyllo user ID stored
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phylloUserId: true },
    })

    if (user?.phylloUserId) {
      // User already has a Phyllo account, return existing user
      try {
        const phylloUser = await phylloClient.getUser(user.phylloUserId)
        return NextResponse.json({ user: phylloUser })
      } catch {
        // Phyllo user might not exist anymore, create a new one
      }
    }

    // Create new Phyllo user
    const phylloUser = await phylloClient.createUser(userName, userId)

    // Store Phyllo user ID in our database
    await prisma.user.update({
      where: { id: userId },
      data: { phylloUserId: phylloUser.id },
    })

    return NextResponse.json({ user: phylloUser })
  } catch (error) {
    console.error("Error creating Phyllo user:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create Phyllo user" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phylloUserId: true },
    })

    if (!user?.phylloUserId) {
      return NextResponse.json({ error: "No Phyllo user found" }, { status: 404 })
    }

    const phylloUser = await phylloClient.getUser(user.phylloUserId)
    return NextResponse.json({ user: phylloUser })
  } catch (error) {
    console.error("Error getting Phyllo user:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get Phyllo user" },
      { status: 500 }
    )
  }
}

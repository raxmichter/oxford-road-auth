import { prisma } from "@/lib/prisma"

export async function canLinkAccount(
  userId: string,
  provider: string
): Promise<{ canLink: boolean; reason?: string }> {
  const existingAccount = await prisma.account.findFirst({
    where: {
      userId,
      provider,
    },
  })

  if (existingAccount) {
    return {
      canLink: false,
      reason: "Account from this provider is already connected",
    }
  }

  return { canLink: true }
}

export async function unlinkAccount(
  userId: string,
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
    })

    if (!account) {
      return { success: false, error: "Account not found or unauthorized" }
    }

    const accountCount = await prisma.account.count({
      where: { userId },
    })

    if (accountCount === 1) {
      return {
        success: false,
        error: "Cannot remove the last connected account",
      }
    }

    await prisma.account.delete({
      where: { id: accountId },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to unlink account" }
  }
}

export async function getLinkedAccounts(userId: string) {
  return prisma.account.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      providerAccountId: true,
      profile: true,
      createdAt: true,
      lastSyncedAt: true,
      _count: {
        select: {
          posts: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  })
}

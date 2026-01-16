/**
 * Phyllo Constants
 * These can be safely imported on both client and server
 */

// Work Platform IDs
export const WORK_PLATFORMS = {
  instagram: "9bb8913b-ddd9-430b-a66a-d74d846e6c66",
  tiktok: "de55aeec-0dc8-4119-bf90-16b3d1f0c987",
  youtube: "14d9ddf5-51c6-415e-bde6-f8ed36ad7054",
  twitter: "7645460a-96e0-4192-a3ce-a1fc30641f72",
  facebook: "ad2fec62-2987-40a0-89fb-23485972598c",
  twitch: "e4de6c01-5b78-4fc0-a651-24f44134457b",
} as const

export type WorkPlatformName = keyof typeof WORK_PLATFORMS

// Reverse mapping for platform ID to name
export const PLATFORM_ID_TO_NAME: Record<string, WorkPlatformName> = Object.entries(
  WORK_PLATFORMS
).reduce(
  (acc, [name, id]) => {
    acc[id] = name as WorkPlatformName
    return acc
  },
  {} as Record<string, WorkPlatformName>
)

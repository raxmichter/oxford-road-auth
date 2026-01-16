"use client"

import { useEffect, useState } from "react"
import type { PhylloContent } from "@/lib/phyllo/client"

export function PhylloContentCard() {
  const [contents, setContents] = useState<PhylloContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContents() {
      try {
        const response = await fetch("/api/phyllo/contents?limit=20")
        if (!response.ok) throw new Error("Failed to fetch contents")
        const data = await response.json()
        setContents(data.contents)
      } catch (err) {
        console.error("Error fetching contents:", err)
        setError(err instanceof Error ? err.message : "Failed to load contents")
      } finally {
        setIsLoading(false)
      }
    }

    fetchContents()
  }, [])

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "—"
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getContentTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "VIDEO":
      case "REEL":
      case "STORY":
        return "🎬"
      case "IMAGE":
      case "PHOTO":
        return "📷"
      case "CAROUSEL":
        return "🎠"
      case "TWEET":
        return "💬"
      default:
        return "📄"
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Content</h2>
        <div className="flex items-center justify-center py-8">
          <svg
            className="animate-spin size-8 text-white/50"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Content</h2>
        <p className="text-red-400 text-center py-4">{error}</p>
      </div>
    )
  }

  if (contents.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Content</h2>
        <p className="text-white/50 text-center py-8">
          No content found. Connect an account and your posts will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
      <h2 className="text-xl font-semibold text-white mb-4">Recent Content</h2>

      <div className="space-y-4">
        {contents.map((content) => (
          <div
            key={content.id}
            className="p-4 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors"
          >
            <div className="flex gap-4">
              {/* Thumbnail */}
              {content.thumbnail_url ? (
                <img
                  src={content.thumbnail_url}
                  alt={content.title || "Content thumbnail"}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">{getContentTypeIcon(content.type)}</span>
                </div>
              )}

              {/* Content Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <img
                    src={content.work_platform.logo_url}
                    alt={content.work_platform.name}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-white/50 text-xs">{content.work_platform.name}</span>
                  <span className="text-white/30 text-xs">•</span>
                  <span className="text-white/50 text-xs">{formatDate(content.published_at)}</span>
                </div>

                <h3 className="text-white font-medium truncate mb-2">
                  {content.title || content.description?.slice(0, 50) || "Untitled"}
                </h3>

                {/* Engagement Stats */}
                <div className="flex gap-4 text-sm">
                  {content.engagement.view_count !== null && (
                    <div className="flex items-center gap-1">
                      <span className="text-white/50">👁</span>
                      <span className="text-white">
                        {formatNumber(content.engagement.view_count)}
                      </span>
                    </div>
                  )}
                  {content.engagement.like_count !== null && (
                    <div className="flex items-center gap-1">
                      <span className="text-white/50">❤️</span>
                      <span className="text-white">
                        {formatNumber(content.engagement.like_count)}
                      </span>
                    </div>
                  )}
                  {content.engagement.comment_count !== null && (
                    <div className="flex items-center gap-1">
                      <span className="text-white/50">💬</span>
                      <span className="text-white">
                        {formatNumber(content.engagement.comment_count)}
                      </span>
                    </div>
                  )}
                  {content.engagement.share_count !== null && (
                    <div className="flex items-center gap-1">
                      <span className="text-white/50">🔄</span>
                      <span className="text-white">
                        {formatNumber(content.engagement.share_count)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Link */}
              {content.url && (
                <a
                  href={content.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

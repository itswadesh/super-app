/**
 * Utility functions for YouTube video handling
 */

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function extractYoutubeId(url: string): string | null {
  if (!url) return null

  // Regex patterns for different YouTube URL formats
  const patterns = [
    // Standard youtube.com/watch?v=ID format
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/,
    // youtu.be/ID format
    /youtu\.be\/([\w-]{11})/,
    // youtube.com/embed/ID format
    /youtube\.com\/embed\/([\w-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Generate YouTube thumbnail URL from video ID
 * YouTube provides several thumbnail options: default, hqdefault, mqdefault, sddefault, maxresdefault
 * hqdefault offers a good balance of quality and reliability
 */
export function getYoutubeThumbnailUrl(youtubeId: string | null): string | null {
  if (!youtubeId) return null
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
}

/**
 * Process a video object to include YouTube information
 * @param video The video object to process
 * @returns The video with YouTube ID and thumbnail added
 */
export function processYoutubeVideo<
  T extends { videoUrl?: string | null; youtubeId?: string | null; thumbnailUrl?: string | null },
>(video: T): T {
  // Extract YouTube ID from video URL if not already set
  const youtubeId = video.youtubeId || extractYoutubeId(video.videoUrl || '')

  // Generate YouTube thumbnail URL if we have a valid YouTube ID
  const youtubeThumbnail = getYoutubeThumbnailUrl(youtubeId)

  return {
    ...video,
    youtubeId,
    // Use YouTube thumbnail if available, otherwise fall back to stored thumbnail
    thumbnailUrl: youtubeThumbnail || video.thumbnailUrl || null,
  }
}

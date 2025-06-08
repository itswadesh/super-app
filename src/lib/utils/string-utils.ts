/**
 * Utility functions for string manipulation
 */

/**
 * Convert a string to a URL-friendly slug
 * @param str Input string to convert to a slug
 * @param options Optional configuration options
 * @returns A URL-friendly slug string
 */
export function slugify(str: string, options?: { lower?: boolean; strict?: boolean; trim?: boolean }) {
  // Default options
  const opts = {
    lower: true,
    strict: true,
    trim: true,
    ...options,
  }

  // Convert to lowercase if needed
  let result = opts.lower ? str.toLowerCase() : str

  // Replace spaces with hyphens
  result = result.replace(/\s+/g, '-')

  // Remove special characters if strict mode is enabled
  if (opts.strict) {
    // Keep only alphanumeric characters and hyphens
    result = result.replace(/[^a-z0-9\-]/g, '')
  } else {
    // Just remove the most problematic characters
    result = result.replace(/[^a-z0-9\-_~:\.\[\]@!\$&'\(\)\*\+,;=]/g, '')
  }

  // Remove duplicate hyphens
  result = result.replace(/-+/g, '-')

  // Trim hyphens from start and end if requested
  if (opts.trim) {
    result = result.replace(/^-|-$/g, '')
  }

  return result
}

/**
 * Generate a unique slug by appending a number if the base slug already exists
 * @param baseText The text to convert to a slug
 * @param existingSlugs Array of existing slugs to check against
 * @param options Optional configuration options for slugify
 * @returns A unique slug string
 */
export async function generateUniqueSlug(
  baseText: string,
  existingSlugs: string[] | ((slug: string) => Promise<boolean> | boolean),
  options?: { lower?: boolean; strict?: boolean; trim?: boolean }
): Promise<string> {
  // Generate the base slug
  let slug = slugify(baseText, options)
  let counter = 1
  const originalSlug = slug

  // Check if we need to check for existing slugs
  const slugExists = async (s: string): Promise<boolean> => {
    if (Array.isArray(existingSlugs)) {
      return existingSlugs.includes(s)
    }
    return existingSlugs(s)
  }

  // Keep incrementing the counter until we find a unique slug
  while (await slugExists(slug)) {
    slug = `${originalSlug}-${counter}`
    counter++
  }

  return slug
}

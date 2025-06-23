interface MetadataObject {
  [key: string]: unknown
}

/**
 * Safely gets a value from metadata by key
 * @param metadata - The metadata object or JSON string
 * @param key - The key to look up in the metadata
 * @returns The value if found, otherwise null
 */
export function getMetadataValue(metadata: unknown, key: string): string | null {
  try {
    if (!metadata) return null
    const metaObj =
      typeof metadata === 'string'
        ? (JSON.parse(metadata) as MetadataObject)
        : (metadata as MetadataObject)
    const value = metaObj?.[key]
    return typeof value === 'string' ? value : null
  } catch (e) {
    return null
  }
}

/**
 * Checks if a metadata key matches a specific value
 * @param metadata - The metadata object or JSON string
 * @param key - The key to check in the metadata
 * @param value - The value to match against
 * @returns boolean indicating if the metadata matches the filter
 */
export function parseMetadataFilter(metadata: unknown, key: string, value: string): boolean {
  const metadataValue = getMetadataValue(metadata, key)
  return metadataValue === value
}

/**
 * Gets unique values from an array of items with metadata
 * @param items - Array of items with metadata
 * @param key - The metadata key to extract values from
 * @returns Sorted array of unique values
 */
export function getUniqueMetadataValues<T extends string>(
  items: Array<{ metadata: unknown }>,
  key: string
): T[] {
  const values = new Set<T>()

  for (const item of items) {
    if (!item.metadata) continue
    const value = getMetadataValue(item.metadata, key)
    if (value) values.add(value as T)
  }

  return Array.from(values).sort()
}

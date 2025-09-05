import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
  // Extract query parameters for client-side use
  const searchParams = url.searchParams

  return {
    initialSearchQuery: searchParams.get('q') || '',
    initialCategory: searchParams.get('category') || 'all',
    initialVegetarian: searchParams.get('vegetarian') || undefined,
    initialPage: parseInt(searchParams.get('page') || '1', 10),
  }
}

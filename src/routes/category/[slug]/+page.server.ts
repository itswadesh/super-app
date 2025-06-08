import { db } from '$lib/server/db'
import { categories, notes, quizzes, videos } from '$lib/server/db/schema'
import { processYoutubeVideo } from '$lib/utils/youtube'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load = (async ({ params, url }) => {
  const slug = params.slug
  const page = Number.parseInt(url.searchParams.get('page') || '1')
  const limit = Number.parseInt(url.searchParams.get('limit') || '12')
  const resourceType = url.searchParams.get('type') || 'all' // 'all', 'videos', 'notes', 'quizzes'
  const sort = url.searchParams.get('sort') || 'newest'
  const search = url.searchParams.get('search') || ''

  try {
    // Get the category by slug
    const categoryResults = await db.select().from(categories).where(eq(categories.slug, slug))

    if (!categoryResults || categoryResults.length === 0) {
      throw error(404, 'Category not found')
    }

    const category = categoryResults[0]

    // Fetch resources based on the category
    let videoResults: any[] = []
    let noteResults: any[] = []
    let quizResults: any[] = []

    // Get videos in this category
    if (resourceType === 'all' || resourceType === 'videos') {
      videoResults = await db.select().from(videos).where(eq(videos.categoryId, category.id))

      // Process videos to include YouTube information
      videoResults = videoResults.map((video) => processYoutubeVideo(video))
    }

    // Get notes in this category
    if (resourceType === 'all' || resourceType === 'notes') {
      noteResults = await db.select().from(notes).where(eq(notes.categoryId, category.id))
    }

    // Get quizzes in this category
    if (resourceType === 'all' || resourceType === 'quizzes') {
      quizResults = await db.select().from(quizzes).where(eq(quizzes.categoryId, category.id))
    }

    // Combine all resources and add a type field
    const allResources = [
      ...videoResults.map((v) => ({ ...v, resourceType: 'video' })),
      ...noteResults.map((n) => ({ ...n, resourceType: 'note' })),
      ...quizResults.map((q) => ({ ...q, resourceType: 'quiz' })),
    ]

    // Apply search filter if needed
    let filteredResources = allResources
    if (search) {
      const searchLower = search.toLowerCase()
      filteredResources = filteredResources.filter(
        (item) =>
          item.title?.toLowerCase().includes(searchLower) || item.description?.toLowerCase().includes(searchLower),
      )
    }

    // Filter results based on type if needed
    if (resourceType !== 'all') {
      // Convert plural to singular for comparison
      const singularType = resourceType.endsWith('s') ? resourceType.slice(0, -1) : resourceType

      filteredResources = filteredResources.filter((r) => r.resourceType === singularType)
    }

    // Apply sorting
    filteredResources = filteredResources.sort((a, b) => {
      switch (sort) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    // Calculate pagination
    const totalResources = filteredResources.length
    const totalPages = Math.ceil(totalResources / limit)
    const offset = (page - 1) * limit
    const paginatedResources = filteredResources.slice(offset, offset + limit)

    // Get subcategories
    const subcategories = await db.select().from(categories).where(eq(categories.parentId, category.id))

    return {
      category,
      resources: paginatedResources,
      subcategories,
      resourceCounts: {
        videos: videoResults.length,
        notes: noteResults.length,
        quizzes: quizResults.length,
        total: allResources.length,
      },
      pagination: {
        totalItems: totalResources,
        itemsPerPage: limit,
        currentPage: page,
        totalPages,
      },
      filters: {
        type: resourceType,
        search,
        sort,
      },
    }
  } catch (e) {
    console.error('Error fetching category:', e)
    throw error(404, 'Category not found')
  }
}) satisfies PageServerLoad

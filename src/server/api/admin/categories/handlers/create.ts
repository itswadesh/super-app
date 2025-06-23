import { eq, sql, and, notInArray } from 'drizzle-orm'
import type { Context } from 'hono'
import { nanoid } from 'nanoid'
import { Category } from '../../../../../server/db/schema'
import { getSessionTokenCookie, validateSessionToken } from '../../../../../server/db/auth'
import type { CreateCategoryInput, CategoryResponse } from '../types'
import { db } from '../../../../db'
import { generateUniqueSlug } from '../../../../../lib/utils/string-utils'

export async function createCategory(c: Context): Promise<Response> {
  // Check authentication
  const sessionToken = getSessionTokenCookie(c)
  const session = await validateSessionToken(sessionToken || '')
  if (!session || session.user?.role !== 'admin') {
    throw { status: 403, message: 'Unauthorized. Only admin users can create category.' }
  }
  const data = await c.req.json()
  const {
    id = 'new',
    name = '',
    description = null,
    slug = '',
    parentId = null,
    isActive = true,
  } = data

  // Common fields for both category types
  const commonFields = {
    name: name.trim(),
    description: description?.trim() || null,
    parentId: parentId || null,
    isActive: Boolean(isActive),
  }

  // Extract any additional fields if needed
  const { youtubeId, categoryUrl, thumbnailUrl, duration, quality } = data

  if (parentId) {
    const category = await db.query.Category.findFirst({ where: eq(Category.id, parentId) })
    if (!category) {
      throw { status: 400, message: 'Category not found' }
    }
  }
  // Validate required fields
  if (!commonFields.name) {
    return c.json(
      {
        success: false,
        message: 'Category name is required',
      },
      400
    )
  }

  const now = new Date()
  if (id !== 'new') {
    const findCategory = await db.query.Category.findFirst({ where: eq(Category.id, id) })
    if (!findCategory) {
      throw { status: 404, message: 'Category not found' }
    }
    // Generate a unique slug if the name or slug has changed
    const existingCategory = await db.select().from(Category).where(eq(Category.id, id)).get()

    const baseSlug = slug || name
    let uniqueSlug = existingCategory?.slug

    // Only update the slug if the name or slug has changed
    if (existingCategory?.name !== name || (slug && existingCategory?.slug !== slug)) {
      // Get all existing slugs except the current one
      const existingSlugs = (
        await db
          .select({ slug: Category.slug })
          .from(Category)
          .where(notInArray(Category.id, [id]))
      ).map(({ slug }) => slug)

      uniqueSlug = await generateUniqueSlug(baseSlug, existingSlugs, { lower: true, strict: true })
    }

    // Update existing category
    const category = await db
      .update(Category)
      .set({
        name,
        description,
        slug: uniqueSlug,
        parentId,
        isActive,
        // updatedAt: now
      })
      .where(eq(Category.id, id))
      .returning()
      .get()

    return c.json({
      success: true,
      message: 'Category updated successfully',
      category,
    })
  }

  const newId = nanoid()

  // Generate a unique slug
  const baseSlug = (slug || name).trim()

  try {
    // Get all existing slugs from the database
    const existingSlugs = (await db.select({ slug: Category.slug }).from(Category)).map(
      ({ slug }) => slug
    )

    // Generate a unique slug
    const uniqueSlug = await generateUniqueSlug(baseSlug, existingSlugs, {
      lower: true,
      strict: true,
    })

    // Create category entry
    const category = await db
      .insert(Category)
      .values({
        ...commonFields,
        id: newId,
        slug: uniqueSlug,
        isActive: commonFields.isActive,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get()

    return c.json({
      success: true,
      message: 'Category added successfully',
      category,
    })
  } catch (error) {
    console.error('Error creating category:', error)
    throw {
      status: 500,
      message: 'Failed to create category',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

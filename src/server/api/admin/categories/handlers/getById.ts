import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { Category } from '../../../../../server/db/schema'
import { getSessionTokenCookie, validateSessionToken } from '../../../../../server/db/auth'
import type { CategoryResponse } from '../types'
import { db } from '../../../../db'

export async function getCategoryById(c: Context): Promise<Response> {
  const url = new URL(c.req.url)
  const sessionToken = getSessionTokenCookie(c)
  const session = await validateSessionToken(sessionToken || '')
  const parentId = url.searchParams.get('id')
  let category: CategoryResponse = {}
  if (!parentId) {
    throw { status: 400, message: 'Category ID required' }
  }
  const categorys = await db.select().from(Category).where(eq(Category.id, parentId))

  if (categorys.length === 0) {
    throw { status: 404, message: 'Category not found' }
  }

  category = categorys[0]
  return c.json({
    id: category.id,
    name: category.name,
    description: category.description,
    thumbnailUrl: category.thumbnailUrl,
    isPaid: true,
    hasAccess: false,
  })
}

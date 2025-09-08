import { db } from '../../../server/db'
import { User } from '../../../server/db/schema'
import { eq } from 'drizzle-orm'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  try {
    // Get the logged-in user data
    const userId = locals.user?.id

    if (!userId) {
      return {
        user: null,
      }
    }

    // Fetch user data to prefill the form
    const user = await db
      .select({
        id: User.id,
        name: User.name,
        businessName: User.businessName,
        email: User.email,
        phone: User.phone,
      })
      .from(User)
      .where(eq(User.id, userId))
      .limit(1)

    return {
      user: user.length > 0 ? user[0] : null,
    }
  } catch (error) {
    console.error('Error loading user data for apply page:', error)
    return {
      user: null,
    }
  }
}

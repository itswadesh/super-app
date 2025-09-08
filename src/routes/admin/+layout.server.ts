import type { LayoutServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: LayoutServerLoad = async ({ locals }) => {
  // Check if user is authenticated and has admin role
  console.log(locals.user, '...............')
  if (!locals.user) {
    throw redirect(302, '/auth/login')
  }
  if (locals.user.role !== 'admin') {
    throw redirect(302, '/')
  }

  return {
    user: locals.user,
  }
}

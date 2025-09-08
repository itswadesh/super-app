import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ locals }) => {
  console.log(locals.user, '...............')
  // Check if user is authenticated and has admin role
  if (!locals.user) {
    throw redirect(302, '/auth/login')
  }
  // if (locals.user.role !== 'admin') {
  //   throw redirect(302, '/')
  // }

  return {
    user: locals.user,
  }
}

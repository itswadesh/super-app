export const load = async ({ locals }) => {
  console.log('ROLE::', locals.user?.role)

  return { user: locals.user }
}

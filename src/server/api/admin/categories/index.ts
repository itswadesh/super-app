import { Hono } from 'hono'
import { listCategories } from './handlers/list'
import { createCategory } from './handlers/create'
import { getCategoryById } from './handlers/getById'

// Create the main router
const categoryRoutes = new Hono()

// Register all routes
categoryRoutes
  .get('/', listCategories) // GET /categories
  .post('/', createCategory) // POST /categories
  .get('/:id', getCategoryById) // GET /categories/:id

// Export the routes
export { categoryRoutes }

import { Hono } from 'hono'
import { deleteVendor } from './handlers/delete'
import { getVendorById } from './handlers/getById'
import { listVendors } from './handlers/list'
import { createVendor } from './handlers/create'
import { updateVendor } from './handlers/update'

// Create the main router
export const authorRoutes = new Hono()

// Register all routes
authorRoutes
  .get('/', listVendors) // GET /authors
  .post('/', createVendor) // POST /authors
  .get('/:id', getVendorById) // GET /authors/:id
  .put('/:id', updateVendor) // PUT /authors/:id
  .delete('/:id', deleteVendor) // DELETE /authors/:id

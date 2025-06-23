import { Hono } from 'hono'
import { deleteUser } from './handlers/delete'
import { getUserById } from './handlers/getById'
import { listUsers } from './handlers/list'
import { createUser } from './handlers/create'
import { updateUser } from './handlers/update'

// Create the users router
export const userRoutes = new Hono()

// Register all routes
userRoutes
  .get('/', listUsers) // GET /users
  .post('/', createUser) // POST /users
  .get('/:id', getUserById) // GET /users/:id
  .put('/:id', updateUser) // PUT /users/:id
  .delete('/:id', deleteUser) // DELETE /users/:id

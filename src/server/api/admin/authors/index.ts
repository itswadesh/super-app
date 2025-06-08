import { Hono } from 'hono';
import { deleteAuthor } from './handlers/delete';
import { getAuthorById } from './handlers/getById';
import { listAuthors } from './handlers/list';
import { createAuthor } from './handlers/create';
import { updateAuthor } from './handlers/update';

// Create the main router
export const authorRoutes = new Hono();

// Register all routes
authorRoutes
  .get('/', listAuthors) // GET /authors
  .post('/', createAuthor) // POST /authors
  .get('/:id', getAuthorById) // GET /authors/:id
  .put('/:id', updateAuthor) // PUT /authors/:id
  .delete('/:id', deleteAuthor); // DELETE /authors/:id

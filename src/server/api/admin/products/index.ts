import { Hono } from 'hono';
import { listProducts } from './handlers/list';
import { createProduct } from './handlers/create';
import { getProductById } from './handlers/getById';

// Create the main router
export const productRoutes = new Hono();

// Register all routes
productRoutes
  .get('/', listProducts) // GET /products
  .post('/', createProduct) // POST /products
  .get('/:id', getProductById); // GET /products/:id

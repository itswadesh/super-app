import { Hono } from 'hono'
import { createCoupon } from './handlers/create'
import { deleteCoupon } from './handlers/delete'
import { getCouponById } from './handlers/getById'
import { listCoupons } from './handlers/list'
import { updateCoupon } from './handlers/update'

// Create the main router
export const couponRoutes = new Hono()

// Register all routes
couponRoutes
  .get('/', listCoupons) // GET /admin/coupons
  .post('/', createCoupon) // POST /admin/coupons
  .get('/:id', getCouponById) // GET /admin/coupons/:id
  .put('/:id', updateCoupon) // PUT /admin/coupons/:id
  .delete('/:id', deleteCoupon) // DELETE /admin/coupons/:id

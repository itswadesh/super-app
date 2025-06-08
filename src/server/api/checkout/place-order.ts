import { nanoid } from 'nanoid'
import { db } from '../../db'
import { Order } from '../../db/schema'
import { parsePhoneNumber } from './utils'
import { sql } from 'drizzle-orm'

// Place an order
// export async function placeOrder(params: {
//   pg_name: string
//   total_amount: number
//   plan_id: string
//   phone?: string
//   couponCode?: string
// }) {
//   try {
//     const { pg_name, total_amount, plan_id, phone, couponCode } = params

//     // Generate order number
//     const orderNo = `LR${Date.now().toString().substring(3)}`

//     // Create the order
//     const orderId = nanoid()
//     const [order] = await db
//       .insert(Order)
//       .values({
//         id: orderId,
//         plan_id,
//         total_amount,
//         pg_name,
//         order_no: orderNo,
//         phone: phone ? parsePhoneNumber(phone) : undefined,
//         coupon_code: couponCode,
//         created_at: sql`(strftime('%s', 'now'))`,
//         updated_at: sql`(strftime('%s', 'now'))`,
//       })
//       .returning()

//     return order
//   } catch (error) {
//     console.error('Error placing order:', error)
//     throw new Error('Failed to place order')
//   }
// }

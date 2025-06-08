import { type Context as HonoContext, Hono } from 'hono'
import { confirmOrder } from '../utils'

export const capturePhonepe = async ({
  c,
  orderNo,
  origin,
}: { c: HonoContext; orderNo: string; origin: string }) => {
  console.log('PhonePe callback received')
  const text = await c.req.text()
  const textData = text.split('&')
  const status = textData[0].split('=')[1]
  const args = await c.req.query()

  if (status === 'PAYMENT_SUCCESS') {
    await confirmOrder(args.order_no, true)
    return c.redirect(`${origin}/subscription/process?order_no=${args.order_no}&pg=phonepe`)
  }
  return c.redirect(`${origin}/subscription/process?order_no=${args.order_no}&pg=phonepe`)
}

import 'dotenv/config'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { ulid } from 'ulid'


export const getSortingParams = (sort: string, sortlist: string[] = []) => {
  if (!sortlist.includes(sort)) {
    sort = 'createdAt'
  }

  let desc = false
  if (sort[0] === '-') {
    desc = true
    sort = sort.slice(1) // Removes the first character
  }

  return { sort, desc }
}

/**
 * Generate a composed id based on the input parameters and return either the is if it exists or the generated one.
 * @param idProperty
 * @param prefix
 */
export function generateEntityId(prefix?: string): string {
  const id = ulid()
  // console.log(id)
  prefix = prefix ? `${prefix}_` : ''
  return `${prefix}${id}`
}

export function generateSlug(str: string, type?: string): string {
  if (str) {
    return str
  }

  const rawSlug = str
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '')

  return rawSlug
}

export const removeUndefined = (obj: any) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null))
}

export const validateToken = async (c, next) => {
  // const protectedRoutes = ['/api/users', '/api/orders']
  // if (c.req.path.startsWith('/users') || c.req.path.startsWith('/orders')) {
  // 	await next()
  // }
  const sid = getCookie(c, 'connect.sid')
  if (!sid) {
    return c.json(
      {
        success: false,
        message: 'Invalid token, Please login again.',
      },
      422
    )
  }
  try {
    const data = await verify(sid, process.env.TOKEN_SECRET)
    // console.log('🚀 ~ validateToken ~ sid....:', data)
    if (!data) {
      return c.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        422
      )
    }
    c.req.user = data
    await next()
  } catch (e) {
    // console.log('🚀 ~ validateToken ~ e....:', JSON.stringify(e))
    return c.json(
      {
        success: false,
        message: e.message || 'Invalid token, Please login again',
      },
      422
    )
  }
}

export const parsePhoneNumber = (phone, country_code = '+91') => {
  if (!phone) return
  const regex =
    /(\+?\d{1,3}\s*[\-.\s]?)?\(?\d{3}\)?[\-.\s]?\d{3}[\-.\s]?\d{4}|\d{5}\s*\d{5}|(\+?\d{1,3}[\-.\s]?)?(\d{10}|\d{5}\s*\d{5}|\d{3}[\-.\s]?\d{3}[\-.\s]?\d{4}|\d{2}\s*\d{3}\s*\d{3}\s*\d{2}|\d{2}\s*\-\s*\d{3}\s*\-\s*\d{3}\s*\-\s*\d{2})/
  const match = phone.match(regex)
  const phoneNumber = match
    ? match[0].includes('+')
      ? match[0].replace(/[^+\d]/g, '')
      : country_code + match[0].replace(/[^+\d]/g, '').replace(/^0/, '')
    : null
  return phoneNumber
}

import { goto } from '$app/navigation'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const separateSlugs = (slug: string) => {
  // Split the slug by '/'
  const slugArray = slug && slug.split('/')

  // Initialize an object to store the segments
  const segments: any = {}

  // Iterate through the segments and store them in the object
  for (let i = 0; i < slugArray.length; i++) {
    segments[`slug${i + 1}`] = slugArray[i]
  }

  // Get the last element of the array
  const lastSlug = slugArray.length > 0 ? slugArray[slugArray.length - 1] : ''

  // Add lastSlug property to the object
  segments.lastSlug = lastSlug

  return segments
}

export const goback = () => {
  if (history.length < 3) {
    goto('/')
  } else {
    window.history.go(-1)
  }
}

export const decorate = (title: string) => {
  return `${title} – Misiki`
}

export function constructURL2(url: string, fl: any) {
  url += '?'
  Object.keys(fl).forEach((e) => {
    if (e == 'page') return
    if (fl[e] && fl[e] !== 'undefined' && fl[e].length > 0)
      url += `${e}=${encodeURIComponent(fl[e])}&`
  })
  return url
}

export const delay = (delayInms: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(2)
    }, delayInms)
  })
}

export const getCdnImageUrl = ({
  src,
  IMAGE_CDN_URL,
  IMAGE_CDN_PROVIDER,
  NO_QUERY = false,
}: any) => {
  const possibleImageUrls = ['https://s3.ap-south-1.amazonaws.com/superapp.in/']
  let originalImageUrl = src
  let shouldAttachCdn = false
  for (const i of possibleImageUrls) {
    if (src?.includes(i)) {
      originalImageUrl = src.replace(i, '/')
      shouldAttachCdn = true
    }
  }
  if (shouldAttachCdn) {
    if (NO_QUERY) return originalImageUrl
    else return IMAGE_CDN_URL + originalImageUrl
  } else {
    return originalImageUrl
  }
}

export function date(value: string) {
  const date = new Date(value)
  return date.toLocaleString(['en-US'], {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function dateOnly(value: string) {
  const date = new Date(value)
  return date.toLocaleString(['en-US'], {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

export function timeIst(value: string) {
  const date = new Date(value)
  const istOffset = 5.5 * 60 * 60 * 1000
  const istDate = new Date(date.getTime() + istOffset)
  const options = { timeZone: 'Asia/Kolkata', hour12: true, hour: 'numeric', minute: 'numeric' }
  const istTime = istDate.toLocaleTimeString('en-US', options)
  return istTime
}

export function time(value: string) {
  const date = new Date(value)
  return date.toLocaleString(['en-US'], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function truncate(text: string, stop: number, clamp: string) {
  if (text) return text.slice(0, stop) + (stop < text.length ? clamp || '...' : '')
  else return ''
}

export function currency(value: any, currency = '₹', decimals?: number) {
  const digitsRE = /(\d{3})(?=\d)/g
  value = Number.parseFloat(value)
  if (!isFinite(value) || (!value && value !== 0)) return ''
  decimals = decimals != null ? decimals : 0
  const stringified = Math.abs(value).toFixed(decimals)
  const _int = decimals ? stringified.slice(0, -1 - decimals) : stringified
  const i = _int.length % 3
  const head = i > 0 ? _int.slice(0, i) + (_int.length > 3 ? ',' : '') : ''
  const _float = decimals ? stringified.slice(-1 - decimals) : ''
  const sign = value < 0 ? '-' : ''
  return sign + currency + ' ' + head + _int.slice(i).replace(digitsRE, '$1,') + _float
}

export const serialize = (obj: any) => {
  var str = []
  for (var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]))
    }
  return str.join('&')
}

export const removeNullish = (obj: any) =>
  Object.entries(obj).reduce((a: any, [k, v]) => (v ? ((a[k] = v), a) : a), {})

export const buildQueryFromObject: any = (search: string, prefix = '') =>
  Object.entries(search)
    .map(([key, value]) =>
      typeof value === 'object'
        ? buildQueryFromObject(value, key)
        : `${prefix ? `${prefix}[${key}]` : `${key}`}=${value}`
    )
    .join('&')

export const getExtension = (filename: string) => {
  return filename.substring(filename.lastIndexOf('.') + 1)
}

export const getIdFromYoutubeVideo = (url) => {
  if (!url) return 'XXX'
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[7].length == 11 ? match[7] : false
}

export const navigateToProperPath = (url) => {
  if (!url || typeof url !== 'string') {
    return '##'
  } else if (url?.startsWith('http')) {
    const possibleDomainUrls = ['https://localhost:3000/', 'https://localhost:3001/']

    let originalUrl = url

    for (const i of possibleDomainUrls) {
      if (url?.includes(i)) {
        originalUrl = url?.replace(i, '/')
      }
    }

    return originalUrl
  } else if (url && url[0] !== '/') {
    return `/${url?.trim()}`
  } else {
    return url?.trim()
  }
}

export const redirectValidator = (me: any) => {
  if (!me) {
    return `/login`
  }
  if (me?.board && me?.class && me?.firstName) {
    return `/`
  } else {
    return
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null }

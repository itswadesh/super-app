/**
 * Language configuration for multilingual support
 */

export type LanguageCode = 'en' | 'hi' | 'or' | 'bn'

export interface Language {
  code: LanguageCode
  name: string
  nativeName: string
  dir: 'ltr' | 'rtl'
  hreflang: string
}

export const LANGUAGES: Record<LanguageCode, Language> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
    hreflang: 'en',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    dir: 'ltr',
    hreflang: 'hi',
  },
  or: {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    dir: 'ltr',
    hreflang: 'or',
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    dir: 'ltr',
    hreflang: 'bn',
  },
}

export const LANGUAGE_CODES = Object.keys(LANGUAGES) as LanguageCode[]

/**
 * Creates alternate URLs for hreflang tags
 * @param baseUrl Current page URL without language prefix
 * @param currentLang Current language code
 * @returns Array of alternate language URLs for SEO
 */
export function getAlternateLanguageUrls(
  baseUrl: string,
  currentLang: LanguageCode
): Array<{ url: string; lang: string }> {
  // Remove any trailing slashes for consistency
  baseUrl = baseUrl.replace(/\/$/, '')

  return LANGUAGE_CODES.map((langCode) => {
    // For the default language (English), we don't add a language prefix
    const prefix = langCode === 'en' ? '' : `/${langCode}`
    return {
      url: `${prefix}${baseUrl}`,
      lang: LANGUAGES[langCode].hreflang,
    }
  })
}

/**
 * Get the language from the URL path
 * @param path Current URL path
 * @returns The detected language code or 'en' as default
 */
export function getLanguageFromPath(path: string): LanguageCode {
  const pathParts = path.split('/').filter(Boolean)
  const firstPart = pathParts[0]

  if (firstPart && LANGUAGE_CODES.includes(firstPart as LanguageCode)) {
    return firstPart as LanguageCode
  }

  return 'en' // Default language
}

/**
 * Get the path without the language prefix
 * @param path Current URL path
 * @param lang Current language code
 * @returns Path without language prefix
 */
export function getPathWithoutLanguage(path: string, lang: LanguageCode): string {
  if (lang === 'en') return path // English is default, no prefix to remove

  const langPrefix = `/${lang}`
  if (path.startsWith(langPrefix)) {
    return path.slice(langPrefix.length) || '/'
  }

  return path
}

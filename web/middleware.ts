import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['es', 'en'],

  // Used when no locale matches
  defaultLocale: 'es',

  // Don't use locale prefixes in URLs
  localePrefix: 'never'
})

export const config = {
  // Match all pathnames except for
  // - API routes
  // - files in public folder
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}

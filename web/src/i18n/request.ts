import { getRequestConfig } from 'next-intl/server'
import { headers } from 'next/headers'

export default getRequestConfig(async () => {
  // Get locale from headers (Accept-Language)
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language') || ''

  // Simple locale detection - prefer Spanish
  const locale =
    acceptLanguage.includes('en') && !acceptLanguage.includes('es')
      ? 'en'
      : 'es'

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})

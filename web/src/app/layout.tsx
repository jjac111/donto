import type { Metadata } from 'next'
import { Comfortaa as Font } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { cookies } from 'next/headers'
import { QueryProvider } from '@/providers/query-provider'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Toaster } from 'sonner'
import './globals.css'

const font = Font({
  variable: '--font-primary',
  subsets: ['latin'],
  weight: ['400'],
  preload: false, // Disable automatic preloading to avoid conflicts
})

export const metadata: Metadata = {
  title: 'Donto - Dental Clinic Management',
  description: 'Sistema de administración para clínicas dentales',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const messages = await getMessages()
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme')?.value

  return (
    <html lang="es" className={theme === 'dark' ? 'dark' : ''}>
      <body className={`${font.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <AuthGuard>{children}</AuthGuard>
            <Toaster
              richColors
              position="top-center"
              duration={2000}
              className="rounded-xl"
            />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

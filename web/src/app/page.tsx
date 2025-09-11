import { redirect } from 'next/navigation'

export default function Home() {
  // The AuthGuard will handle redirects, but we can also redirect here as a fallback
  redirect('/dashboard')
}

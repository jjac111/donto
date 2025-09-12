'use client'

import { useTranslations } from 'next-intl'
import { ProvidersList } from './providers-list'

export function ProvidersSettingsForm() {
  const t = useTranslations('settings.providers')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <ProvidersList />
    </div>
  )
}

'use client'

import { useTranslations } from 'next-intl'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { ClinicSettingsForm } from '@/components/settings/clinic-settings-form'
import { ProvidersSettingsForm } from '@/components/providers/providers-settings-form'

export default function SettingsPage() {
  const t = useTranslations('settings')

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="text-muted-foreground mt-1">{t('description')}</p>
          </div>

          {/* Clinic Information Section */}
          <Card>
            <div className="px-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{t('clinic.title')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('clinic.description')}
                </p>
              </div>
              <ClinicSettingsForm />
            </div>
          </Card>

          {/* Providers Section */}
          <Card>
            <div className="px-6">
              <ProvidersSettingsForm />
            </div>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

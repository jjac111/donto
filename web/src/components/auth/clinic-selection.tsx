'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, User, Shield } from 'lucide-react'

export function ClinicSelection() {
  const tAuth = useTranslations('auth')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const {
    availableClinics,
    selectClinic,
    logout,
    isLoading,
    error,
    isAuthenticated,
    needsClinicSelection,
  } = useAuthStore()

  // Navigate to dashboard when clinic is selected
  useEffect(() => {
    if (isAuthenticated && !needsClinicSelection) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, needsClinicSelection, router])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'provider':
        return <User className="h-4 w-4" />
      default:
        return <Building2 className="h-4 w-4" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return tAuth('clinicSelection.role.admin')
      case 'provider':
        return tAuth('clinicSelection.role.provider')
      case 'staff':
        return tAuth('clinicSelection.role.staff')
      default:
        return role
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-6">
          <div className="flex justify-center">
            <Logo size="xl" />
          </div>
          <CardTitle className="text-2xl">
            {tAuth('clinicSelection.title')}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-muted-foreground text-center">
                {tAuth('clinicSelection.help')}
              </p>

              <div className="grid gap-3">
                {!availableClinics || availableClinics.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No clinics available</p>
                    <p className="text-sm">Please contact your administrator</p>
                  </div>
                ) : (
                  availableClinics.map(clinic => (
                    <Button
                      key={clinic.clinicId}
                      variant="outline"
                      onClick={async () => {
                        try {
                          await selectClinic(clinic.clinicId)
                        } catch (error) {
                          console.error('Failed to select clinic:', error)
                        }
                      }}
                      disabled={isLoading}
                      className="h-auto p-4 justify-start"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{clinic.clinicName}</div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            {getRoleIcon(clinic.role)}
                            <span>{getRoleLabel(clinic.role)}</span>
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </div>

            {error && (
              <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="text-center text-muted-foreground">
                {tCommon('loading')}
              </div>
            )}

            <div className="flex justify-center">
              <Button variant="outline" onClick={logout} disabled={isLoading}>
                {tCommon('logout')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { useProviders } from '@/hooks/use-providers'
import { Provider } from '@/types/entities'
import { ProviderForm } from './provider-form'
// import { toast } from 'sonner' // TODO: Add toast library
import { UserPlus } from 'lucide-react'

interface ProvidersListProps {
  onProviderSelect?: (provider: Provider) => void
}

export function ProvidersList({ onProviderSelect }: ProvidersListProps) {
  const t = useTranslations('settings.providers')
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const { data: providers, isLoading, error } = useProviders()

  const handleProviderClick = (provider: Provider) => {
    setEditingProvider(provider)
    setIsEditDialogOpen(true)
    onProviderSelect?.(provider)
  }

  const handleFormSuccess = () => {
    setIsAddDialogOpen(false)
    setIsEditDialogOpen(false)
    setEditingProvider(null)
  }

  const handleFormCancel = () => {
    setIsAddDialogOpen(false)
    setIsEditDialogOpen(false)
    setEditingProvider(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        title={t('loadError')}
        description="No se pudo cargar la lista de personal"
        action={{
          label: 'Reintentar',
          onClick: () => window.location.reload(),
        }}
      />
    )
  }

  if (!providers || providers.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          title={t('noProviders')}
          description={t('noProvidersDescription')}
        />
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              {t('addProvider')}
            </Button>
          </DialogTrigger>
          <ProviderForm
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {providers.length}{' '}
            {providers.length === 1 ? 'personal' : 'personal'} registrado
            {providers.length === 1 ? '' : 's'}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              {t('addProvider')}
            </Button>
          </DialogTrigger>
          <ProviderForm
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </Dialog>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map(provider => (
          <Card
            key={provider.id}
            className={`p-4 transition-shadow ${
              provider.isActive
                ? 'hover:shadow-md cursor-pointer'
                : 'opacity-60 hover:shadow-md cursor-pointer'
            }`}
            onClick={() => handleProviderClick(provider)}
          >
            <div className="space-y-3">
              {/* Provider Info */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">
                    {provider.displayName}
                  </h4>
                  <Badge variant={provider.isActive ? 'default' : 'secondary'}>
                    {provider.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                {provider.specialty && (
                  <p className="text-sm text-muted-foreground">
                    {provider.specialty}
                  </p>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-1 text-sm text-muted-foreground">
                {provider.person?.email && <p>{provider.person.email}</p>}
                {provider.person?.phone && (
                  <p>
                    {provider.person.phoneCountryCode &&
                    provider.person.phoneCountryCode !== provider.person.phone
                      ? `${provider.person.phoneCountryCode} ${provider.person.phone}`
                      : provider.person.phone}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingProvider && (
        <ProviderForm
          provider={editingProvider}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  )
}

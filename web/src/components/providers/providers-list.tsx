'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useProviders, useDeleteProvider } from '@/hooks/use-providers'
import { Provider } from '@/types/entities'
import { ProviderForm } from './provider-form'
// import { toast } from 'sonner' // TODO: Add toast library
import { MoreHorizontal, Edit, Trash2, UserPlus } from 'lucide-react'

interface ProvidersListProps {
  onProviderSelect?: (provider: Provider) => void
}

export function ProvidersList({ onProviderSelect }: ProvidersListProps) {
  const t = useTranslations('settings.providers')
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(
    null
  )

  const { data: providers, isLoading, error } = useProviders()
  const deleteProvider = useDeleteProvider()

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (provider: Provider) => {
    setProviderToDelete(provider)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!providerToDelete) return

    try {
      await deleteProvider.mutateAsync(providerToDelete.id)
      console.log('Provider deleted successfully')
      setIsDeleteDialogOpen(false)
      setProviderToDelete(null)
    } catch (error) {
      console.error('Delete provider error:', error)
      alert(t('deleteError'))
    }
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('addProvider')}</DialogTitle>
            </DialogHeader>
            <ProviderForm
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{t('title')}</h3>
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('addProvider')}</DialogTitle>
            </DialogHeader>
            <ProviderForm
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map(provider => (
          <Card
            key={provider.id}
            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onProviderSelect?.(provider)}
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
                {provider.person?.phone && <p>{provider.person.phone}</p>}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-1 pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation()
                    handleEdit(provider)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation()
                    handleDelete(provider)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editProvider')}</DialogTitle>
          </DialogHeader>
          {editingProvider && (
            <ProviderForm
              provider={editingProvider}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmDelete')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('confirmDeleteDescription')}
            </p>
            {providerToDelete && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{providerToDelete.displayName}</p>
                {providerToDelete.specialty && (
                  <p className="text-sm text-muted-foreground">
                    {providerToDelete.specialty}
                  </p>
                )}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                {t('cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteProvider.isPending}
              >
                {deleteProvider.isPending ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Eliminando...
                  </>
                ) : (
                  t('deleteProvider')
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

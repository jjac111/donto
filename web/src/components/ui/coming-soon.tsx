import { Card } from './card'
import { Badge } from './badge'

interface ComingSoonProps {
  title: string
  description?: string
  icon?: React.ReactNode
}

export function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md text-center p-8">
        <div className="space-y-4">
          {icon && (
            <div className="flex justify-center text-muted-foreground">
              {icon}
            </div>
          )}

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">{title}</h1>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>

          <Badge variant="secondary" className="mx-auto">
            Próximamente
          </Badge>
        </div>
      </Card>
    </div>
  )
}

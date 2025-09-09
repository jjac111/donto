import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Patient } from '@/types/entities'

interface PatientCardProps {
  patient: Patient
  className?: string
}

export function PatientCard({ patient, className = '' }: PatientCardProps) {
  return (
    <Link href={`/patients/${patient.id}`}>
      <Card
        className={`hover:bg-muted/50 active:bg-muted transition-all duration-150 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] ${className}`}
      >
        <CardContent className="p-4">
          <div className="flex flex-col space-y-2">
            <div>
              <h3 className="font-medium text-foreground">
                {patient.displayName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {patient.age} años
              </p>
            </div>

            <div className="flex flex-col space-y-1">
              {patient.person?.phone && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground min-w-0 flex-shrink-0">
                    Tel:
                  </span>
                  <span className="text-sm text-foreground truncate">
                    {patient.person.phone}
                  </span>
                </div>
              )}

              {patient.person?.email && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground min-w-0 flex-shrink-0">
                    Email:
                  </span>
                  <span className="text-sm text-foreground truncate">
                    {patient.person.email}
                  </span>
                </div>
              )}

              {!patient.person?.phone && !patient.person?.email && (
                <p className="text-sm text-muted-foreground">
                  Sin información de contacto
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

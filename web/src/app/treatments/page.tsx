import { ComingSoon } from '@/components/ui/coming-soon'
import { Activity } from 'lucide-react'

export default function TreatmentsPage() {
  return (
    <ComingSoon
      title="Tratamientos"
      description="Próximamente podrás gestionar y dar seguimiento a los tratamientos de tus pacientes"
      icon={<Activity className="w-12 h-12" />}
    />
  )
}

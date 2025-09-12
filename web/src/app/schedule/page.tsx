import { ComingSoon } from '@/components/ui/coming-soon'
import { Calendar } from 'lucide-react'

export default function SchedulePage() {
  return (
    <ComingSoon
      title="Programación de Citas"
      description="Próximamente podrás gestionar tu agenda de citas de manera eficiente"
      icon={<Calendar className="w-12 h-12" />}
    />
  )
}

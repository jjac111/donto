import { ComingSoon } from '@/components/ui/coming-soon'
import { Calculator } from 'lucide-react'

export default function EstimatesPage() {
  return (
    <ComingSoon
      title="Presupuestos"
      description="Próximamente podrás crear y gestionar presupuestos para tratamientos"
      icon={<Calculator className="w-12 h-12" />}
    />
  )
}

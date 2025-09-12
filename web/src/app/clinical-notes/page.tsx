import { ComingSoon } from '@/components/ui/coming-soon'
import { FileText } from 'lucide-react'

export default function ClinicalNotesPage() {
  return (
    <ComingSoon
      title="Notas Clínicas"
      description="Próximamente podrás crear y gestionar notas clínicas detalladas"
      icon={<FileText className="w-12 h-12" />}
    />
  )
}

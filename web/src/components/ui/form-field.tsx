import { cn } from '@/lib/utils'
import { Label } from './label'
import { Input } from './input'
import { Textarea } from './textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

export function FormField({
  label,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label
        className={cn(
          required && "after:content-['*'] after:ml-0.5 after:text-destructive"
        )}
      >
        {label}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

interface FormInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'error'> {
  label: string
  error?: string
  required?: boolean
}

export function FormInput({
  label,
  error,
  required,
  className,
  ...props
}: FormInputProps) {
  return (
    <FormField label={label} error={error} required={required}>
      <Input
        className={cn(
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
    </FormField>
  )
}

interface FormTextareaProps
  extends Omit<React.ComponentProps<typeof Textarea>, 'error'> {
  label: string
  error?: string
  required?: boolean
}

export function FormTextarea({
  label,
  error,
  required,
  className,
  ...props
}: FormTextareaProps) {
  return (
    <FormField label={label} error={error} required={required}>
      <Textarea
        className={cn(
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
    </FormField>
  )
}

interface FormSelectProps {
  label: string
  error?: string
  required?: boolean
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

export function FormSelect({
  label,
  error,
  required,
  placeholder,
  value,
  onValueChange,
  children,
}: FormSelectProps) {
  return (
    <FormField label={label} error={error} required={required}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className={cn(error && 'border-destructive focus:ring-destructive')}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </FormField>
  )
}

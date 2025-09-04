'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Container } from '@/components/ui/container'
import { PageHeader } from '@/components/ui/page-header'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { FormInput, FormTextarea, FormSelect } from '@/components/ui/form-field'
import { Toggle } from '@/components/ui/toggle'
import { AppLayout } from '@/components/layout/app-layout'
import {
  Users,
  Calendar,
  FileText,
  Settings,
  Plus,
  Search,
  Moon,
  Sun,
} from 'lucide-react'

export default function TestPage() {
  const [inputValue, setInputValue] = useState('')
  const [textareaValue, setTextareaValue] = useState('')
  const [selectValue, setSelectValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const handleLoading = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  const handleDarkModeToggle = (checked: boolean) => {
    setIsDarkMode(checked)
    if (checked) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const sampleData = [
    {
      id: 1,
      name: 'Juan Pérez',
      email: 'juan@example.com',
      phone: '+1 234 567 8900',
      status: 'Active',
    },
    {
      id: 2,
      name: 'María García',
      email: 'maria@example.com',
      phone: '+1 234 567 8901',
      status: 'Inactive',
    },
    {
      id: 3,
      name: 'Carlos López',
      email: 'carlos@example.com',
      phone: '+1 234 567 8902',
      status: 'Active',
    },
  ]

  return (
    <AppLayout
      title="Component Showcase"
      isDarkMode={isDarkMode}
      onDarkModeToggle={handleDarkModeToggle}
    >
      <Container className="py-8 space-y-8">
        {/* Buttons Section */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>All button variants and sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled>Disabled</Button>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                With Icon
              </Button>
              <Button onClick={handleLoading} disabled={loading}>
                {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                Test Loading
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Components Section */}
        <Card>
          <CardHeader>
            <CardTitle>Form Components</CardTitle>
            <CardDescription>
              Input fields, labels, and form validation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Basic Inputs</h4>
                <div className="space-y-2">
                  <Label htmlFor="basic-input">Basic Input</Label>
                  <Input
                    id="basic-input"
                    placeholder="Enter text..."
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disabled-input">Disabled Input</Label>
                  <Input
                    id="disabled-input"
                    disabled
                    placeholder="Disabled input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="error-input">Input with Error</Label>
                  <Input
                    id="error-input"
                    className="border-destructive focus-visible:ring-destructive"
                    placeholder="This has an error"
                  />
                  <p className="text-sm text-destructive">
                    This field is required
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Form Components</h4>
                <FormInput
                  label="Form Input"
                  placeholder="Form input with label"
                  required
                />
                <FormInput
                  label="Form Input with Error"
                  placeholder="This has an error"
                  error="This field is required"
                  required
                />
                <FormTextarea
                  label="Form Textarea"
                  placeholder="Enter a longer message..."
                  rows={3}
                />
                <FormSelect
                  label="Form Select"
                  placeholder="Select an option"
                  value={selectValue}
                  onValueChange={setSelectValue}
                >
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </FormSelect>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Select Components</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Basic Select</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                      <SelectItem value="option3">Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Disabled Select</Label>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Disabled select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Textarea</h4>
              <div className="space-y-2">
                <Label htmlFor="textarea">Textarea</Label>
                <Textarea
                  id="textarea"
                  placeholder="Enter a longer message..."
                  value={textareaValue}
                  onChange={e => setTextareaValue(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges and Status Section */}
        <Card>
          <CardHeader>
            <CardTitle>Badges & Status</CardTitle>
            <CardDescription>Status indicators and badges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Table Section */}
        <Card>
          <CardHeader>
            <CardTitle>Data Table</CardTitle>
            <CardDescription>
              Sample data table with patient information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleData.map(patient => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      {patient.name}
                    </TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          patient.status === 'Active' ? 'default' : 'secondary'
                        }
                      >
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Loading States Section */}
        <Card>
          <CardHeader>
            <CardTitle>Loading States</CardTitle>
            <CardDescription>Loading spinners and states</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <LoadingSpinner size="sm" />
              <LoadingSpinner size="md" />
              <LoadingSpinner size="lg" />
              <span className="text-sm text-muted-foreground">
                Different sizes
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Empty States Section */}
        <Card>
          <CardHeader>
            <CardTitle>Empty States</CardTitle>
            <CardDescription>Empty state components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title="No patients found"
                description="Get started by adding your first patient to the system."
                action={{
                  label: 'Add Patient',
                  onClick: () => console.log('Add patient clicked'),
                }}
              />
              <EmptyState
                icon={<Calendar className="h-8 w-8" />}
                title="No appointments scheduled"
                description="Your schedule is clear for today."
                action={{
                  label: 'Schedule Appointment',
                  onClick: () => console.log('Schedule appointment clicked'),
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Cards Section */}
        <Card>
          <CardHeader>
            <CardTitle>Card Variants</CardTitle>
            <CardDescription>Different card layouts and styles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Patient Records
                  </CardTitle>
                  <CardDescription>Manage patient information</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View and edit patient records, medical history, and
                    treatment plans.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Appointments
                  </CardTitle>
                  <CardDescription>
                    Schedule and manage appointments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Book appointments, view calendar, and manage your schedule.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    Settings
                  </CardTitle>
                  <CardDescription>Configure your clinic</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Manage clinic settings, users, and system preferences.
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Container Sizes Section */}
        <Card>
          <CardHeader>
            <CardTitle>Container Sizes</CardTitle>
            <CardDescription>Different container width options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Small Container</h4>
              <Container size="sm" className="bg-muted p-4 rounded">
                <p className="text-sm">This is a small container (max-w-2xl)</p>
              </Container>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Medium Container</h4>
              <Container size="md" className="bg-muted p-4 rounded">
                <p className="text-sm">
                  This is a medium container (max-w-4xl)
                </p>
              </Container>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Large Container (Default)</h4>
              <Container size="lg" className="bg-muted p-4 rounded">
                <p className="text-sm">This is a large container (max-w-6xl)</p>
              </Container>
            </div>
          </CardContent>
        </Card>
      </Container>
    </AppLayout>
  )
}

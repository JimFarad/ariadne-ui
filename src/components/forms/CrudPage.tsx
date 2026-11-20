import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/data/DataTable'
import { ConfirmDialog } from './ConfirmDialog'
import { FormField } from './FormField'
import { PageHeader } from '@/components/layout/PageHeader'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { useWorkspace } from '@/context/WorkspaceContext'
import { api, ApiError } from '@/lib/api/client'

export interface FieldDef {
  name: string
  label: string
  type?: 'text' | 'textarea' | 'select' | 'number' | 'password'
  required?: boolean
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  hint?: string
  defaultValue?: unknown
}

interface CrudPageProps<T extends Record<string, unknown>> {
  title: string
  description?: string
  /** Singular noun for create/edit dialog titles (defaults to title). */
  noun?: string
  /** Builds the collection endpoint for the active entity. */
  path: (entityId: string) => string
  columns: Column<T>[]
  fields: FieldDef[]
  rowKey: (row: T) => string
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
  emptyTitle?: string
  emptyDescription?: string
  searchKeys?: Array<keyof T>
  transformSubmit?: (values: Record<string, unknown>) => Record<string, unknown>
}

type FormValues = Record<string, unknown>

function EntityForm({
  fields,
  defaultValues,
  onSubmit,
  onCancel,
  pending,
  error,
}: {
  fields: FieldDef[]
  defaultValues: FormValues
  onSubmit: (values: FormValues) => void
  onCancel: () => void
  pending: boolean
  error: unknown
}) {
  const { register, handleSubmit, setError, formState } = useForm<FormValues>({ defaultValues })

  // Map API validation errors onto fields when they arrive.
  const apiErrors = error instanceof ApiError && error.isValidation ? error.fieldErrors : []
  if (apiErrors.length > 0 && formState.submitCount > 0) {
    for (const e of apiErrors) {
      if (!formState.errors[e.field]) setError(e.field, { message: e.message })
    }
  }

  const genericError =
    error instanceof ApiError && !error.isValidation ? error.detail : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
      {fields.map((field) => (
        <FormField
          key={field.name}
          label={field.label}
          htmlFor={field.name}
          required={field.required}
          error={formState.errors[field.name]?.message as string | undefined}
          hint={field.hint}
        >
          {field.type === 'textarea' ? (
            <Textarea id={field.name} placeholder={field.placeholder} {...register(field.name)} />
          ) : field.type === 'select' && field.options ? (
            <SelectControl field={field} register={register} />
          ) : (
            <Input
              id={field.name}
              type={field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : 'text'}
              placeholder={field.placeholder}
              step={field.type === 'number' ? 'any' : undefined}
              {...register(field.name)}
            />
          )}
        </FormField>
      ))}

      {genericError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {genericError}
        </p>
      )}

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </form>
  )
}

function SelectControl({
  field,
  register,
}: {
  field: FieldDef
  register: ReturnType<typeof useForm<FormValues>>['register']
}) {
  // Radix Select needs controlled value; use a hidden input for RHF binding.
  return (
    <div>
      <input type="hidden" {...register(field.name)} />
      <Select onValueChange={(value) => {
        register(field.name).onChange({ target: { name: field.name, value } })
      }}>
        <SelectTrigger>
          <SelectValue placeholder={field.placeholder || 'Select…'} />
        </SelectTrigger>
        <SelectContent>
          {field.options!.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function CrudPage<T extends Record<string, unknown>>({
  title,
  description,
  noun,
  path,
  columns,
  fields,
  rowKey,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  emptyTitle,
  emptyDescription,
  searchKeys,
  transformSubmit,
}: CrudPageProps<T>) {
  const { activeEntityId } = useWorkspace()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [deleting, setDeleting] = useState<T | null>(null)

  const list = usePaginatedList<T>((entityId) => path(entityId))

  const invalidate = () => {
    if (activeEntityId) queryClient.invalidateQueries({ queryKey: ['ws', activeEntityId, path(activeEntityId)] })
  }

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => api.post<unknown>(path(activeEntityId!), transformSubmit ? transformSubmit(values) : values),
    onSuccess: () => {
      setDialogOpen(false)
      setEditing(null)
      invalidate()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: FormValues }) =>
      api.patch<unknown>(`${path(activeEntityId!)}/${id}`, transformSubmit ? transformSubmit(values) : values),
    onSuccess: () => {
      setDialogOpen(false)
      setEditing(null)
      invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<unknown>(`${path(activeEntityId!)}/${id}`),
    onSuccess: () => {
      setDeleting(null)
      invalidate()
    },
  })

  const displayed = useMemo(() => {
    if (!search || !searchKeys || searchKeys.length === 0) return list.data
    const q = search.toLowerCase()
    return list.data.filter((row) =>
      searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(q)),
    )
  }, [list.data, search, searchKeys])

  const allColumns: Column<T>[] =
    canEdit || canDelete
      ? [
          ...columns,
          {
            key: '__actions',
            header: '',
            headerClassName: 'w-[60px]',
            cell: (row) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem
                      onSelect={() => {
                        setEditing(row)
                        setDialogOpen(true)
                      }}
                    >
                      <Pencil />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => setDeleting(row)}
                    >
                      <Trash2 />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]
      : columns

  const dialogError = editing ? updateMutation.error : createMutation.error
  const defaultValues = useMemo(() => {
    const defaults: FormValues = {}
    for (const field of fields) {
      defaults[field.name] = editing ? (editing[field.name] as unknown) : (field.defaultValue ?? '')
    }
    return defaults
  }, [fields, editing])

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          canCreate && (
            <Button
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              <Plus />
              Create
            </Button>
          )
        }
      />

      <DataTable<T>
        columns={allColumns}
        data={displayed}
        rowKey={rowKey}
        loading={list.isLoading}
        error={list.error}
        onRetry={list.refetch}
        pagination={list.pagination?.pagination}
        onPageChange={list.setPage}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        toolbar={
          searchKeys && searchKeys.length > 0 ? (
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-8"
              />
            </div>
          ) : undefined
        }
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) setEditing(null)
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${noun ?? title}` : `Create ${noun ?? title}`}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the details below.' : 'Fill in the details below.'}
            </DialogDescription>
          </DialogHeader>
          {dialogOpen && (
            <EntityForm
              key={editing ? (editing as Record<string, unknown>).id as string : 'new'}
              fields={fields}
              defaultValues={defaultValues}
              pending={createMutation.isPending || updateMutation.isPending}
              error={dialogError}
              onCancel={() => {
                setDialogOpen(false)
                setEditing(null)
              }}
              onSubmit={(values) => {
                if (editing) updateMutation.mutate({ id: rowKey(editing), values })
                else createMutation.mutate(values)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete record"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(rowKey(deleting))
        }}
      />
    </div>
  )
}

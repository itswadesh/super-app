<script lang="ts">
import { onMount } from 'svelte'
import Fuse from 'fuse.js'
import { toast } from 'svelte-sonner'
import { Button } from '$lib/components/ui/button'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as Sheet from '$lib/components/ui/sheet'
import * as Select from '$lib/components/ui/select'
import { Checkbox } from '$lib/components/ui/checkbox'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from '@lucide/svelte'
import { page } from '$app/state'
import { post } from '$lib/utils/api'

type IconProps = {
  size?: string | number
  width?: string | number
  height?: string | number
  class?: string
  color?: string
  [key: `aria-${string}`]: string | undefined
}

// Type definitions
interface Option<T = string | number | boolean> {
  label: string
  value: T
}

interface SelectOption {
  KEY: string
  VAL: string
}

interface ApiResponse {
  data?: unknown
  error?: string
  [key: string]: unknown
}

interface PostResponse {
  success: boolean
  id?: string
}

interface Field {
  text: string
  value: string
  type?: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea'
  options_query?: string
  options?: Option[]
  helpText?: string
  placeholder?: string
  required?: boolean
  no?: {
    table?: boolean
    edit?: boolean
    select?: boolean
    [key: string]: boolean | undefined
  }
}

type TableData = {
  [key: string]: string | number | boolean | null | undefined
  ROWID?: string
}

let {
  FIELDS,
  TABLE_NAME,
  DB_NAME,
  QUERY,
  heading,
  backLink,
  sort,
  add,
  edit,
  del,
  del1,
  search,
  pagination,
  allowRegistration,
  dispatch,
} = $props()

// State with proper typing
let data = $state<TableData[]>([])
let filteredData = $state<TableData[]>([])
let selectedRow = $state<TableData | null>(null)

// Helper function to safely access selectedRow
function withSelectedRow<T>(fn: (row: TableData) => T): T | undefined {
  if (!selectedRow) return undefined
  return fn(selectedRow)
}

let isSheetOpen = $state(false)
let sortConfig = $state<{ key: string; direction: 'asc' | 'desc' } | null>(null)
let searchQuery = $state('')
let editableColumns = $state<Field[]>([])
let optionValues = $state<SelectOption[]>([])
let paginationSettings = $state({
  page: 0,
  limit: 100,
  size: 0,
  amounts: [50, 100, 200, 500] as const,
})

// Derived state with explicit types
let paginatedSource = $derived<TableData[]>(
  filteredData.slice(
    paginationSettings.page * paginationSettings.limit,
    (paginationSettings.page + 1) * paginationSettings.limit
  )
)

let actionButtons = $derived<Array<'edit' | 'delete' | 'delete1'>>(
  [edit && 'edit', del && 'delete', del1 && 'delete1'].filter(
    (x): x is 'edit' | 'delete' | 'delete1' => Boolean(x)
  )
)

let editableFields = $derived<Field[]>(
  FIELDS.filter((field) => !field.no?.select && field.value !== 'ROWID')
)

// Initialize data and columns with proper typing
onMount(async (): Promise<void> => {
  try {
    await Promise.all([fetchData(), loadColumnOptions()])
  } catch (error) {
    console.error('Error initializing grid view:', error)
    toast.error('Failed to initialize grid view')
  }
})

// Load column options for select fields with proper typing
async function loadColumnOptions(): Promise<void> {
  await Promise.all(
    FIELDS.map(async (item: Field) => {
      if (!item.no?.edit) {
        editableColumns = [...editableColumns, item]
      }
      if (item.type === 'select' && item.options_query) {
        const options = await getOptions(item.options_query)
        optionValues = [...optionValues, ...(options || [])]
      }
    })
  )
}

// Fetch data from API
async function fetchData() {
  try {
    const response: unknown = await post('query', { q: QUERY, db: DB_NAME })
    if (Array.isArray(response)) {
      data = response as TableData[]
      filteredData = [...data]
      updatePagination()
    } else {
      throw new Error('Invalid response format from server')
    }
  } catch (error) {
    console.error('Error fetching data:', error)
    toast.error('Failed to load data')
    data = []
    filteredData = []
    updatePagination()
  }
}

// Get options for select fields
async function getOptions(query: string): Promise<SelectOption[]> {
  try {
    const response: unknown = await post('query', { q: query, db: DB_NAME })
    if (Array.isArray(response)) {
      return response as SelectOption[]
    }
    throw new Error('Invalid options format from server')
  } catch (error) {
    console.error('Error fetching options:', error)
    toast.error('Failed to load options')
    return []
  }
}

// Update pagination
function formatDate(dateString: string | Date): string {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

function updatePagination() {
  const start = paginationSettings.page * paginationSettings.limit
  const end = start + paginationSettings.limit
  paginatedSource = filteredData.slice(start, end)
  paginationSettings = { ...paginationSettings, size: filteredData.length }
}

// Handle search with proper typing
function searchNow(): void {
  if (!searchQuery) {
    filteredData = [...data]
  } else {
    const fuse = new Fuse(data, {
      keys: FIELDS.filter((f: Field) => !f.no?.table).map((f: Field) => f.value),
      threshold: 0.3,
    })
    filteredData = fuse.search(searchQuery).map((r) => r.item)
  }
  paginationSettings = { ...paginationSettings, page: 0 }
  updatePagination()
}

// Handle sort
function sortColumn(key: string) {
  if (sortConfig?.key === key) {
    if (sortConfig.direction === 'asc') {
      sortConfig = { key, direction: 'desc' as const }
    } else {
      sortConfig = null
    }
  } else {
    sortConfig = { key, direction: 'asc' as const }
  }

  if (sortConfig) {
    const currentSortConfig = sortConfig // Capture in const to avoid non-null assertion
    filteredData = [...filteredData].sort((a, b) => {
      const aVal = a[currentSortConfig.key]
      const bVal = b[currentSortConfig.key]
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      if (aVal < bVal) return currentSortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return currentSortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  } else {
    filteredData = [...data]
  }
  updatePagination()
}

// Handle edit with proper typing
function handleEdit(row: TableData) {
  selectedRow = { ...row }
  isSheetOpen = true
}

// Handle delete with proper typing and error handling
async function handleDelete(row: TableData) {
  if (!confirm('Are you sure you want to delete this item?')) return

  try {
    const response = await post('query', {
      q: `DELETE FROM ${TABLE_NAME} WHERE ROWID = '${row.ROWID}'`,
      db: DB_NAME,
    })

    if (response.error) {
      throw new Error(response.error)
    }

    await fetchData()
    toast.success('Item deleted successfully')
  } catch (error) {
    console.error('Error deleting item:', error)
    toast.error(error instanceof Error ? error.message : 'Failed to delete item')
  }
}

// Handle save with proper typing and error handling
async function handleSave() {
  if (!selectedRow) return

  try {
    const fields = editableFields.map((f) => f.value)
    const values = fields.map((f) => selectedRow?.[f] || '')

    const mapped_columns: string[] = []
    editableColumns.map((item) => {
      let perceivedValue = selectedRow[item.value]
      if (perceivedValue === undefined || perceivedValue === null) return

      if (item.type === 'checkbox') {
        perceivedValue = perceivedValue === false ? 'N' : 'Y'
        mapped_columns.push(`${item.value} = '${perceivedValue}'`)
        return
      }

      // Format date values as 'dd-mmm-yyyy' for date fields
      if (item.type === 'date' && perceivedValue) {
        try {
          // Ensure we have a valid date string or timestamp
          let dateValue: Date

          if (perceivedValue instanceof Date) {
            dateValue = perceivedValue
          } else if (typeof perceivedValue === 'string' || typeof perceivedValue === 'number') {
            dateValue = new Date(perceivedValue)
          } else {
            dateValue = new Date()
          }

          if (Number.isNaN(dateValue.getTime())) {
            throw new Error('Invalid date')
          }

          const day = String(dateValue.getDate()).padStart(2, '0')
          const months = [
            'JAN',
            'FEB',
            'MAR',
            'APR',
            'MAY',
            'JUN',
            'JUL',
            'AUG',
            'SEP',
            'OCT',
            'NOV',
            'DEC',
          ]
          const month = months[dateValue.getMonth()]
          const year = dateValue.getFullYear()
          mapped_columns.push(`${item.value} = '${day}-${month}-${year}'`)
          return
        } catch (error) {
          console.error('Error formatting date:', error)
          // Fall back to original value if date parsing fails
        }
      }

      // For non-date fields or if date parsing failed
      mapped_columns.push(`${item.value} = '${perceivedValue}'`)
    })

    let insert_values: string[] = []
    let insert_columns: string[] = []
    editableColumns.map((item) => {
      let perceivedValue = selectedRow[item.value]
      if (item.type === 'checkbox') {
        perceivedValue = perceivedValue === false ? 'N' : 'Y'
      }
      if (perceivedValue === undefined || perceivedValue === null) return

      // Format date values as 'dd-mmm-yyyy' for date fields
      if (item.type === 'date' && perceivedValue) {
        try {
          // Ensure we have a valid date string or timestamp
          let dateValue: Date

          if (perceivedValue instanceof Date) {
            dateValue = perceivedValue
          } else if (typeof perceivedValue === 'string' || typeof perceivedValue === 'number') {
            dateValue = new Date(perceivedValue)
          } else {
            dateValue = new Date()
          }

          if (Number.isNaN(dateValue.getTime())) {
            throw new Error('Invalid date')
          }

          const day = String(dateValue.getDate()).padStart(2, '0')
          const months = [
            'JAN',
            'FEB',
            'MAR',
            'APR',
            'MAY',
            'JUN',
            'JUL',
            'AUG',
            'SEP',
            'OCT',
            'NOV',
            'DEC',
          ]
          const month = months[dateValue.getMonth()]
          const year = dateValue.getFullYear()
          perceivedValue = `'${day}-${month}-${year}'`
        } catch (error) {
          console.error('Error formatting date:', error)
          perceivedValue = `'${String(perceivedValue)}'`
        }
      } else {
        perceivedValue = `'${perceivedValue}'`
      }

      insert_columns.push(item.value)
      insert_values.push(perceivedValue)
    })
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const months = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ]
    const month = months[now.getMonth()]
    const year = now.getFullYear()
    const formattedDate = `'${day}-${month}-${year}'`
    let q = `UPDATE ${TABLE_NAME} SET ${mapped_columns.join(',')}, UPDATED_BY='${page.data?.pbno}', UPDATED_AT=${formattedDate} WHERE ROWID='${selectedRow?.ROWID}'`
    if (!selectedRow?.ROWID) {
      q = `INSERT INTO ${TABLE_NAME}(${insert_columns.join(',')}) VALUES (${insert_values.join(',')})`
    }
    const response = await post('query', { q, db: DB_NAME })

    if (response.error) {
      throw new Error(response.error)
    }

    toast.success(selectedRow.ROWID ? 'Item updated successfully' : 'Item created successfully')
    isSheetOpen = false
    await fetchData() // Reload data after save
  } catch (error) {
    console.error('Error saving item:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to save item'
    toast.error(errorMessage)
  }
}

function handleInputChange(field: string, value: string | boolean | number | null) {
  withSelectedRow((row) => {
    selectedRow = { ...row, [field]: value }
    // Force update the UI
    selectedRow = { ...selectedRow }
  })
}

// Handle select value change with proper typing
function handleSelectChange(field: string, value: string) {
  withSelectedRow((row) => {
    selectedRow = { ...row, [field]: value }
    // Force update the UI
    selectedRow = { ...selectedRow }
  })
}
</script>

<div class="container mx-auto my-6">
  <div class="flex flex-col">
    <div class="table-container">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-semibold">{heading}</h2>
        {#if add}
          <Sheet.Root open={isSheetOpen} onOpenChange={(open) => isSheetOpen = open}>
            <Sheet.Trigger asChild>
              <Button
                variant="outline"
                onclick={() => {
                  selectedRow = {
                    SL: 1,
                    DIV: 'ED',
                    CATEGORY: 'Works',
                    DESCR_OF_WRK: 'Office Renovation',
                    WO_NO: 'WO-2023-001',
                    WO_DT: '2023-01-15',
                    NAME_OF_CONTRACTOR: 'ABC Construction',
                    VALUE_OF_CONTRACT: 500000,
                    DT_OF_COMMENCE: '2023-02-01',
                    DT_OF_COMPLETION: '2023-06-30',
                    MODE_OF_PAYMENT: 'Bank Transfer',
                    AREA_INCHRG: 'John Doe',
                    INCHRG_PBNUM: '12345',
                    CONTRACTOR_PH_NO: '9876543210',
                    FILE_TRACK_REF_NO: 'REF-001',
                    EXECUTION_DTL: 'WORK IN PROGRESS',
                    IS_RECURRING: 0,
                    STATUS: 'WORK ORDER ISSUED',
                    REMARKS1: 'Sample remark 1',
                    TENDR_DUE_EDC: '2023-07-31',
                    PAID_AMT: 250000,
                    CAT: 'Civil',
                    SUB_CAT: 'Renovation',
                    DIVISION: 'North',
                    AAR_DATE: '2023-07-15',
                    DEPT: 'Admin',
                    UPDATED_DATE: '2023-01-10',
                    ESTIMATED_VALUE: 520000,
                    ADMIN_APPROVAL_RECT_DATE: '2023-01-05',
                    TENDER_NO: 'T-2023-001',
                    TENDER_DATE: '2022-12-01',
                    TENDER_TYPE: 'Open',
                    DATE_OF_TENDER_OPENING: '2022-12-15',
                    BID_VLIDITY: '20',
                    TEC_APPROVED_DATE: '2022-12-20',
                    COMMERCIAL_BID_OPENING_DATE: '2022-12-25',
                    AWARD_OF_WORK_APPROVAL_DATE: '2023-01-03'
                  };
                  isSheetOpen = true;
                }}
              >
                <Plus class="w-4 h-4 mr-2" />
                Add New
              </Button>
            </Sheet.Trigger>
          </Sheet.Root>
        {/if}
      </div>
      
      {#if search}
        <div class="mb-4">
          <div class="relative max-w-md">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              class="pl-10 w-full"
              value={searchQuery}
              oninput={(e) => {
                searchQuery = e.target.value;
                searchNow();
              }}
            />
          </div>
        </div>
      {/if}
      
      <div class="bg-white rounded-lg border shadow-sm overflow-hidden text-xs flex flex-col h-[80vh]">
        <div class="overflow-y-auto overflow-x-auto flex-1 relative scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table class="min-w-full divide-y divide-gray-200 text-xs relative">
            <thead class="bg-gray-50 sticky top-0 shadow-sm">
              <tr class="text-[0.7rem] leading-none">
                {#if actionButtons.length > 0}
                  <th scope="col" class="px-2 py-2 text-right font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Actions
                  </th>
                {/if}
                {#each FIELDS as field}
                  <th 
                    scope="col"
                    class="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors bg-gray-50 {sortConfig?.key === field.value ? 'bg-gray-100' : ''}"
                    onclick={() => sort && sortColumn(field.value)}
                  >
                    <div class="flex items-center">
                      {field.text}
                      {#if sort}
                        {#if sortConfig?.key === field.value}
                          {#if sortConfig.direction === 'asc'}
                            <ArrowUp class="ml-1 h-3 w-3 text-blue-500" />
                          {:else}
                            <ArrowDown class="ml-1 h-3 w-3 text-blue-500" />
                          {/if}
                        {:else}
                          <ArrowUpDown class="ml-1 h-3 w-3 text-gray-400" />
                        {/if}
                      {/if}
                    </div>
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200 text-xs">
              {#each paginatedSource as row, i (row.ROWID || i)}
                <tr class="hover:bg-gray-50 {i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} text-xs">
                  {#if actionButtons.length > 0}
                    <td class="px-2 py-1 whitespace-nowrap text-right text-xs font-medium">
                      <div class="flex justify-end space-x-2">
                        {#if edit}
                          <Button
                            variant="ghost"
                            size="sm"
                            onclick={() => {
                              selectedRow = { ...row };
                              isSheetOpen = true;
                            }}
                            title="Edit"
                          >
                            <Pencil class="h-4 w-4" />
                          </Button>
                        {/if}
                        {#if del}
                          <Button
                            variant="ghost"
                            size="sm"
                            onclick={() => handleDelete(row)}
                            title="Delete"
                            class="text-red-600 hover:text-red-800"
                          >
                            <Trash2 class="h-4 w-4" />
                          </Button>
                        {/if}
                      </div>
                    </td>
                  {/if}
                  {#each FIELDS as field}
                    <td class={`px-2 py-1 whitespace-nowrap text-xs ${field.type === 'number' ? 'text-right' : ''} ${typeof row[field.value] === 'number' ? 'font-mono' : ''}`}>
                      {#if field.type === 'checkbox'}
                        <Checkbox checked={!!(row[field.value] as boolean)} disabled />
                      {:else if field.type === 'image'}
                        <img src={row[field.value] as string} alt={field.text} class="h-10 w-10 rounded-full" />
                      {:else if field.type === 'date' && row[field.value]}
                        {formatDate(row[field.value])}
                      {:else if field.type === 'number' && row[field.value] !== null && row[field.value] !== undefined}
                        {Number(row[field.value]).toFixed(2)}
                      {:else if row[field.value]}
                        {row[field.value] as string}
                      {:else}
                        <span class="text-gray-400">—</span>
                      {/if}
                    </td>
                  {/each}
                  
                </tr>
              {:else}
                <tr>
                  <td colspan={FIELDS.length + (actionButtons.length > 0 ? 1 : 0)} class="px-2 py-1 text-center text-xs text-gray-500">
                    No records found
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        
        {#if pagination && paginatedSource.length > 0}
          <div class="bg-gray-50 px-3 py-1.5 flex items-center justify-between border-t border-gray-200">
            <div class="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                size="sm"
                disabled={paginationSettings.page === 0}
                onclick={() => {
                  paginationSettings = { ...paginationSettings, page: Math.max(0, paginationSettings.page - 1) };
                  updatePagination();
                }}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={paginationSettings.page >= Math.ceil(filteredData.length / paginationSettings.limit) - 1}
                onclick={() => {
                  paginationSettings = {
                    ...paginationSettings,
                    page: Math.min(
                      Math.ceil(filteredData.length / paginationSettings.limit) - 1,
                      paginationSettings.page + 1
                    )
                  };
                  updatePagination();
                }}
              >
                Next
              </Button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700">
                  Showing <span class="font-medium">{paginationSettings.page * paginationSettings.limit + 1}</span> to{' '}
                  <span class="font-medium">
                    {Math.min((paginationSettings.page + 1) * paginationSettings.limit, filteredData.length)}
                  </span>{' '}
                  of <span class="font-medium">{filteredData.length}</span> results
                </p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    class="rounded-r-none"
                    disabled={paginationSettings.page === 0}
                    onclick={() => {
                      paginationSettings = { ...paginationSettings, page: 0 };
                      updatePagination();
                    }}
                    title="First page"
                  >
                    <ChevronsLeft class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    class="rounded-none"
                    disabled={paginationSettings.page === 0}
                    onclick={() => {
                      if (paginationSettings.page > 0) {
                        paginationSettings = { ...paginationSettings, page: paginationSettings.page - 1 };
                        updatePagination();
                      }
                    }}
                    title="Previous page"
                  >
                    <ChevronLeft class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    class="rounded-none"
                    disabled={paginationSettings.page >= Math.ceil(filteredData.length / paginationSettings.limit) - 1}
                    onclick={() => {
                      if (paginationSettings.page < Math.ceil(filteredData.length / paginationSettings.limit) - 1) {
                        paginationSettings = { ...paginationSettings, page: paginationSettings.page + 1 };
                        updatePagination();
                      }
                    }}
                    title="Next page"
                  >
                    <ChevronRight class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    class="rounded-l-none"
                    disabled={paginationSettings.page >= Math.ceil(filteredData.length / paginationSettings.limit) - 1}
                    onclick={() => {
                      paginationSettings = { 
                        ...paginationSettings, 
                        page: Math.ceil(filteredData.length / paginationSettings.limit) - 1 
                      };
                      updatePagination();
                    }}
                    title="Last page"
                  >
                    <ChevronsRight class="h-4 w-4" />
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <Sheet.Root open={isSheetOpen} onOpenChange={(open) => isSheetOpen = open}>
    <Sheet.Portal>
      <Sheet.Overlay class="fixed inset-0 z-50 bg-black/80" />
      <Sheet.Content class="fixed top-0 right-0 z-50 h-full w-full sm:max-w-7xl bg-white shadow-lg sm:rounded-l-xl overflow-hidden flex flex-col">
        <div class="p-6 overflow-y-auto flex-1">
          <div class="flex items-center justify-between mb-4">
            <Sheet.Title class="text-lg font-semibold">
              {selectedRow?.ROWID ? 'Edit' : 'Add New'} {heading || 'Item'}
            </Sheet.Title>
            <div class="flex items-center space-x-3">
              <!-- <Button 
                variant="outline" 
                type="button"
                onclick={() => isSheetOpen = false}
              >
                Cancel
              </Button> -->
              <Button 
                type="button" 
                onclick={handleSave}
                disabled={!selectedRow}
                class="mr-8"
              >
                <Save class="w-4 h-4 mr-2" />
                {selectedRow?.ROWID ? 'Update' : 'Create'}
              </Button>
              <!-- <Sheet.Close asChild>
                <Button variant="ghost" size="icon" onclick={() => isSheetOpen = false} type="button">
                  <X class="h-4 w-4" />
                  <span class="sr-only">Close</span>
                </Button>
              </Sheet.Close> -->
            </div>
          </div>
          <!-- <Sheet.Description class="text-sm text-gray-500 mb-6">
            {selectedRow?.ROWID ? 'Update the item details below' : 'Fill in the details to add a new item'}
          </Sheet.Description> -->

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {#each editableFields as field}
              <div class="space-y-2 col-span-1">
                <Label for={field.value} class="text-sm font-medium text-gray-700">
                  {field.text.replaceAll('_',' ')}
                  {#if field.required}<span class="text-red-500 ml-1">*</span>{/if}
                </Label>
                
                {#if field.type === 'select'}
                  {#if field.options_query?.length > 0}
                    <Select.Root type="single"
                      value={selectedRow?.[field.value] || ''}
                      onValueChange={(value: string) => handleSelectChange(field.value, value)}
                    >
                      <Select.Trigger class="w-full">
                        {#if selectedRow?.[field.value]}
                          {field.options_query.find(opt => String(opt.VAL) === String(selectedRow?.[field.value]))?.KEY || String(selectedRow?.[field.value] || '')}
                        {:else}
                          <span class="text-muted-foreground">Select {field.text}</span>
                        {/if}
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Group>
                          <Select.Label>{field.text}</Select.Label>
                          {#each field.options_query as opt, i (i)}
                            <Select.Item value={String(opt.VAL)}>
                              {opt.KEY}
                            </Select.Item>
                          {/each}
                        </Select.Group>
                      </Select.Content>
                    </Select.Root>
                  {:else}
                    <div class="text-sm text-muted-foreground">No options available</div>
                  {/if}
                {:else if field.type === 'checkbox'}
                  <div class="flex items-start space-x-2">
                    <Checkbox
                      id={field.value}
                      checked={!!selectedRow[field.value]}
                      onchange={(e) => handleInputChange(field.value, e.target.checked)}
                    />
                    <Label for={field.value} class="text-sm font-normal">{field.helpText || field.text}</Label>
                  </div>
                {:else if field.type === 'textarea'}
                  <textarea
                    id={field.value}
                    class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedRow[field.value] || ''}
                    oninput={(e) => handleInputChange(field.value, e.target.value)}
                    placeholder={field.placeholder || `Enter ${field.text.toLowerCase()}`}
                    rows="3"
                  ></textarea>
                {:else}
                  {#if field.type === 'date' && selectedRow}
                    <Input 
                      id={field.value}
                      type="date"
                      value={selectedRow[field.value] ? new Date(selectedRow[field.value] as string).toISOString().split('T')[0] : ''}
                      oninput={(e: Event) => {
                        const target = e.target as HTMLInputElement;
                        const date = target.value ? new Date(target.value).toISOString() : '';
                        handleInputChange(field.value, date);
                      }}
                      placeholder={field.placeholder || `Select ${field.text.toLowerCase()}`}
                      required={field.required}
                    />
                  {:else if selectedRow}
                    <Input 
                      id={field.value} 
                      type={field.type || 'text'}
                      value={String(selectedRow[field.value] || '')}
                      oninput={(e: Event) => handleInputChange(field.value, (e.target as HTMLInputElement).value)}
                      placeholder={field.placeholder || `Enter ${field.text.toLowerCase()}`}
                      required={field.required}
                    />
                  {/if}
                {/if}
                {#if field.helpText}
                  <p class="text-xs text-gray-500">{field.helpText}</p>
                {/if}
              </div>
            {/each}
          </div>


        </div>
      </Sheet.Content>
    </Sheet.Portal>
  </Sheet.Root>
</div>

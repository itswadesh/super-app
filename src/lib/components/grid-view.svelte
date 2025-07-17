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
import * as XLSX from 'xlsx'

// Type definitions
type FieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea'

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
  type?: FieldType
  options?: string | Option[]
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

interface ColumnInfo {
  cid: number
  name: string
  type: string
  notnull: number
  dflt_value: string | number | null
  pk: number
  comments?: string
}

type TableData = {
  [key: string]: string | number | boolean | null | undefined
  ROWID?: string
}

type IconProps = {
  size?: string | number
  width?: string | number
  height?: string | number
  class?: string
  color?: string
  [key: `aria-${string}`]: string | undefined
}

// Component props
let {
  FIELDS,
  QUERY = '',
  heading = '',
  backLink = '',
  sort = true,
  add = true,
  edit = true,
  del = true,
  del1 = false,
  search = true,
  pagination = true,
  allowRegistration = false,
  dispatch = () => {},
} = $props<{
  FIELDS: Field[]
  QUERY?: string
  heading?: string
  backLink?: string
  sort?: boolean
  add?: boolean
  edit?: boolean
  del?: boolean
  del1?: boolean
  search?: boolean
  pagination?: boolean
  allowRegistration?: boolean
  dispatch?: (action: string, data?: unknown) => void
}>()

// State for database schema information
let tableSchema = $state<ColumnInfo[]>([])

// Extract column order from SQL query
function extractColumnOrderFromQuery(query: string): string[] {
  if (!query) return []

  try {
    // Simple regex to extract the SELECT part of the query
    const selectMatch = query.match(/^\s*SELECT\s+([\s\S]+?)\s+FROM/i)
    if (!selectMatch) return []

    const selectPart = selectMatch[1].trim()

    // Split by comma but handle quoted strings and subqueries
    const columns = []
    let current = ''
    let inQuotes = false
    let inParens = 0

    for (let i = 0; i < selectPart.length; i++) {
      const char = selectPart[i]

      if (char === "'" && (i === 0 || selectPart[i - 1] !== '\\')) {
        inQuotes = !inQuotes
      } else if (char === '(' && !inQuotes) {
        inParens++
      } else if (char === ')' && !inQuotes) {
        inParens = Math.max(0, inParens - 1)
      }

      if (char === ',' && !inQuotes && inParens === 0) {
        const col = current.trim()
        if (col) {
          // Extract column name (handle 'AS' aliases)
          const aliasMatch = col.match(/\bAS\s+([^\s,)]+)$/i) ||
            col.match(/\.([^\s,)]+)$/) || [null, col]
          columns.push(aliasMatch[1].replace(/[`"\[\]]/g, ''))
        }
        current = ''
      } else {
        current += char
      }
    }

    // Add the last column
    if (current.trim()) {
      const aliasMatch = current.trim().match(/\bAS\s+([^\s,)]+)$/i) ||
        current.trim().match(/\.([^\s,)]+)$/) || [null, current.trim()]
      columns.push(aliasMatch[1].replace(/[`"\[\]]/g, ''))
    }

    return columns
  } catch (error) {
    console.error('Error parsing SQL query:', error)
    return []
  }
}

// Initialize with empty array to prevent undefined errors
let mergedFields = $state<Field[]>([])
let columnOrder = $state<string[]>([])

// Extract column order when QUERY changes
$effect(() => {
  if (QUERY) {
    columnOrder = extractColumnOrderFromQuery(QUERY)
  } else {
    columnOrder = []
  }
})

// Update merged fields when schema, FIELDS, or columnOrder changes
$effect(() => {
  // Create a map of custom fields for quick lookup
  const customFields = new Map(FIELDS?.map((field) => [field.value, field]) || [])

  // Create a map of all available fields from database schema
  const allFields = new Map<string, Field>()
  const customFieldLookup = new Map(FIELDS?.map((f) => [f.value, f]) || [])

  // First, add all fields from the database schema
  if (Array.isArray(tableSchema) && tableSchema.length > 0) {
    console.log('Table Schema:', JSON.stringify(tableSchema, null, 2)) // Log full schema

    for (const column of tableSchema) {
      if (!column) continue // Skip null/undefined columns

      // Try different possible property names for the column name
      const fieldName = column.name || column.NAME || column.column_name || column.COLUMN_NAME
      if (!fieldName) {
        console.warn('Skipping column with no name:', column)
        continue
      }

      const customField = customFieldLookup.get(fieldName)
      const columnType = column.type || column.TYPE || column.data_type || column.DATA_TYPE

      // Create base field from schema with comments as default text
      const field: Field = {
        text:
          column.comments ||
          column.COMMENTS ||
          (fieldName ? fieldName.replace(/_/g, ' ') : 'Unknown'),
        value: fieldName,
        type: getFieldTypeFromDbType(columnType),
        required: column.notnull === 1 || column.NULLABLE === 'N',
      }
      // If we have a custom field definition, use its text and type
      if (customField) {
        field.text = customField.text || field.text // FIELDS prop text takes highest priority
        field.type = customField.type || field.type
        Object.assign(field, customField) // Apply all other custom field properties
      }

      allFields.set(fieldName, field)
    }
  }

  // Add any additional fields from FIELDS that weren't in the schema
  // This is useful for virtual fields or fields that might be added dynamically
  if (FIELDS?.length) {
    for (const field of FIELDS) {
      if (!allFields.has(field.value)) {
        allFields.set(field.value, {
          // For fields not in schema but in FIELDS, use FIELDS text or format the value
          text: field.text || field.value.replace(/_/g, ' '), // FIELDS text takes priority
          value: field.value,
          type: field.type || 'text',
          ...field,
        })
      }
    }
  }

  // Now apply the column order if we have one
  if (columnOrder.length > 0) {
    const orderedFields: Field[] = []
    const processedFields = new Set<string>()

    // First add 'type' field if it exists
    const typeField = allFields.get('type')
    if (typeField) {
      orderedFields.push(typeField)
      processedFields.add('type')
    }

    // Then add columns in the order they appear in the SELECT statement
    for (const colName of columnOrder) {
      if (colName !== 'type' && !processedFields.has(colName)) {
        let field = allFields.get(colName)

        // If field doesn't exist in our schema yet, create a default one
        if (!field) {
          field = {
            text: colName.replace(/_/g, ' '),
            value: colName,
            type: 'text', // Default type
          }
        }

        if (field) {
          orderedFields.push(field)
          processedFields.add(colName)
        }
      }
    }

    // Then add any remaining fields that weren't in the SELECT statement
    for (const [colName, field] of allFields.entries()) {
      if (!processedFields.has(colName)) {
        orderedFields.push(field)
        processedFields.add(colName)
      }
    }

    mergedFields = orderedFields
  } else {
    // If no column order, move 'type' field to the beginning if it exists
    const fields = Array.from(allFields.values())
    const typeIndex = fields.findIndex((f) => f.value === 'type')
    if (typeIndex > 0) {
      const [typeField] = fields.splice(typeIndex, 1)
      fields.unshift(typeField)
    }
    mergedFields = fields
  }
})

// Map database types to field types
function getFieldTypeFromDbType(dbType: string): FieldType {
  if (!dbType) return 'text'

  // Convert to uppercase for consistent comparison (Oracle types are often uppercase)
  const type = dbType.toUpperCase()

  // Debug log can be removed after verification
  // console.log('DB Type:', type)

  // Handle number types - check for Oracle NUMBER type first
  if (
    type === 'NUMBER' || // Oracle NUMBER type
    type.startsWith('NUMBER(') || // Oracle NUMBER with precision/scale
    type.includes('INT') ||
    type.includes('FLOAT') ||
    type.includes('DOUBLE') ||
    type.includes('DECIMAL') ||
    type.includes('REAL') ||
    type.includes('NUM') ||
    type.includes('VALUE') ||
    type.includes('AMOUNT') ||
    type.includes('PRICE') ||
    type.includes('TOTAL') ||
    type.includes('SUM') ||
    type.includes('QTY') ||
    type.includes('QUANTITY') ||
    type.includes('COUNT')
  ) {
    return 'number'
  }

  // Handle Oracle DATE, TIMESTAMP, and other date/time types
  if (
    // Oracle date types
    type === 'DATE' ||
    type.startsWith('TIMESTAMP') ||
    // Common date patterns in column names
    type.includes('DATE') ||
    type.includes('DT_') ||
    type.endsWith('_DT') ||
    type.endsWith('_DATE') ||
    type.includes('DT_OF_') ||
    type === 'DT' ||
    // Specific field names that should be treated as dates (case-insensitive)
    [
      'DT_OF_COMPLETION',
      'COMPLETION_DATE',
      'DATE_COMPLETED',
      'CREATED_AT',
      'UPDATED_AT',
      'MODIFIED_DATE',
    ].some((dateField) => type.includes(dateField))
  ) {
    return 'date'
  }

  // Handle boolean types
  if (type.includes('bool') || type.startsWith('is_') || type.startsWith('has_')) {
    return 'checkbox'
  }

  // Handle large text fields
  if (
    type.includes('text') ||
    type.includes('char') ||
    type.includes('clob') ||
    type.includes('desc') ||
    type.includes('note') ||
    type.includes('comment')
  ) {
    return 'textarea'
  }

  // Default to text for unknown types
  return 'text'
}

// Fetch column types from database
async function fetchColumnTypes() {
  if (!TABLE_NAME) return

  try {
    const response = await post('query', {
      q: `SELECT t.column_name as name,
       t.data_type   as type,
       t.nullable    as notnull,
       c.comments
  FROM all_tab_columns t, USER_COL_COMMENTS c
          WHERE t.table_name = '${TABLE_NAME.toUpperCase()}' 
          and t.table_name = c.table_name
          and t.COLUMN_NAME = c.COLUMN_NAME
          ${DB_NAME ? `AND t.owner = '${DB_NAME.toUpperCase()}'` : ''}
          ORDER BY t.column_id`,
      db: DB_NAME || undefined,
    })

    if (Array.isArray(response)) {
      tableSchema = response as ColumnInfo[]
    }
  } catch (error) {
    console.error('Error fetching table schema:', error)
    toast.warning('Could not fetch table schema, using field definitions only')
  }
}

// Parse query to extract table name, db name, and fields
function parseQuery(query: string): { tableName: string; dbName: string; fields: Field[] } {
  if (!query) return { tableName: '', dbName: '', fields: [] as Field[] }

  // Extract DB_NAME if specified in format [DB_NAME].TABLE_NAME
  let dbName = ''
  let tableName = ''
  const dbTableMatch = query.match(/from\s+\[?([^\]\s]+)\]?\.\[?([^\]\s]+)\]?/i)
  if (dbTableMatch) {
    dbName = dbTableMatch[1].trim()
    tableName = dbTableMatch[2].trim()
  } else {
    // Try to extract just table name if no DB specified
    const tableMatch = query.match(/from\s+\[?([^\]\s,;)]+)\]?/i)
    if (tableMatch) {
      tableName = tableMatch[1].trim()
    }
  }

  // Extract fields from SELECT clause
  const selectMatch = query.match(/select\s+(.+?)\s+from/i)
  let fields: Field[] = []

  if (selectMatch) {
    const selectClause = selectMatch[1].trim()
    // Split by comma but handle quoted strings and function calls
    const fieldParts = selectClause.split(',').map((p) => p.trim())

    fields = fieldParts.map((field) => {
      // Handle field aliases (e.g., 'field as alias' or 'field alias')
      const aliasMatch = field.match(/(?:as\s+)?([^\s,;]+)$/i)
      let fieldName = aliasMatch ? aliasMatch[1].trim() : field.trim()

      // Remove any table alias prefix (e.g., 't.', 'a.', etc.)
      const cleanFieldName = fieldName.replace(/^[a-zA-Z0-9_]+\./, '')

      return {
        text: cleanFieldName.replace(/_/g, ' '),
        value: cleanFieldName,
        type: 'text' as const,
      }
    })
  }

  return { tableName, dbName, fields }
}

// Initialize
onMount(() => {
  const { tableName, dbName } = parseQuery(QUERY)
  if (tableName && dbName) {
    fetchColumnTypes()
  }
})

// State with proper typing
let data: TableData[] = $state([])
let filteredData = $state<TableData[]>([])
let selectedRow = $state<TableData | null>(null)

// Derived state from QUERY
let TABLE_NAME = $state('')
let DB_NAME = $state('')
let fieldsFromDB = $state<Field[]>([])

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

let visibleFields = $derived<Field[]>(
  (mergedFields || []).filter((field) => field.value !== 'ROWID' && !field.no?.table)
)

let editableFields = $derived<Field[]>(
  (mergedFields || []).filter((field) => field.value !== 'ROWID' && !field.no?.edit)
)

// Export data to Excel
function exportToExcel() {
  try {
    // Prepare the data for export
    const exportData = filteredData.map((row) => {
      const rowData: Record<string, any> = {}

      // Only include visible fields in the export
      visibleFields.forEach((field) => {
        // Handle nested properties if needed
        const value = row[field.value]

        // Format date fields if needed
        if (field.type === 'date' && value) {
          rowData[field.text] = new Date(value).toLocaleDateString()
        } else {
          rowData[field.text] = value
        }
      })

      return rowData
    })

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData)

    // Create workbook
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

    // Generate file name with current date
    const fileName = `${heading || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`

    // Save the file
    XLSX.writeFile(wb, fileName)

    toast.success('Export completed successfully')
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    toast.error('Failed to export to Excel')
  }
}

// Initialize data and columns with proper typing
onMount(async (): Promise<void> => {
  try {
    // Parse the query to get table name, db name, and fields
    const parsed = parseQuery(QUERY)
    TABLE_NAME = parsed.tableName
    DB_NAME = parsed.dbName
    fieldsFromDB = parsed.fields

    await Promise.all([fetchData(), fetchColumnTypes(), loadColumnOptions()])
  } catch (error) {
    console.error('Error initializing grid view:', error)
    toast.error('Failed to initialize grid view')
  }
})

// Load column options for select fields with proper typing
async function loadColumnOptions(): Promise<void> {
  await Promise.all(
    fieldsFromDB.map(async (item: Field) => {
      if (!item.no?.edit) {
        editableColumns = [...editableColumns, item]
      }
      if (item.type === 'select' && item.options) {
        const options = await getOptions(item.options)
        optionValues = [...optionValues, ...(options || [])]
      }
    })
  )
}

// Fetch data from API
async function fetchData() {
  try {
    const response: unknown = await post('query', {
      q: QUERY,
      db: DB_NAME || undefined,
    })

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
    const response: unknown = await post('query', {
      q: query,
      db: DB_NAME || undefined,
    })
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
      keys: fieldsFromDB.filter((f: Field) => !f.no?.table).map((f: Field) => f.value),
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

// Handle edit with proper typing
function handleCreate(row: TableData) {
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
      // Skip ROWID - we should never update ROWID
      if (item.value === 'ROWID') return
      
      console.log(selectedRow)
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
    console.log(selectedRow?.ROWID)
    if (!selectedRow?.ROWID) {
      if (insert_columns.length === 0) {
        throw new Error('Cannot create a new record with no data. Please fill in at least one field.')
      }
      q = `INSERT INTO ${TABLE_NAME}(${insert_columns.join(',')}) VALUES (${insert_values.join(',')})`
    }
    console.log('qqqqqqqqqqqqqqqq',q)
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
    // Convert string to number if the field is a number type
    const fieldType = mergedFields.find((f) => f.value === field)?.type
    const processedValue =
      fieldType === 'number' && typeof value === 'string' ? Number.parseFloat(value) || 0 : value

    selectedRow = { ...row, [field]: processedValue }
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

<div class="m-2">
  <div class="flex flex-col">
    <div class="table-container">
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-4">
          <h2 class="text-2xl font-semibold">{heading}</h2>
          <Button size="sm" variant="outline" onclick={exportToExcel}>
            <span class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" x2="12" y1="15" y2="3"/>
              </svg>
              Export to Excel
            </span>
          </Button>
        </div>
        {#if search}
        <div class="w-1/2">
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
        {#if add}
          <Sheet.Root open={isSheetOpen} onOpenChange={(open) => isSheetOpen = open}>
            <Sheet.Trigger asChild>
              <Button
                variant="outline"
                onclick={handleCreate}
              >
                <Plus class="w-4 h-4 mr-2" />
                Add New
              </Button>
            </Sheet.Trigger>
          </Sheet.Root>
        {/if}
      </div>
      
    
      
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
                
                {#each mergedFields as field}
                {#if field.value !== 'ROWID'}
                  <th 
                    scope="col"
                    class="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors bg-gray-50 {sortConfig?.key === field.value ? 'bg-gray-100' : ''}"
                    onclick={() => sort && sortColumn(field.value)}
                  >
                    <div class="flex items-center">
                      {field.text}
                      {#if sort && sortConfig}
                        {#if sortConfig.key === field.value}
                          {#if sortConfig.direction === 'asc'}
                            <ArrowUp class="ml-1 h-3 w-3 text-blue-500" />
                          {:else}
                            <ArrowDown class="ml-1 h-3 w-3 text-blue-500" />
                          {/if}
                        {:else}
                          <!-- <ArrowUpDown class="ml-1 h-3 w-3 text-gray-400" /> -->
                        {/if}
                      {/if}
                    </div>
                  </th>
                {/if}
                {/each}
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200 text-xs">
              {#each paginatedSource as row, i (row.ROWID || i)}
                {#if fieldsFromDB[row.value] !== 'ROWID'}
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
                  {#each mergedFields as field}
                  {#if field.value !== 'ROWID'}
                    <td class={`px-2 py-1 whitespace-nowrap text-xs ${field.type === 'number' ? 'text-right' : ''} ${typeof row[field.value] === 'number' ? 'font-mono' : ''}`}>
                      {#if field.type === 'checkbox'}
                        <Checkbox checked={!!(row[field.value] as boolean)} disabled />
                      {:else if field.type === 'image'}
                        <img src={row[field.value] as string} alt={field.text} class="h-10 w-10 rounded-full" />
                      {:else if field.type === 'date' && row[field.value]}
                        {formatDate(row[field.value])}
                      {:else if field.type === 'number' && row[field.value] !== null && row[field.value] !== undefined}
                        {Number.isInteger(Number(row[field.value])) ? Number(row[field.value]) : Math.round(Number(row[field.value]))}
                      {:else if row[field.value]}
                        {row[field.value] as string}
                      {:else}
                        <span class="text-gray-400">—</span>
                      {/if}
                    </td>
                  {/if}
                  {/each}
                  
                </tr>
                {/if}
              {:else}
                <tr>
                  <td colspan={fieldsFromDB.length + (actionButtons.length > 0 ? 1 : 0)} class="px-2 py-1 text-center text-xs text-gray-500">
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
              {#if field.value !== 'ROWID'}
              <div class="space-y-1 col-span-1">
                <Label for={field.value} class="text-gray-500" style="font-size: x-small;">
                  {field.text}
                  {#if field.required}<span class="text-red-500 ml-1">*</span>{/if}
                </Label>
                
                {#if field.type === 'select'}
                  {#if field.options?.length > 0}
                    <Select.Root type="single"
                      value={selectedRow?.[field.value] || ''}
                      onValueChange={(value: string) => handleSelectChange(field.value, value)}
                    >
                      <Select.Trigger class="w-full">
                        {#if selectedRow?.[field.value]}
                          {field.options.find(opt => String(opt.VAL) === String(selectedRow?.[field.value]))?.KEY || String(selectedRow?.[field.value] || '')}
                        {:else}
                          <span class="text-muted-foreground">Select {field.text?.toLowerCase()}</span>
                        {/if}
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Group>
                          <Select.Label>{field.text}</Select.Label>
                          {#each field.options as opt, i (i)}
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
                    <Label for={field.value} class="text-xs font-normal">{field.helpText || field.text}</Label>
                  </div>
                {:else if field.type === 'textarea'}
                  <textarea
                    id={field.value}
                    class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 capitalize"
                    value={selectedRow[field.value] || ''}
                    oninput={(e) => handleInputChange(field.value, e.target.value)}
                    placeholder={field.placeholder || `Enter ${field.text}`}
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
                      oninput={(e) => {
                        const target = e.target as HTMLInputElement;
                        if (field.type === 'number') {
                          const numValue = target.value ? Number(target.value) : 0;
                          handleInputChange(field.value, numValue);
                        } else if (field.type === 'checkbox') {
                          handleInputChange(field.value, target.checked);
                        } else {
                          // For text, date, and other input types
                          handleInputChange(field.value, target.value);
                        }
                      }}
                      placeholder={field.placeholder || `Enter ${field.text.toLowerCase()}`}
                      required={field.required}
                    />
                  {/if}
                {/if}
                {#if field.helpText}
                  <p class="text-xs text-gray-500">{field.helpText}</p>
                {/if}
              </div>
              {/if}
            {/each}
          </div>
        </div>
      </Sheet.Content>
    </Sheet.Portal>
  </Sheet.Root>
</div>

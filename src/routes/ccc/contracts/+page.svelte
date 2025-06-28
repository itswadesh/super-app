<script>
import GridView from '$lib/components/grid-view.svelte'
import { QUERY, FIELDS } from './config'
</script>

<GridView
  heading="CCC Contracts"
  backLink="/ccc"
  sort={true}
  add={true}
  edit={true}
  search={true}
  export={true}
  del={false}
  del1={false}
  pagination={true}
  actionButtons={true}
  {FIELDS}
  {QUERY}
  onSort={(column, direction) => console.log('Sorting by', column, direction)}
  onSearch={(query) => console.log('Searching for', query)}
  onEdit={(row) => console.log('Editing row', row)}
  onDelete={(row) => console.log('Deleting row', row)}
  onAdd={() => console.log('Adding new record')}
  editable_columns={FIELDS.filter(field => !field.no?.edit)}
/>

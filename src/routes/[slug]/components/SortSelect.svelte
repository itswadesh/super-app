<script lang="ts">
let value = 'latest'
const options: Array<{ value: string; label: string }> = [
  { value: 'latest', label: 'Latest' },
  { value: 'title-asc', label: 'A to Z' },
  { value: 'title-desc', label: 'Z to A' },
]

export let onChange: (value: string) => void

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  onChange(target.value)
}
</script>

<div class="flex items-center">
  <label for="sort-by" class="mr-2 text-sm font-medium text-gray-700">
    Sort by:
  </label>
  <select
    id="sort-by"
    class="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
    on:change={handleChange}
    bind:value
  >
    {#each options as option}
      <option value={option.value}>
        {option.label}
      </option>
    {/each}
  </select>
</div>

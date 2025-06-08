<script lang="ts">
import { page } from '$app/state'

const { category } = $props<{
  category: {
    name: string
    slug: string
  }
}>()

const homeHref = $derived(page.url.origin)
</script>

<nav class="breadcrumbs mb-3" aria-label="Breadcrumb">
  <ol class="flex items-center space-x-2 text-sm text-gray-600">
    <li>
      <a href={homeHref} class="hover:text-blue-600">Home</a>
    </li>
    <li class="text-gray-400">/</li>
    <li class="text-gray-900 font-medium">
      {category?.name || 'Subject'}
    </li>
  </ol>
</nav>

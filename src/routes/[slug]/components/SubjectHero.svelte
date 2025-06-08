<script lang="ts">
const { category, class: className = '' } = $props<{
  category: {
    name: string
    description?: string
    thumbnailUrl?: string
  }
  class?: string
}>()
</script>

<header class="relative bg-gradient-to-r from-blue-600 mb-2 to-blue-800 text-white rounded-lg overflow-hidden {className}">
  <div class="absolute inset-0 opacity-10">
    {#if category?.thumbnailUrl}
      <img 
        src={category.thumbnailUrl} 
        alt="" 
        class="w-full h-full object-cover"
        loading="lazy"
      />
    {/if}
  </div>
  
  <div class="relative z-10 p-4 md:p-6">
    <h1 class="text-2xl md:text-3xl font-bold">
      {category?.name || 'Subject'}
    </h1>
    {#if category?.description}
      <p class="text-blue-100 max-w-3xl text-sm md:text-base mt-1">
        {category.description}
      </p>
    {/if}
  </div>
</header>

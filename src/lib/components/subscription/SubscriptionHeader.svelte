<script lang="ts">
// Props
export let title: string = 'Choose Your Plan'
export let description: string = 'Select the plan that works best for you'
</script>

<div class="flex flex-col items-center mb-10">
  <span class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">Super App</span>
  <span class="text-lg font-medium text-gray-600">Knowledge Amplified</span>
  
  <div class="mt-6 text-center">
    <h1 class="text-3xl font-bold text-gray-900 sm:text-4xl">{title}</h1>
    {#if description}
      <p class="mt-2 text-lg text-gray-600">{description}</p>
    {/if}
  </div>
</div>

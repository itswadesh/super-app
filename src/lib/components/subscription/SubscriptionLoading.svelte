<script lang="ts">
  export let message: string = 'Loading subscription plans...';
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
  <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
    <div class="flex flex-col items-center">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
      <p class="text-gray-700">{message}</p>
    </div>
  </div>
</div>

<script lang="ts">
import DownloadPdfButton from './DownloadPdfButton.svelte'

// Resource information with proper typing for Svelte 5
const resource = $state({
  id: 'sample-123',
  type: 'note',
  title: 'Sample Study Material',
  price: 299,
})
</script>

<div class="p-6 bg-white rounded-lg shadow-md">
  <h2 class="text-2xl font-bold mb-4">{resource.title}</h2>
  
  <p class="mb-6 text-gray-700">
    This is a sample resource that demonstrates the PDF download functionality with authentication and subscription verification.
  </p>
  
  <div class="flex space-x-4">
    <DownloadPdfButton
      resourceId={resource.id}
      resourceType={resource.type}
      title={resource.title}
      price={resource.price}
    />
    
    <!-- Variations of the button -->
    <DownloadPdfButton
      resourceId={resource.id}
      resourceType={resource.type}
      title={resource.title}
      price={resource.price}
      variant="secondary"
      size="sm"
    />
    
    <DownloadPdfButton
      resourceId={resource.id}
      resourceType={resource.type}
      title={resource.title}
      price={resource.price}
      variant="outline"
      size="lg"
    />
  </div>
</div>

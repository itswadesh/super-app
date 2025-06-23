<script lang="ts">
// ContentDisplay.svelte - Handles both paid/free content display

// Props
const {
  isPaid = false,
  contentType = 'video', // 'video' or 'note'
  videoUrl = '',
  youtubeId = '',
  fileUrl = '',
  title = '',
  description = '',
  thumbnailUrl = '',
  isUserSubscribed = false,
  isPreview = false,
} = $props()

// Component state
const showPaywall = $state(isPaid && !isUserSubscribed && !isPreview)

// Computed values
const isVideo = $derived(contentType === 'video')
const isNote = $derived(contentType === 'note')
const hasYoutubeId = $derived(!!youtubeId)
const formattedVideoUrl = $derived(
  hasYoutubeId ? `https://www.youtube.com/embed/${youtubeId}` : videoUrl
)

// Extract file extension for document viewer
const fileExtension = $derived(() => {
  if (!fileUrl) return ''
  const parts = fileUrl.split('.')
  return parts[parts.length - 1].toLowerCase()
})
</script>

<div class="content-display rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
  {#if showPaywall}
    <div class="paywall p-6 flex flex-col items-center justify-center space-y-4 bg-gradient-to-br from-indigo-50 to-indigo-100 h-[300px]">
      <div class="lock-icon bg-indigo-100 p-3 rounded-full text-indigo-600">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 class="text-xl font-semibold text-gray-800">{title}</h3>
      <p class="text-gray-600 text-center">{description || 'This content is available with a paid subscription.'}</p>
      <button class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
        Upgrade to Access
      </button>
    </div>
  {:else}
    <!-- Content Display -->
    {#if isVideo}
      <div class="video-container aspect-video relative bg-black">
        <iframe
          src={formattedVideoUrl}
          title={title}
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          class="absolute inset-0 w-full h-full"
        ></iframe>
      </div>
    {:else if isNote}
      <div class="document-viewer min-h-[300px] p-4">
        {#if fileExtension === 'pdf'}
          <iframe 
            src={fileUrl} 
            title={title}
            class="w-full h-[600px] border-0"
          ></iframe>
        {:else if ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)}
          <img src={fileUrl} alt={title} class="max-w-full h-auto mx-auto" />
        {:else if ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension)}
          <!-- For Office files, provide download link -->
          <div class="flex flex-col items-center justify-center p-6 space-y-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-gray-700">{title}</p>
            <a 
              href={fileUrl} 
              download
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              Download Document
            </a>
          </div>
        {:else}
          <!-- Default display for other file types -->
          <div class="flex items-center justify-center p-6">
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              View Content
            </a>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Content Info -->
    <div class="content-info p-4 border-t border-gray-200">
      <h3 class="text-lg font-semibold text-gray-800">{title}</h3>
      {#if description}
        <p class="text-gray-600 mt-1">{description}</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* Ensure 16:9 aspect ratio for videos */
  .video-container {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
    height: 0;
    overflow: hidden;
  }
  
  .video-container iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>

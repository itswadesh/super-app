<script lang="ts">
import { goto } from '$app/navigation'

// Use Svelte 5 runes for props
const {
  authorId,
  name,
  avatarUrl,
  role = 'Instructor',
  size = 'medium',
} = $props<{
  authorId: string
  name: string
  avatarUrl?: string
  role?: string
  size?: 'small' | 'medium' | 'large'
}>()

// Computed sizes for different size options using Svelte 5 runes
const dimensions = $derived(
  {
    small: { avatar: 'w-8 h-8', text: 'text-xs' },
    medium: { avatar: 'w-12 h-12', text: 'text-sm' },
    large: { avatar: 'w-16 h-16', text: 'text-base' },
  }[size]
)

// Navigate to author profile
function navigateToAuthorProfile() {
  goto(`/author/${authorId}`)
}
</script>

<div class="flex items-center gap-3 hover:bg-gray-50 transition-colors rounded-lg p-2 cursor-pointer" onclick={navigateToAuthorProfile}>
  <div class="flex-shrink-0">
    {#if avatarUrl}
      <img 
        src={avatarUrl} 
        alt={name} 
        class="{dimensions.avatar} rounded-full object-cover border border-gray-200"
      />
    {:else}
      <div class="{dimensions.avatar} rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
        {name.charAt(0)}
      </div>
    {/if}
  </div>
  
  <div>
    <p class="font-medium text-gray-900 {dimensions.text}">{name}</p>
    <p class="{dimensions.text} text-gray-500">{role}</p>
  </div>
</div>

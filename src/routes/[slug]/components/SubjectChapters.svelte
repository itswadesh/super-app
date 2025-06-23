<script context="module" lang="ts">
export interface Chapter {
  id: string
  name: string
  slug: string
  order: number
  description?: string
}

export type { Chapter }
</script>

<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { ComponentType } from 'svelte';

  export let chapters: Chapter[] = [];
  export let children: ComponentType | null = null;

  // Generate a pastel color based on the chapter number
  function getChapterColor(index: number): string {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-purple-100 text-purple-700',
      'bg-green-100 text-green-700',
      'bg-amber-100 text-amber-700',
      'bg-rose-100 text-rose-700',
      'bg-indigo-100 text-indigo-700',
    ];
    return colors[index % colors.length];
  }
</script>

<div class="chapter-list">
  {#if children}
    <svelte:component this={children} />
  {/if}

  {#if chapters?.length > 0}
    <section class="mb-6" aria-labelledby="chapters-heading">
      <div class="mb-3 flex items-center justify-between">
        <h2 id="chapters-heading" class="text-base font-semibold text-gray-800">
          Chapters
        </h2>
        <span class="text-xs text-gray-500">
          {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}
        </span>
      </div>
      
      <div class="flex flex-wrap gap-2">
        {#each chapters as chapter, i (chapter.id)}
          <a
            href={chapter.slug}
            class="group inline-flex items-center px-3 py-1.5 rounded-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors duration-150"
            aria-labelledby={`chapter-${chapter.id}`}
            in:fade={{ duration: 100, delay: i * 10 * (i + 1) }}
          >
            <div class={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mr-2
                      ${getChapterColor(i)} transition-colors`}>
              <span class="font-medium text-xs">{chapter.order}</span>
            </div>
            <span 
              id={`chapter-${chapter.id}`} 
              class="text-sm font-medium text-gray-700 group-hover:text-blue-600 whitespace-nowrap"
              title={chapter.name}
            >
              {chapter.name}
            </span>
          </a>
        {/each}
      </div>
    </section>
  {/if}
</div>
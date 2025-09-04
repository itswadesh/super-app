<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Label } from '$lib/components/ui/label'

  import { onMount } from 'svelte'

  let inputText = $state('')
  let isValidating = $state(false)
  let validUrls = $state<string[]>([])
  let invalidUrls = $state<string[]>([])
  let showResults = $state(false)

  onMount(() => {
    document.title = 'URL Validator | LRNR Tools'
  })

  function normalizeAndSplit(text: string): string[] {
    // split by newlines or commas
    return text
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }

  function looksLikeDomain(s: string): boolean {
    // simple domain check when no scheme provided
    // allows subdomains and TLDs, disallow spaces
    return /^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(s)
  }

  function isUrl(u: string): boolean {
    try {
      const withScheme = /^(https?:)?\/\//i.test(u) ? u : (looksLikeDomain(u) ? `https://${u}` : u)
      // URL constructor throws if invalid
      const parsed = new URL(withScheme)
      // must have hostname at least
      return !!parsed.hostname
    } catch {
      return false
    }
  }

  function validate(e: Event) {
    e.preventDefault()
    showResults = false
    validUrls = []
    invalidUrls = []

    const items = normalizeAndSplit(inputText)
    if (items.length === 0) return

    isValidating = true

    // purely synchronous validation (no network)
    for (const raw of items) {
      if (isUrl(raw)) {
        validUrls.push(raw)
      } else {
        invalidUrls.push(raw)
      }
    }

    // trigger reactivity for arrays
    validUrls = [...validUrls]
    invalidUrls = [...invalidUrls]

    isValidating = false
    showResults = true
  }

  function resetForm() {
    inputText = ''
    validUrls = []
    invalidUrls = []
    showResults = false
  }
</script>

<main class="min-h-screen bg-white dark:bg-gray-900">
  <header class="shadow-sm">
    <div class="container mx-auto px-4 py-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">URL Validator</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">Enter URLs (one per line or comma separated) to check validity.</p>
        </div>
        <a href="/tools" class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">← Back to Tools</a>
      </div>
    </div>
  </header>

  <div class="container mx-auto px-4 py-8">
    <div class="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Validate URLs</CardTitle>
          <CardDescription>We accept plain domains or full URLs. You can separate with new lines or commas.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onsubmit={validate} class="space-y-4">
            <div class="space-y-2">
              <Label for="urls">URLs</Label>
              <textarea
                id="urls"
                bind:value={inputText}
                placeholder={`https://example.com\nexample.org, http://sub.domain.dev`}
                rows={8}
                disabled={isValidating}
                class="w-full min-h-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm dark:text-white text-black ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p class="text-xs text-muted-foreground">Tips: You may enter example.com (scheme will be assumed) or full URLs.</p>
            </div>

            <div class="flex gap-3">
              <Button type="submit" disabled={isValidating || !inputText.trim()} class="bg-blue-600 hover:bg-blue-700 text-white">
                {#if isValidating}
                  <span class="mr-2 h-4 w-4 animate-spin">⟳</span> Validating...
                {:else}
                  Validate
                {/if}
              </Button>
              <Button type="button" onclick={resetForm} variant="outline" disabled={isValidating}>Reset</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {#if showResults}
        {#if invalidUrls.length === 0}
          <div class="mt-6 rounded-md border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-900 dark:bg-green-900/30 dark:text-green-200">
            ✓ All entered URLs look valid.
          </div>
        {:else}
          <Card class="mt-6">
            <CardHeader>
              <CardTitle>Invalid URLs</CardTitle>
              <CardDescription>Fix the following and try again.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul class="list-disc pl-5 space-y-1">
                {#each invalidUrls as u}
                  <li class="text-red-600 dark:text-red-400 break-all">{u}</li>
                {/each}
              </ul>

              {#if validUrls.length > 0}
                <div class="mt-6">
                  <div class="text-sm text-muted-foreground mb-1">Valid URLs (collapsed)</div>
                  <details class="rounded-md border bg-card p-3">
                    <summary class="cursor-pointer text-sm">Show valid list ({validUrls.length})</summary>
                    <ul class="mt-2 list-disc pl-5 space-y-1 text-green-700 dark:text-green-300">
                      {#each validUrls as v}
                        <li class="break-all">{v}</li>
                      {/each}
                    </ul>
                  </details>
                </div>
              {/if}
            </CardContent>
          </Card>
        {/if}
      {/if}
    </div>
  </div>
</main>

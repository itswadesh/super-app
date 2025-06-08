<!-- <script lang="ts">
import { page } from '$app/state'
import { goto } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '$lib/components/ui/sheet'
import { Separator } from '$lib/components/ui/separator'
import {
  LogOut,
  User,
  LayoutDashboard,
  type Icon as LucideIcon,
  BookOpenCheck,
  FileText,
  Settings,
  CreditCard,
  ShieldCheck,
  MessageSquareQuestion,
} from '@lucide/svelte'
import { tick } from 'svelte'

export let categories: any[] = []
export let user: any
export let sheetOpen: boolean

interface NavItem {
  href: string
  label: string
  icon: typeof LucideIcon
  requiresAuth?: boolean
  requiresNoAuth?: boolean
  adminOnly?: boolean
}

const mainNavItems: NavItem[] = [
  { href: '/quiz', label: 'Quizzes', icon: BookOpenCheck },
  { href: '/note', label: 'Notes', icon: FileText },
  { href: '/demo', label: 'Demo', icon: MessageSquareQuestion },
]

const userNavItems: NavItem[] = [
  { href: '/profile', label: 'Profile', icon: User, requiresAuth: true },
  { href: '/my-quizzes', label: 'My Quizzes', icon: BookOpenCheck, requiresAuth: true },
  { href: '/user-preferences', label: 'Preferences', icon: Settings, requiresAuth: true },
  { href: '/subscription', label: 'Subscription', icon: CreditCard, requiresAuth: true },
]

const authNavItems: NavItem[] = [
  { href: '/login', label: 'Login', icon: User, requiresNoAuth: true },
]

const adminNavItems: NavItem[] = [
  { href: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard, adminOnly: true },
]

async function navigateWithSheetClose(path: string) {
  sheetOpen = false
  await tick()
  goto(path)
}

async function handleLogout() {
  sheetOpen = false
  await tick()
  await fetch('/api/auth/logout', { method: 'POST' })
  goto('/login')
}

function isNavItemVisible(item: NavItem): boolean {
  const isAuthenticated = !!user
  const isAdmin = user?.isAdmin // Assuming user object has an isAdmin property

  if (item.requiresAuth && !isAuthenticated) return false
  if (item.requiresNoAuth && isAuthenticated) return false
  if (item.adminOnly && (!isAuthenticated || !isAdmin)) return false
  return true
}
</script>

<Sheet bind:open={sheetOpen}>
  <SheetContent side="left" class="w-[300px] sm:w-[400px] overflow-y-auto">
    <SheetHeader class="mb-4">
      <SheetTitle>Menu</SheetTitle>
      <SheetDescription>
        Navigate through the application.
      </SheetDescription>
    </SheetHeader>
    <div class="flex flex-col space-y-2">
      {#each mainNavItems as item}
        {#if isNavItemVisible(item)}
          <Button
            variant={page.url.pathname === item.href ? 'secondary' : 'ghost'}
            class="w-full justify-start"
            on:click={() => navigateWithSheetClose(item.href)}
          >
            <svelte:component this={item.icon} class="mr-2 h-4 w-4" />
            {item.label}
          </Button>
        {/if}
      {/each}

      {#if categories && categories.length > 0}
        <Separator class="my-2" />
        <h4 class="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">Categories</h4>
        {#each categories as category}
          <Button
            variant={page.url.pathname === `/category/${category.slug}` ? 'secondary' : 'ghost'}
            class="w-full justify-start"
            on:click={() => navigateWithSheetClose(`/category/${category.slug}`)}
          >
            {category.name}
          </Button>
        {/each}
      {/if}

      <Separator class="my-2" />

      {#if user}
        <h4 class="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">My Account</h4>
        {#each userNavItems as item}
          {#if isNavItemVisible(item)}
            <Button
              variant={page.url.pathname === item.href ? 'secondary' : 'ghost'}
              class="w-full justify-start"
              on:click={() => navigateWithSheetClose(item.href)}
            >
              <svelte:component this={item.icon} class="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          {/if}
        {/each}
        {#if user.isAdmin}
          {#each adminNavItems as item}
            {#if isNavItemVisible(item)}
               <Button
                variant={page.url.pathname === item.href ? 'secondary' : 'ghost'}
                class="w-full justify-start"
                on:click={() => navigateWithSheetClose(item.href)}
              >
                <svelte:component this={item.icon} class="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            {/if}
          {/each}
        {/if}
        <Button variant="outline" class="w-full justify-start" on:click={handleLogout}>
          <LogOut class="mr-2 h-4 w-4" />
          Logout
        </Button>
      {:else}
        {#each authNavItems as item}
          {#if isNavItemVisible(item)}
            <Button
              variant={page.url.pathname === item.href ? 'secondary' : 'ghost'}
              class="w-full justify-start"
              on:click={() => navigateWithSheetClose(item.href)}
            >
              <svelte:component this={item.icon} class="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          {/if}
        {/each}
      {/if}
    </div>
  </SheetContent>
</Sheet> -->
<script lang="ts">
import { page } from '$app/state'
import { Button } from '$lib/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '$lib/components/ui/sheet'
import { Menu, X, LayoutDashboard, Video, FileText, BookCheck, Folder, Users, CreditCard } from '@lucide/svelte'

// Icon mapping with type safety
type IconName = 'layoutDashboard' | 'video' | 'fileText' | 'bookCheck' | 'folder' | 'users' | 'creditCard'

// Type for Svelte components
// Using a more specific type for Lucide icons
type LucideIcon = typeof import('@lucide/svelte').Icon
const icons: Record<IconName, LucideIcon> = {
  layoutDashboard: LayoutDashboard,
  video: Video,
  fileText: FileText,
  bookCheck: BookCheck,
  folder: Folder,
  users: Users,
  creditCard: CreditCard,
}

// Get icon component by name
function getIconComponent(name: IconName) {
  return icons[name] || X
}

// Navigation items with proper typing
interface NavItem {
  name: string
  href: string
  icon: IconName
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: 'layoutDashboard' },
  { name: 'Videos', href: '/admin/videos', icon: 'video' },
  { name: 'Notes', href: '/admin/notes', icon: 'fileText' },
  { name: 'Quizzes', href: '/admin/quizzes', icon: 'bookCheck' },
  { name: 'Categories', href: '/admin/categories', icon: 'folder' },
  { name: 'Users', href: '/admin/users', icon: 'users' },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: 'creditCard' },
]

// Check if current route is active
function isActive(href: string): boolean {
  return page.url.pathname === href
}
</script>

<div class="min-h-screen bg-background">
  <!-- Mobile Sidebar -->
  <Sheet>
    <SheetTrigger>
      <Button variant="ghost" size="icon" class="md:hidden fixed top-4 left-4 z-50">
        <Menu class="h-6 w-6" />
        <span class="sr-only">Toggle menu</span>
      </Button>
    </SheetTrigger>
    <SheetContent side="left" class="w-[300px] p-0">
      <div class="flex h-full flex-col">
        <div class="flex h-16 items-center border-b px-6">
          <h1 class="text-xl font-bold">Admin Panel</h1>
          <SheetTrigger>
            <Button variant="ghost" size="icon" class="ml-auto h-8 w-8">
              <X class="h-4 w-4" />
              <span class="sr-only">Close menu</span>
            </Button>
          </SheetTrigger>
        </div>
        <nav class="flex-1 space-y-1 p-4">
          {#each navItems as item}
            <a
              href={item.href}
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground {isActive(item.href) ? 'bg-accent' : ''}"
            >
              <svelte:component this={getIconComponent(item.icon)} class="h-4 w-4" />
              {item.name}
            </a>
          {/each}
        </nav>
      </div>
    </SheetContent>
  </Sheet>

  <!-- Desktop Sidebar -->
  <div class="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
    <div class="flex min-h-0 flex-1 flex-col border-r bg-background">
      <div class="flex h-16 flex-shrink-0 items-center border-b px-6">
        <h1 class="text-xl font-bold">Admin Panel</h1>
      </div>
      <div class="flex flex-1 flex-col overflow-y-auto">
        <nav class="flex-1 space-y-1 p-4">
          {#each navItems as item}
            <a
              href={item.href}
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground {isActive(item.href) ? 'bg-accent' : ''}"
            >
              <svelte:component this={getIconComponent(item.icon)} class="h-4 w-4" />
              {item.name}
            </a>
          {/each}
        </nav>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="md:pl-64">
    <slot />
  </div>
</div>


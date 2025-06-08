<script lang="ts">
import { goto } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs'
import { Skeleton } from '$lib/components/ui/skeleton'
import { Badge } from '$lib/components/ui/badge'
import { Progress } from '$lib/components/ui/progress'
import {
  LayoutDashboard,
  Video as VideoIcon,
  FileText as NotesIcon,
  BookCheck as QuizIcon,
  Folder as CategoryIcon,
  Users as UsersIcon,
  CreditCard as SubscriptionIcon,
  ArrowRight,
  RefreshCw,
  Folder,
  BookCheckIcon,
  FileTextIcon,
} from '@lucide/svelte'
import AdminStats from '$lib/components/admin-stats.svelte'

// Loading state
let isLoading = $state(true)

// Simulate loading
setTimeout(() => {
  isLoading = false
}, 1000)

// Recent activity data
const recentActivity = [
  { id: 1, type: 'video', title: 'New video uploaded', time: '2 minutes ago', user: 'John Doe' },
  { id: 2, type: 'quiz', title: 'Quiz completed', time: '10 minutes ago', user: 'Jane Smith' },
  { id: 3, type: 'note', title: 'New note created', time: '1 hour ago', user: 'Alex Johnson' },
  { id: 4, type: 'user', title: 'New user registered', time: '2 hours ago', user: 'New User' },
]

// Quick stats
const stats = [
  { name: 'Total Videos', value: '124', icon: VideoIcon, change: '+12%', changeType: 'positive' },
  { name: 'Total Notes', value: '89', icon: NotesIcon, change: '+5%', changeType: 'positive' },
  { name: 'Total Quizzes', value: '56', icon: QuizIcon, change: '+8%', changeType: 'positive' },
  { name: 'Active Users', value: '1,234', icon: UsersIcon, change: '+15%', changeType: 'positive' },
]

// Navigation items
const navItems = [
  { name: 'Videos', href: '/admin/videos', icon: VideoIcon, count: 12 },
  { name: 'Notes', href: '/admin/notes', icon: NotesIcon, count: 5 },
  { name: 'Quizzes', href: '/admin/quizzes', icon: QuizIcon, count: 8 },
  { name: 'Categories', href: '/admin/categories', icon: CategoryIcon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: SubscriptionIcon },
]

// Refresh data
function refreshData() {
  isLoading = true
  setTimeout(() => {
    isLoading = false
  }, 1000)
}
</script>

<svelte:head>
  <title>Admin Dashboard | Content Management</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground">
        Overview of your platform's performance and content
      </p>
    </div>
    <div class="flex items-center space-x-2">
      <Button variant="outline" size="sm" class="gap-2" onclick={refreshData}>
        <RefreshCw class="h-4 w-4" />
        Refresh
      </Button>
    </div>
  </div>

  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {#each stats as stat}
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">{stat.name}</p>
              <p class="text-2xl font-bold">
                {isLoading ? 'Loading' : stat.value}
              </p>
              <p class="text-xs text-muted-foreground mt-1">
                {#if !isLoading}
                  <span class={stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}>
                    {stat.change} from last month
                  </span>
                {/if}
              </p>
            </div>
            <div class="rounded-lg p-3 bg-primary/10">
              <svelte:component this={stat.icon} class="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    {/each}
  </div>

  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
    <Card class="lg:col-span-2">
      <CardHeader>
        <CardTitle>Quick Links</CardTitle>
        <CardDescription>Quick access to important sections</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          {#each navItems as item}
            <a
              href={item.href}
              class="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
            >
              <div class="flex items-center space-x-3">
                <div class="rounded-lg bg-primary/10 p-2">
                  <svelte:component this={item.icon} class="h-5 w-5 text-primary" />
                </div>
                <span class="font-medium">{item.name}</span>
              </div>
              <div class="flex items-center">
                {#if item.count}
                  <Badge variant="secondary" class="mr-2">
                    {item.count}
                  </Badge>
                {/if}
                <ArrowRight class="h-4 w-4 text-muted-foreground" />
              </div>
            </a>
          {/each}
        </div>
      </CardContent>
    </Card>

    <Card class="lg:col-span-5">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions on your platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          {#if isLoading}
            {#each { length: 4 }}
              <div class="flex items-center space-x-4">
                <Skeleton class="h-10 w-10 rounded-full" />
                <div class="space-y-1">
                  <Skeleton class="h-4 w-[200px]" />
                  <Skeleton class="h-3 w-[150px]" />
                </div>
              </div>
            {/each}
          {:else}
            {#each recentActivity as activity}
              <div class="flex items-center space-x-4">
                <div class="rounded-full bg-primary/10 p-2">
                  <svelte:component
                    this={activity.type === 'video' ? VideoIcon : 
                          activity.type === 'quiz' ? QuizIcon : 
                          activity.type === 'note' ? NotesIcon : UsersIcon}
                    class="h-5 w-5 text-primary"
                  />
                </div>
                <div class="flex-1">
                  <p class="text-sm font-medium">{activity.title}</p>
                  <p class="text-xs text-muted-foreground">
                    {activity.user} • {activity.time}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </div>
            {/each}
          {/if}
        </div>
      </CardContent>
    </Card>
  </div>

  <Card>
    <CardHeader>
      <CardTitle>Platform Statistics</CardTitle>
      <CardDescription>Overview of your platform's performance</CardDescription>
    </CardHeader>
    <CardContent>
      <AdminStats />
    </CardContent>
  </Card>

  <div class="flex items-center gap-2">
    <Button variant="outline" size="sm" class="gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export
        </Button>
      </div>
    </div>
    
    <!-- Stats and Charts -->
    <AdminStats />
    
    <!-- Quick Links -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card class="hover:border-primary/50 transition-colors">
        <a href="/admin/notes" class="block p-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold">Notes</h3>
              <p class="text-sm text-muted-foreground">Manage study materials</p>
            </div>
            <FileTextIcon class="h-6 w-6 text-primary" />
          </div>
        </a>
      </Card>
      
      <Card class="hover:border-primary/50 transition-colors">
        <a href="/admin/videos" class="block p-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold">Videos</h3>
              <p class="text-sm text-muted-foreground">Manage video lessons</p>
            </div>
            <VideoIcon class="h-6 w-6 text-primary" />
          </div>
        </a>
      </Card>
      
      <Card class="hover:border-primary/50 transition-colors">
        <a href="/admin/quizzes" class="block p-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold">Quizzes</h3>
              <p class="text-sm text-muted-foreground">Manage assessments</p>
            </div>
            <BookCheckIcon class="h-6 w-6 text-primary" />
          </div>
        </a>
      </Card>
      
      <Card class="hover:border-primary/50 transition-colors">
        <a href="/admin/categories" class="block p-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold">Categories</h3>
              <p class="text-sm text-muted-foreground">Organize content</p>
            </div>
            <Folder class="h-6 w-6 text-primary" />
          </div>
        </a>
      </Card>
    </div>

    <!-- Category Management -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Category Hierarchy</CardTitle>
          <CardDescription>
            Organize content with hierarchical categories: Root → School Boards → CBSE → Class → Subject → Topic
          </CardDescription>
        </div>
        <a href="/admin/categories">
          <Button>
            <Folder class="mr-2 h-4 w-4" />
            Manage Categories
          </Button>
        </a>
      </CardHeader>
      <CardContent>
        <div class="rounded-md border">
          <ul class="divide-y">
            <li class="flex items-center p-3 hover:bg-accent/50 transition-colors">
              <Folder class="mr-2 h-4 w-4 text-muted-foreground" />
              <span class="text-sm font-medium">Root</span>
            </li>
            <li class="flex items-center p-3 pl-8 hover:bg-accent/50 transition-colors">
              <Folder class="mr-2 h-4 w-4 text-muted-foreground" />
              <span class="text-sm font-medium">School Boards</span>
            </li>
            <li class="flex items-center p-3 pl-16 hover:bg-accent/50 transition-colors">
              <Folder class="mr-2 h-4 w-4 text-muted-foreground" />
              <span class="text-sm">CBSE</span>
            </li>
            <li class="flex items-center p-3 pl-24 hover:bg-accent/50 transition-colors">
              <Folder class="mr-2 h-4 w-4 text-muted-foreground" />
              <span class="text-sm">Class 10</span>
            </li>
            <li class="flex items-center p-3 pl-32 hover:bg-accent/50 transition-colors">
              <Folder class="mr-2 h-4 w-4 text-muted-foreground" />
              <span class="text-sm">Mathematics</span>
            </li>
            <li class="flex items-center p-3 pl-40 hover:bg-accent/50 transition-colors">
              <Folder class="mr-2 h-4 w-4 text-muted-foreground" />
              <span class="text-sm">Algebra</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
<style>
  .pl-18 {
    padding-left: 4.5rem;
  }
  .pl-24 {
    padding-left: 6rem;
  }
  .pl-30 {
    padding-left: 7.5rem;
  }
  
  /* Smooth transitions for interactive elements */
  button, a, .transition-colors {
    transition: all 0.2s ease-in-out;
  }
  
  /* Custom scrollbar for better UX */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #666;
  }
  
  .dark ::-webkit-scrollbar-track {
    background: #2d3748;
  }
  
  .dark ::-webkit-scrollbar-thumb {
    background: #4a5568;
  }
  
  .dark ::-webkit-scrollbar-thumb:hover {
    background: #718096;
  }
</style>

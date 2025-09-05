<script lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { Button } from '$lib/components/ui/button'
import { Badge } from '$lib/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs'
import { CheckCircle, XCircle, Clock, Users, ChefHat, FileText } from '@lucide/svelte'
import { onMount } from 'svelte'

let applications = $state<any[]>([])
let isLoading = $state(true)

// Mock data for demonstration
const mockApplications = [
  {
    id: '1',
    fullName: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+91 9876543210',
    experience: '5 years',
    specializations: ['North Indian', 'South Indian'],
    address: '123 Main St, Bangalore',
    status: 'pending',
    createdAt: '2024-01-15T10:00:00Z',
    documents: {
      businessLicense: '/api/placeholder/300/200',
      foodSafetyCertificate: '/api/placeholder/300/200',
      idProof: '/api/placeholder/300/200',
    },
  },
  {
    id: '2',
    fullName: 'Maria Rossi',
    email: 'maria@example.com',
    phone: '+91 9876543211',
    experience: '3 years',
    specializations: ['Italian', 'Desserts'],
    address: '456 Oak Ave, Bangalore',
    status: 'pending',
    createdAt: '2024-01-16T14:30:00Z',
    documents: {
      businessLicense: '/api/placeholder/300/200',
      foodSafetyCertificate: null,
      idProof: '/api/placeholder/300/200',
    },
  },
]

onMount(() => {
  // Simulate loading applications
  setTimeout(() => {
    applications = mockApplications
    isLoading = false
  }, 1000)
})

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function approveApplication(id: string) {
  applications = applications.map((app) => (app.id === id ? { ...app, status: 'approved' } : app))
}

function rejectApplication(id: string) {
  applications = applications.map((app) => (app.id === id ? { ...app, status: 'rejected' } : app))
}
</script>

<svelte:head>
  <title>Admin Dashboard - HomeFood</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div class="container mx-auto px-4 py-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
      <p class="text-gray-600 dark:text-gray-400">Manage chef applications and system settings</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center">
            <Users class="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <div class="text-2xl font-bold">{applications.filter(a => a.status === 'pending').length}</div>
              <p class="text-xs text-muted-foreground">Pending Applications</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center">
            <CheckCircle class="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div class="text-2xl font-bold">{applications.filter(a => a.status === 'approved').length}</div>
              <p class="text-xs text-muted-foreground">Approved Chefs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center">
            <XCircle class="w-8 h-8 text-red-600 mr-3" />
            <div>
              <div class="text-2xl font-bold">{applications.filter(a => a.status === 'rejected').length}</div>
              <p class="text-xs text-muted-foreground">Rejected Applications</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center">
            <ChefHat class="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <div class="text-2xl font-bold">{applications.length}</div>
              <p class="text-xs text-muted-foreground">Total Applications</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Applications Management -->
    <Tabs value="applications" class="w-full">
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="applications">Chef Applications</TabsTrigger>
        <TabsTrigger value="chefs">Active Chefs</TabsTrigger>
        <TabsTrigger value="settings">System Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="applications" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Chef Applications</h2>
          <Badge variant="secondary">
            {applications.filter(a => a.status === 'pending').length} pending
          </Badge>
        </div>

        {#if isLoading}
          <div class="flex items-center justify-center py-12">
            <div class="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span class="ml-2 text-gray-600 dark:text-gray-400">Loading applications...</span>
          </div>
        {:else if applications.length === 0}
          <div class="text-center py-12">
            <FileText class="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No applications found</h3>
            <p class="text-gray-500 dark:text-gray-400">New chef applications will appear here.</p>
          </div>
        {:else}
          <div class="space-y-4">
            {#each applications as application}
              <Card>
                <CardHeader>
                  <div class="flex items-center justify-between">
                    <div>
                      <CardTitle class="text-lg">{application.fullName}</CardTitle>
                      <CardDescription>{application.email} • {application.phone}</CardDescription>
                    </div>
                    <div class="text-right">
                      <Badge class={getStatusColor(application.status)}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Badge>
                      <p class="text-xs text-gray-500 mt-1">
                        {new Date(application.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent class="space-y-4">
                  <!-- Application Details -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2">Experience</h4>
                      <p class="text-sm text-gray-600 dark:text-gray-400">{application.experience}</p>
                    </div>
                    <div>
                      <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2">Specializations</h4>
                      <div class="flex flex-wrap gap-1">
                        {#each application.specializations as spec}
                          <Badge variant="outline" class="text-xs">{spec}</Badge>
                        {/each}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2">Address</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">{application.address}</p>
                  </div>

                  <!-- Documents -->
                  <div>
                    <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2">Documents</h4>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {#if application.documents.businessLicense}
                        <div class="flex items-center gap-2 text-sm">
                          <FileText class="w-4 h-4 text-green-600" />
                          <span>Business License</span>
                        </div>
                      {/if}
                      {#if application.documents.foodSafetyCertificate}
                        <div class="flex items-center gap-2 text-sm">
                          <FileText class="w-4 h-4 text-green-600" />
                          <span>Food Safety Cert</span>
                        </div>
                      {:else}
                        <div class="flex items-center gap-2 text-sm text-gray-400">
                          <FileText class="w-4 h-4" />
                          <span>Food Safety Cert (Missing)</span>
                        </div>
                      {/if}
                      {#if application.documents.idProof}
                        <div class="flex items-center gap-2 text-sm">
                          <FileText class="w-4 h-4 text-green-600" />
                          <span>ID Proof</span>
                        </div>
                      {/if}
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  {#if application.status === 'pending'}
                    <div class="flex space-x-2 pt-4 border-t">
                      <Button
                        onclick={() => approveApplication(application.id)}
                        class="bg-green-500 hover:bg-green-600 text-white flex-1"
                      >
                        <CheckCircle class="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onclick={() => rejectApplication(application.id)}
                        variant="outline"
                        class="border-red-300 text-red-600 hover:bg-red-50 flex-1"
                      >
                        <XCircle class="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  {:else}
                    <div class="pt-4 border-t">
                      <Badge class="{getStatusColor(application.status)} w-full justify-center py-2">
                        {application.status === 'approved' ? 'Approved' : 'Rejected'}
                      </Badge>
                    </div>
                  {/if}
                </CardContent>
              </Card>
            {/each}
          </div>
        {/if}
      </TabsContent>

      <TabsContent value="chefs" class="space-y-4">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Active Chefs</h2>
        <div class="text-center py-12">
          <ChefHat class="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Active Chefs Management</h3>
          <p class="text-gray-500 dark:text-gray-400">View and manage approved chefs here.</p>
        </div>
      </TabsContent>

      <TabsContent value="settings" class="space-y-4">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">System Settings</h2>
        <div class="text-center py-12">
          <Clock class="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">System Configuration</h3>
          <p class="text-gray-500 dark:text-gray-400">Configure system settings and preferences.</p>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</div>
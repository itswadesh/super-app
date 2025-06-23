<script lang="ts">
import { onMount } from 'svelte'
// import AdminChart from './admin-charts.svelte'
import type { ChartOptions } from 'chart.js'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  Activity,
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  FileTextIcon,
  VideoIcon,
  BookCheckIcon,
} from '@lucide/svelte'

// Stats data
let stats = $state({
  totalUsers: 0,
  activeUsers: 0,
  totalContent: 0,
  avgSessionTime: '0m',
})

// Chart data
let userGrowthData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'New Users',
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: 'rgba(99, 102, 241, 0.8)',
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 1,
    },
  ],
}

let userGrowthOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
    },
  },
}

let contentDistributionData = {
  labels: ['Videos', 'Notes', 'Quizzes'],
  datasets: [
    {
      data: [45, 30, 25],
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(139, 92, 246, 0.8)',
      ],
      borderColor: ['rgba(99, 102, 241, 1)', 'rgba(59, 130, 246, 1)', 'rgba(139, 92, 246, 1)'],
      borderWidth: 1,
    },
  ],
}

let contentDistributionOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
    },
  },
  scales: {
    x: {
      display: false,
    },
    y: {
      display: false,
    },
  },
}

let engagementData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Page Views',
      data: [65, 59, 80, 81, 56, 55, 40],
      borderColor: 'rgba(99, 102, 241, 1)',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      borderWidth: 1,
      tension: 0.3,
      fill: true,
    },
  ],
}

let engagementOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
    },
  },
}

// Simulate loading data
onMount(async () => {
  // In a real app, you would fetch this data from your API
  await new Promise((resolve) => setTimeout(resolve, 500))

  stats = {
    totalUsers: 1242,
    activeUsers: 342,
    totalContent: 876,
    avgSessionTime: '12m 34s',
  }
})
</script>

<div class="grid gap-6">
  <!-- Stats Grid -->
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">
          Total Users
        </CardTitle>
        <Users class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
        <p class="text-xs text-muted-foreground">
          +12.3% from last month
        </p>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Active Users</CardTitle>
        <Activity class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{stats.activeUsers}</div>
        <p class="text-xs text-muted-foreground">
          +19% from last week
        </p>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Total Content</CardTitle>
        <BookOpen class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{stats.totalContent}</div>
        <p class="text-xs text-muted-foreground">
          +5 new this week
        </p>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Avg. Session</CardTitle>
        <Clock class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{stats.avgSessionTime}</div>
        <p class="text-xs text-muted-foreground">
          +2.1% from last month
        </p>
      </CardContent>
    </Card>
  </div>
  
  <!-- Main Charts -->
  <div class="grid gap-6 md:grid-cols-2">
    <Card class="p-6">
      <h3 class="text-lg font-semibold mb-4">User Growth</h3>
      <div class="h-64">
        <!-- <AdminChart 
          type="bar"
          data={userGrowthData}
          options={userGrowthOptions}
        /> -->
      </div>
    </Card>
    
    <Card class="p-6">
      <h3 class="text-lg font-semibold mb-4">Content Distribution</h3>
      <div class="h-64">
        <!-- <AdminChart 
          type="pie"
          data={contentDistributionData}
          options={contentDistributionOptions}
        /> -->
      </div>
    </Card>
  </div>
  
  <!-- Full Width Chart -->
  <Card class="p-6">
    <h3 class="text-lg font-semibold mb-4">Weekly Engagement</h3>
    <div class="h-80">
      <!-- <AdminChart 
        type="line"
        data={engagementData}
        options={engagementOptions}
      /> -->
    </div>
  </Card>
  
  <!-- Content Type Stats -->
  <div class="grid gap-6 md:grid-cols-3">
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Videos</h3>
        <VideoIcon class="h-5 w-5 text-primary" />
      </div>
      <div class="flex items-center justify-between">
        <div>
          <div class="text-2xl font-bold">245</div>
          <p class="text-sm text-muted-foreground">+12% from last month</p>
        </div>
        <div class="h-16 w-16">
          <div class="relative h-16 w-16">
            <!-- <AdminChart 
              type="doughnut"
              data={{
                labels: ['', ''],
                datasets: [{
                  data: [75, 25],
                  backgroundColor: ['rgba(99, 102, 241, 0.8)', 'rgba(99, 102, 241, 0.1)'],
                  borderWidth: 0,
                }]
              }}
              options={{
                cutout: '70%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }}
            /> -->
          </div>
        </div>
      </div>
    </Card>
    
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Notes</h3>
        <FileTextIcon class="h-5 w-5 text-primary" />
      </div>
      <div class="flex items-center justify-between">
        <div>
          <div class="text-2xl font-bold">189</div>
          <p class="text-sm text-muted-foreground">+8% from last month</p>
        </div>
        <div class="h-16 w-16">
          <div class="relative h-16 w-16">
            <!-- <AdminChart 
              type="doughnut"
              data={{
                labels: ['', ''],
                datasets: [{
                  data: [60, 40],
                  backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(59, 130, 246, 0.1)'],
                  borderWidth: 0,
                }]
              }}
              options={{
                cutout: '70%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }}
            /> -->
          </div>
        </div>
      </div>
    </Card>
    
    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Quizzes</h3>
        <BookCheckIcon class="h-5 w-5 text-primary" />
      </div>
      <div class="flex items-center justify-between">
        <div>
          <div class="text-2xl font-bold">87</div>
          <p class="text-sm text-muted-foreground">+15% from last month</p>
        </div>
        <div class="h-16 w-16">
          <div class="relative h-16 w-16">
            <!-- <AdminChart 
              type="doughnut"
              data={{
                labels: ['', ''],
                datasets: [{
                  data: [85, 15],
                  backgroundColor: ['rgba(139, 92, 246, 0.8)', 'rgba(139, 92, 246, 0.1)'],
                  borderWidth: 0,
                }]
              }}
              options={{
                cutout: '70%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }}
            /> -->
          </div>
        </div>
      </div>
    </Card>
  </div>
</div>

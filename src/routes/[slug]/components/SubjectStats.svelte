<script lang="ts">
const { stats } = $props<{
  stats: {
    videosCount?: number
    notesCount?: number
    quizzesCount?: number
  }
}>()
</script>

<div class="bg-white rounded-xl shadow-sm p-6 mb-8">
  <div class="flex flex-wrap justify-around">
    <div class="stats text-center px-4 py-2">
      <div class="text-3xl font-bold text-blue-600">
        {stats?.videosCount || 0}
      </div>
      <div class="text-sm text-gray-600">Videos</div>
    </div>
    
    <div class="stats text-center px-4 py-2">
      <div class="text-3xl font-bold text-blue-600">
        {stats?.notesCount || 0}
      </div>
      <div class="text-sm text-gray-600">Notes</div>
    </div>
    
    <div class="stats text-center px-4 py-2">
      <div class="text-3xl font-bold text-blue-600">
        {stats?.quizzesCount || 0}
      </div>
      <div class="text-sm text-gray-600">Quizzes</div>
    </div>
  </div>
</div>

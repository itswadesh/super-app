<script lang="ts">
import Modal from '$lib/components/Modal.svelte'
import { contentService } from '$lib/services/content-service'
import { toast } from 'svelte-sonner'

// Props
const {
  quizId,
  quizTitle,
  onClose,
  onSave,
  initialQuestions = [],
} = $props<{
  quizId: string
  quizTitle: string
  onClose: () => void
  onSave: (questions: any[]) => void
  initialQuestions?: any[]
}>()

// State
let loading = $state(false)
let questions = $state<any[]>([...initialQuestions])
let isUnsavedChanges = $state(false)
let currentQuestion = $state({
  id: '',
  question: '',
  answers: ['', '', '', ''],
  correctAnswerIndex: 0,
  explanation: '',
  rank: 0,
})
let currentQuestionIndex = $state(-1)
let isEditingQuestion = $state(false)

// Load questions for this quiz
function loadQuestions() {
  const fetchData = async () => {
    try {
      loading = true
      // Use contentService to get quiz questions
      const response = await contentService.getQuizQuestions(quizId)
      const data = await response.json()
      if (data.success) {
        questions = data.questions || []
      } else {
        toast.error('Failed to load quiz questions')
      }
    } catch (error) {
      console.error('Error loading questions:', error)
      toast.error('An error occurred while loading questions')
    } finally {
      loading = false
    }
  }
  fetchData()
}

$effect(() => {
  loadQuestions()
})

// Add/edit a question
function addEditQuestion() {
  if (!currentQuestion.question.trim()) {
    toast.error('Question text is required')
    return
  }

  if (currentQuestion.answers.some((a: string) => !a.trim())) {
    toast.error('All answer options must be filled')
    return
  }

  if (isEditingQuestion) {
    // Update existing question
    questions = questions.map((q: any, index: number) =>
      index === currentQuestionIndex ? { ...currentQuestion } : q
    )
    toast.success('Question updated')
  } else {
    // Add new question
    questions = [
      ...questions,
      {
        ...currentQuestion,
        id: `temp-${Date.now()}`,
        rank: questions.length,
      },
    ]
    toast.success('Question added')
  }

  // Reset form
  resetQuestionForm()
  isUnsavedChanges = true
}

// Add placeholder answers
function addPlaceholderAnswers() {
  if (currentQuestion.answers.every((a) => !a)) {
    currentQuestion.answers = ['True', 'False', 'Maybe', 'Not enough information']
    toast.info('Added placeholder options')
  } else {
    toast.info('Answer fields already have content')
  }
}

// Edit existing question
function editQuestion(index: number) {
  currentQuestion = { ...questions[index] }
  currentQuestionIndex = index
  isEditingQuestion = true
}

// Delete question
function deleteQuestion(index: number) {
  if (confirm('Are you sure you want to delete this question?')) {
    questions = questions.filter((_: any, i: number) => i !== index)
    toast.success('Question deleted')
    isUnsavedChanges = true
  }
}

// Reset question form
function resetQuestionForm() {
  currentQuestion = {
    id: '',
    question: '',
    answers: ['', '', '', ''],
    correctAnswerIndex: 0,
    explanation: '',
    rank: 0,
  }
  isEditingQuestion = false
  currentQuestionIndex = -1
}

// Move question up or down
function moveQuestion(index: number, direction: 'up' | 'down') {
  if (
    (direction === 'up' && index === 0) ||
    (direction === 'down' && index === questions.length - 1)
  ) {
    return
  }

  const newQuestions = [...questions]
  const newIndex = direction === 'up' ? index - 1 : index + 1

  // Swap positions
  ;[newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]]

  // Update ranks
  newQuestions.forEach((q: any, i: number) => (q.rank = i))

  questions = newQuestions
  isUnsavedChanges = true
}

// Save questions
function save() {
  const saveData = async () => {
    try {
      const toastId = toast.loading('Saving questions...')

      // Use contentService to save quiz questions
      const response = await contentService.saveQuizQuestions(quizId, questions)
      const data = await response.json()

      if (data.success) {
        toast.success('Questions saved successfully')
        isUnsavedChanges = false
        onSave(questions)
      } else {
        toast.error('Failed to save questions')
      }

      toast.dismiss(toastId)
    } catch (error) {
      console.error('Error saving questions:', error)
      toast.error('An error occurred while saving questions')
    }
  }
  saveData()
}
</script>

<Modal
  open={true}
  title={`Manage Questions: ${quizTitle}`}
  size="xl"
  onClose={onClose}
>
  <div class="space-y-6">
    <!-- Questions List -->
    <div class="bg-gray-50 p-4 rounded-lg">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900">Quiz Questions ({questions.length})</h3>
        {#if isUnsavedChanges}
          <span class="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            Unsaved changes
          </span>
        {/if}
      </div>
      
      {#if loading}
        <div class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      {:else if questions.length === 0}
        <div class="text-center py-8 bg-gray-100 rounded-lg">
          <p class="text-gray-500">No questions added yet.</p>
          <p class="text-gray-500 text-sm mt-1">Use the form below to add your first question.</p>
        </div>
      {:else}
        <div class="divide-y divide-gray-200">
          {#each questions as question, index}
            <div class="py-4 {index === 0 ? '' : 'border-t border-gray-100'}">
              <div class="flex justify-between">
                <h4 class="font-medium text-gray-800 flex items-center gap-2">
                  <span class="flex items-center justify-center bg-blue-100 text-blue-800 h-6 w-6 rounded-full text-xs font-bold">
                    {index + 1}
                  </span>
                  <span>{question.question}</span>
                </h4>
                <div class="flex space-x-2 items-center">
                  <button 
                    onclick={() => moveQuestion(index, 'up')}
                    disabled={index === 0}
                    class="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:hover:text-gray-500 p-1"
                    aria-label="Move question up"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m18 15-6-6-6 6"/>
                    </svg>
                  </button>
                  <button 
                    onclick={(e) => moveQuestion(index, 'down')}
                    disabled={index === questions.length - 1}
                    class="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:hover:text-gray-500 p-1"
                    aria-label="Move question down"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>
                  <button 
                    onclick={(e) => editQuestion(index)}
                    class="text-blue-600 hover:text-blue-800 p-1"
                    aria-label="Edit question"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg>
                  </button>
                  <button 
                    onclick={(e) => deleteQuestion(index)}
                    class="text-red-600 hover:text-red-800 p-1"
                    aria-label="Delete question"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div class="mt-2 grid grid-cols-2 gap-2">
                {#each question.answers as answer, answerIndex}
                  <div class="border border-gray-200 rounded-md p-2 {answerIndex === question.correctAnswerIndex ? 'bg-green-50 border-green-200' : 'bg-white'}">
                    <div class="flex items-start">
                      <span class="inline-flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 text-xs font-medium text-gray-800 mr-2">
                        {['A', 'B', 'C', 'D'][answerIndex]}
                      </span>
                      <span class="{answerIndex === question.correctAnswerIndex ? 'font-medium text-green-700' : 'text-gray-700'}">
                        {answer}
                      </span>
                      {#if answerIndex === question.correctAnswerIndex}
                        <span class="ml-auto inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Correct
                        </span>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
              
              {#if question.explanation}
                <div class="mt-2 text-sm bg-blue-50 border border-blue-100 rounded-md p-2 text-blue-700">
                  <strong>Explanation:</strong> {question.explanation}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
    
    <!-- Question Form -->
    <div class="bg-white p-4 rounded-lg border border-gray-200">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        {isEditingQuestion ? 'Edit Question' : 'Add New Question'}
      </h3>
      
      <form onsubmit={(e) => { e.preventDefault(); addEditQuestion(); }} class="space-y-4">
        <!-- Question Text -->
        <div>
          <label for="question" class="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
          <textarea 
            id="question" 
            bind:value={currentQuestion.question}
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
            placeholder="Type your question here..."
            required
          ></textarea>
        </div>
        
        <!-- Answer Options -->
        <div>
          <div class="flex justify-between items-center mb-1">
            <label for="answer-options" class="block text-sm font-medium text-gray-700">Answer Options</label>
            <button 
              type="button"
              class="text-sm text-blue-600 hover:text-blue-800"
              onclick={(e) => addPlaceholderAnswers()}
            >
              Add placeholder options
            </button>
          </div>
          <div id="answer-options">
            <div class="space-y-2">
              {#each currentQuestion.answers as _, answerIndex}
                <div class="flex items-center space-x-2">
                  <div class="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-xs font-medium text-gray-800">
                    {['A', 'B', 'C', 'D'][answerIndex]}
                  </div>
                  <input 
                    type="radio" 
                    id={`answer-${answerIndex}`}
                    name="correctAnswer"
                    checked={currentQuestion.correctAnswerIndex === answerIndex}
                    onclick={() => currentQuestion.correctAnswerIndex = answerIndex}
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  >
                  <input 
                    type="text" 
                    placeholder={`Answer option ${answerIndex + 1}`}
                    bind:value={currentQuestion.answers[answerIndex]}
                    class="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                </div>
              {/each}
            </div>
          </div>
          <p class="mt-1 text-sm text-gray-500">Select the radio button next to the correct answer.</p>
        </div>
        
        <!-- Explanation -->
        <div>
          <label for="explanation" class="block text-sm font-medium text-gray-700 mb-1">Explanation (Optional)</label>
          <textarea 
            id="explanation" 
            bind:value={currentQuestion.explanation}
            placeholder="Explain why the correct answer is right"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
          ></textarea>
        </div>
        
        <!-- Form Actions -->
        <div class="flex space-x-2 pt-2">
          <button 
            type="submit"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isEditingQuestion ? 'Update Question' : 'Add Question'}
          </button>
          
          {#if isEditingQuestion}
            <button 
              type="button"
              onclick={(e) => resetQuestionForm()}
              class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          {/if}
        </div>
      </form>
    </div>
    
    <!-- Save/Cancel Buttons -->
    <div class="flex justify-between space-x-2 mt-4 border-t border-gray-200 pt-4">
      <div>
        <span class="text-sm text-gray-500">Total: <span class="font-medium">{questions.length}</span> questions</span>
      </div>
      <div class="flex space-x-2">
        <button
          type="button"
          onclick={(e) => onClose()}
          class="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={(e) => save()}
          disabled={questions.length === 0}
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          Save Questions
        </button>
      </div>
    </div>
  </div>
</Modal>

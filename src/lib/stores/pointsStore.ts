import { writable } from 'svelte/store'
import { userStore } from './userStore'

type UserGoal = {
  id: string
  title: string
  description: string
  points: number
  isCompleted: boolean
  category: 'daily' | 'weekly' | 'achievement' | 'special'
  icon: string // SVG icon name or path
  progress?: number // Optional current progress toward target
  target?: number // Optional target value to complete the goal
}

type LevelReward = {
  level: number
  description: string
  subscriptionMonths: number
  icon: string
}

type PointsStore = {
  totalPoints: number
  level: number
  goals: UserGoal[]
  levelRewards: LevelReward[]
  isLoading: boolean
}

// Helper function to get level rewards
function getLevelRewards(): LevelReward[] {
  return [
    {
      level: 1,
      description: "Congratulations! You've earned 1 month of free subscription!",
      subscriptionMonths: 1,
      icon: 'gift',
    },
    {
      level: 2,
      description: "Amazing progress! You've earned 3 months of free subscription!",
      subscriptionMonths: 3,
      icon: 'gift',
    },
    {
      level: 3,
      description: "Exceptional work! You've earned 6 months of free subscription!",
      subscriptionMonths: 6,
      icon: 'gift',
    },
  ]
}

// Helper function to get special action opportunities
function getSpecialActions(): UserGoal[] {
  return [
    {
      id: 'share-social',
      title: 'Share on Social',
      description: 'Share your progress on social media',
      points: 100,
      isCompleted: false,
      category: 'special',
      icon: 'share',
    },
    {
      id: 'upload-avatar',
      title: 'Upload Avatar',
      description: 'Personalize your profile with a custom avatar',
      points: 50,
      isCompleted: false,
      category: 'special',
      icon: 'user',
    },
  ]
}

function createPointsStore() {
  // Initialize store with default values
  const initialState: PointsStore = {
    totalPoints: 0,
    level: 1,
    goals: [
      // Weekly goals
      {
        id: 'complete-quizzes',
        title: 'Complete 5 Quizzes',
        description: 'Complete 5 quizzes this week',
        points: 50,
        isCompleted: false,
        progress: 0,
        target: 5,
        category: 'weekly',
        icon: 'quiz',
      },
      {
        id: 'read-notes',
        title: 'Read 10 Notes',
        description: 'Read 10 notes this week',
        points: 30,
        isCompleted: false,
        progress: 0,
        target: 10,
        category: 'weekly',
        icon: 'document',
      },
      {
        id: 'watch-videos',
        title: 'Watch 20 Videos',
        description: 'Watch 20 videos this week',
        points: 40,
        isCompleted: false,
        progress: 0,
        target: 20,
        category: 'weekly',
        icon: 'video',
      },
      // Special actions
      ...getSpecialActions(),
    ],
    levelRewards: getLevelRewards(),
    isLoading: false,
  }

  const { subscribe, set, update } = writable<PointsStore>(initialState)

  // Helper function to handle level ups and rewards
  const handleLevelUp = (currentLevel: number, newLevel: number) => {
    if (newLevel <= currentLevel) return

    // Process each level gained
    for (let level = currentLevel + 1; level <= newLevel; level++) {
      try {
        // Get the reward for this level
        const reward = getLevelRewards().find((r) => r.level === level)

        // Notify the user about the level up
        import('$lib/utils/toast').then(({ toast }) => {
          toast.success(`Congratulations! You've reached Level ${level}!`)

          if (reward) {
            toast.success(
              `You've been granted ${reward.subscriptionMonths} month${reward.subscriptionMonths > 1 ? 's' : ''} of free subscription!`
            )
          }
        })

        // In a real app, apply the subscription reward
        if (reward) {
          fetch('/api/user/apply-level-reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ level, months: reward.subscriptionMonths }),
          }).catch((error) => {
            console.error('Error applying level reward:', error)
          })
        }
      } catch (error) {
        console.error('Error handling level up:', error)
      }
    }
  }

  return {
    subscribe,
    loadUserPoints: async () => {
      let user
      userStore.subscribe((state) => (user = state.user))()

      if (!user) return

      update((state) => ({ ...state, isLoading: true }))

      try {
        // In a real implementation, fetch from API
        const response = await fetch('/api/user/points')

        if (response.ok) {
          const data = await response.json()
          update((state) => ({
            ...state,
            totalPoints: data.totalPoints || 0,
            level: data.level || 1,
            goals: data.goals || [],
            isLoading: false,
          }))
        } else {
          throw new Error('Failed to fetch user points')
        }
      } catch (error) {
        console.error('Error loading user points:', error)
        // If API fails, load some demo goals
        update((state) => ({
          ...state,
          totalPoints: 120,
          level: 2,
          goals: getDemoGoals(),
          isLoading: false,
        }))
      }
    },

    /**
     * Complete a goal and add points
     */
    completeGoal: async (goalId: string) => {
      let currentPointsValue = 0
      let currentLevelValue = 1

      // Get current points and level before update
      update((state) => {
        currentPointsValue = state.totalPoints
        currentLevelValue = state.level
        return state
      })

      update((state) => {
        const updatedGoals = state.goals.map((goal) => {
          if (goal.id === goalId && !goal.isCompleted) {
            return { ...goal, isCompleted: true }
          }
          return goal
        })

        // Find the completed goal to add its points
        const completedGoal = state.goals.find((g) => g.id === goalId && !g.isCompleted)
        const pointsToAdd = completedGoal ? completedGoal.points : 0
        const newTotalPoints = state.totalPoints + pointsToAdd

        // Calculate new level
        const newLevel = Math.floor(newTotalPoints / 100) + 1

        // Handle level up if needed - using setTimeout to avoid circular references
        if (newLevel > state.level) {
          setTimeout(() => {
            handleLevelUp(state.level, newLevel)
          }, 0)
        }

        return {
          ...state,
          goals: updatedGoals,
          totalPoints: newTotalPoints,
          level: newLevel,
        }
      })

      // In a real app, this would be persisted to the backend
      try {
        await fetch('/api/user/points/complete-goal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ goalId }),
        })
      } catch (error) {
        console.error('Error updating goal status:', error)
        // We don't revert the UI state as this is just a demo
      }
    },

    /**
     * Complete a special action and add points
     */
    completeSpecialAction: async (actionId: string) => {
      let currentPointsValue = 0
      let currentLevelValue = 1

      // Get current points and level before update
      update((state) => {
        currentPointsValue = state.totalPoints
        currentLevelValue = state.level
        return state
      })

      update((state) => {
        const updatedGoals = state.goals.map((goal) => {
          if (goal.id === actionId && !goal.isCompleted) {
            return { ...goal, isCompleted: true }
          }
          return goal
        })

        // Find the completed special action to add its points
        const completedAction = state.goals.find((g) => g.id === actionId && !g.isCompleted)
        const pointsToAdd = completedAction ? completedAction.points : 0
        const newTotalPoints = state.totalPoints + pointsToAdd

        // Calculate new level
        const newLevel = Math.floor(newTotalPoints / 100) + 1

        // Handle level up if needed - using setTimeout to avoid circular references
        if (newLevel > state.level) {
          setTimeout(() => {
            handleLevelUp(state.level, newLevel)
          }, 0)
        }

        return {
          ...state,
          goals: updatedGoals,
          totalPoints: newTotalPoints,
          level: newLevel,
        }
      })

      // In a real app, this would be persisted to the backend
      try {
        await fetch('/api/user/points/complete-special-action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ actionId }),
        })
      } catch (error) {
        console.error('Error updating special action status:', error)
        // We don't revert the UI state as this is just a demo
      }
    },

    /**
     * Reset demo state
     */
    reset: () => {
      set(initialState)
    },
  }
}

// Helper to generate demo goals for testing
function getDemoGoals(): UserGoal[] {
  return [
    {
      id: 'weekly-quiz',
      title: 'Quiz Master',
      description: 'Complete 5 quizzes in a week',
      points: 50,
      isCompleted: false,
      category: 'weekly',
      icon: 'quiz',
      progress: 2, // Current progress (2/5 completed)
      target: 5, // Target to reach
    },
    {
      id: 'weekly-notes',
      title: 'Avid Reader',
      description: 'Read 10 notes/documents',
      points: 30,
      isCompleted: false,
      category: 'weekly',
      icon: 'document',
      progress: 3, // Current progress (3/10 completed)
      target: 10, // Target to reach
    },
    {
      id: 'weekly-videos',
      title: 'Video Enthusiast',
      description: 'Watch 20 educational videos',
      points: 40,
      isCompleted: false,
      category: 'weekly',
      icon: 'video',
      progress: 8, // Current progress (8/20 completed)
      target: 20, // Target to reach
    },
    {
      id: 'daily-login',
      title: 'Daily Login',
      description: 'Log in to the platform today',
      points: 10,
      isCompleted: true,
      category: 'daily',
      icon: 'login',
    },
    {
      id: 'achievement-streak',
      title: 'Study Streak',
      description: 'Log in for 7 consecutive days',
      points: 100,
      isCompleted: false,
      category: 'achievement',
      icon: 'calendar',
      progress: 3, // Current progress (3/7 days)
      target: 7, // Target to reach
    },
    {
      id: 'achievement-perfect',
      title: 'Perfect Score',
      description: 'Get 100% on any quiz',
      points: 75,
      isCompleted: false,
      category: 'achievement',
      icon: 'award',
    },
  ]
}

export const pointsStore = createPointsStore()

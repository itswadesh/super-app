import { error, json } from '@sveltejs/kit'

export const GET = async (c) => {
  const locals = c.get('locals')
  const user = locals.user

  // Check if user is authenticated
  if (!user) {
    throw error(401, 'You must be logged in to view your points')
  }

  try {
    // In a real implementation, you would fetch this from the database
    // For this example, we'll generate mock data
    const userPoints = {
      totalPoints: 120,
      level: 2,
      goals: [
        {
          id: 'daily-1',
          title: 'First Login',
          description: 'Log in to the platform for the first time',
          points: 10,
          isCompleted: true,
          category: 'daily',
          icon: 'login',
        },
        {
          id: 'daily-2',
          title: 'View a Video',
          description: 'Watch an educational video',
          points: 5,
          isCompleted: false,
          category: 'daily',
          icon: 'video',
        },
        {
          id: 'daily-3',
          title: 'Download PDF',
          description: 'Download a PDF resource',
          points: 5,
          isCompleted: false,
          category: 'daily',
          icon: 'pdf',
        },
        {
          id: 'weekly-1',
          title: 'Complete a Quiz',
          description: 'Take and complete any quiz',
          points: 15,
          isCompleted: false,
          category: 'weekly',
          icon: 'quiz',
        },
        {
          id: 'weekly-2',
          title: 'Perfect Score',
          description: 'Get 100% on any quiz',
          points: 25,
          isCompleted: false,
          category: 'weekly',
          icon: 'award',
        },
        {
          id: 'achievement-1',
          title: 'Study Streak',
          description: 'Log in for 7 consecutive days',
          points: 50,
          isCompleted: false,
          category: 'achievement',
          icon: 'calendar',
        },
      ],
    }

    return json({
      success: true,
      ...userPoints,
    })
  } catch (err) {
    console.error('Error fetching user points:', err)
    throw error(500, 'Failed to fetch user points')
  }
}

export const POST = async (c) => {
  const user = c.locals.user

  // Check if user is authenticated
  if (!user) {
    throw error(401, 'You must be logged in to update points')
  }

  try {
    const data = await c.req.json()
    const { goalId } = data

    if (!goalId) {
      throw error(400, 'Goal ID is required')
    }

    // In a real implementation, you would update this in the database
    // For this example, we'll just return success

    return json({
      success: true,
      message: 'Goal completed successfully',
    })
  } catch (err) {
    console.error('Error updating goal:', err)
    throw error(500, 'Failed to update goal')
  }
}

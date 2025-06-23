import { createId } from '@paralleldrive/cuid2'
import { eq } from 'drizzle-orm'
import { db } from '.'
import { categories, notes, quizAnswers, quizQuestions, quizzes, videos } from './schema'

// Helper function to create current timestamps
const now = () => new Date()

// Helper to create date with offset (days ago)
const daysAgo = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

// Clear existing data (for development purposes)
async function clearAllData() {
  try {
    console.log('Clearing existing data...')
    await db.delete(quizAnswers)
    await db.delete(quizQuestions)
    await db.delete(quizzes)
    await db.delete(videos)
    await db.delete(notes)
    await db.delete(categories)
    console.log('Existing data cleared.')
  } catch (error) {
    console.error('Error clearing data:', error)
  }
}

// Seed categories
async function seedCategories() {
  const categoryData = [
    {
      id: createId(),
      name: 'Computer Science',
      slug: 'computer-science',
      description: 'Topics in computer science, programming, and software development',
      count: 0,
    },
    {
      id: createId(),
      name: 'Mathematics',
      slug: 'mathematics',
      description: 'Topics in algebra, calculus, geometry, and other mathematical fields',
      count: 0,
    },
    {
      id: createId(),
      name: 'Physics',
      slug: 'physics',
      description:
        'Topics in classical mechanics, thermodynamics, electromagnetism, and modern physics',
      count: 0,
    },
    {
      id: createId(),
      name: 'Language Learning',
      slug: 'language-learning',
      description:
        'Resources for learning various languages including vocabulary, grammar, and pronunciation',
      count: 0,
    },
  ]

  console.log('Seeding categories...')

  try {
    const insertedCategories = await db.insert(categories).values(categoryData).returning()
    console.log(`${insertedCategories.length} categories inserted.`)
    return insertedCategories
  } catch (error) {
    console.error('Error seeding categories:', error)
    return []
  }
}

// Seed videos
async function seedVideos(seedCategories: any[]) {
  if (!seedCategories.length) return []

  const videoData = [
    {
      id: createId(),
      title: 'Introduction to JavaScript ES6 Features',
      slug: 'introduction-to-javascript-es6',
      description:
        'Learn about the modern features of JavaScript introduced in ES6, including arrow functions, destructuring, and template literals.',
      categoryId: seedCategories.find((c) => c.slug === 'computer-science')?.id,
      duration: '18:45',
      quality: '1080p',
      views: 1827,
      videoUrl: 'https://example.com/videos/javascript-es6-intro.mp4',
      thumbnailUrl: 'https://via.placeholder.com/640x360.png?text=JavaScript+ES6',
      createdAt: daysAgo(60), // 2 months ago
      updatedAt: daysAgo(21), // 3 weeks ago
    },
    {
      id: createId(),
      title: 'Advanced Calculus: Partial Derivatives',
      slug: 'advanced-calculus-partial-derivatives',
      description:
        'A comprehensive guide to understanding and working with partial derivatives in multivariable calculus.',
      categoryId: seedCategories.find((c) => c.slug === 'mathematics')?.id,
      duration: '24:30',
      quality: '1080p',
      views: 1456,
      videoUrl: 'https://example.com/videos/partial-derivatives.mp4',
      thumbnailUrl: 'https://via.placeholder.com/640x360.png?text=Partial+Derivatives',
      createdAt: daysAgo(45), // 1.5 months ago
      updatedAt: daysAgo(30), // 1 month ago
    },
    {
      id: createId(),
      title: 'Understanding Quantum Mechanics',
      slug: 'understanding-quantum-mechanics',
      description:
        'An introductory explanation of the principles of quantum mechanics and their implications in modern physics.',
      categoryId: seedCategories.find((c) => c.slug === 'physics')?.id,
      duration: '32:15',
      quality: '1080p',
      views: 2543,
      videoUrl: 'https://example.com/videos/quantum-mechanics-intro.mp4',
      thumbnailUrl: 'https://via.placeholder.com/640x360.png?text=Quantum+Mechanics',
      createdAt: daysAgo(30), // 1 month ago
      updatedAt: daysAgo(14), // 2 weeks ago
    },
    {
      id: createId(),
      title: 'Spanish Pronunciation Guide',
      slug: 'spanish-pronunciation-guide',
      description:
        'Learn the proper pronunciation of Spanish vowels, consonants, and common phrases for beginners.',
      categoryId: seedCategories.find((c) => c.slug === 'language-learning')?.id,
      duration: '15:20',
      quality: '720p',
      views: 3254,
      videoUrl: 'https://example.com/videos/spanish-pronunciation.mp4',
      thumbnailUrl: 'https://via.placeholder.com/640x360.png?text=Spanish+Pronunciation',
      createdAt: daysAgo(21), // 3 weeks ago
      updatedAt: daysAgo(10), // 1.5 weeks ago
    },
    {
      id: createId(),
      title: 'Building REST APIs with Node.js',
      slug: 'building-rest-apis-with-nodejs',
      description:
        'Step-by-step tutorial on how to build scalable and secure REST APIs using Node.js, Express, and MongoDB.',
      categoryId: seedCategories.find((c) => c.slug === 'computer-science')?.id,
      duration: '45:30',
      quality: '1080p',
      views: 1892,
      videoUrl: 'https://example.com/videos/node-rest-api.mp4',
      thumbnailUrl: 'https://via.placeholder.com/640x360.png?text=Node.js+REST+APIs',
      createdAt: daysAgo(21), // 3 weeks ago
      updatedAt: daysAgo(5), // 5 days ago
    },
    {
      id: createId(),
      title: "Classical Mechanics: Newton's Laws of Motion",
      slug: 'classical-mechanics-newton-laws',
      description:
        "A detailed explanation of Newton's three laws of motion and their applications in classical physics.",
      categoryId: seedCategories.find((c) => c.slug === 'physics')?.id,
      duration: '28:15',
      quality: '1080p',
      views: 1645,
      videoUrl: 'https://example.com/videos/newtons-laws.mp4',
      thumbnailUrl: 'https://via.placeholder.com/640x360.png?text=Newton+Laws',
      createdAt: daysAgo(10), // 10 days ago
      updatedAt: daysAgo(5), // 5 days ago
    },
  ]

  console.log('Seeding videos...')

  try {
    const insertedVideos = await db.insert(videos).values(videoData).returning()
    console.log(`${insertedVideos.length} videos inserted.`)
    return insertedVideos
  } catch (error) {
    console.error('Error seeding videos:', error)
    return []
  }
}

// Seed quizzes with questions and answers
async function seedQuizzes(seedCategories: any[]) {
  if (!seedCategories.length) return []

  // Define quiz data
  const quizData = [
    {
      id: createId(),
      title: 'JavaScript Fundamentals Quiz',
      slug: 'javascript-fundamentals-quiz',
      description:
        'Test your knowledge of JavaScript fundamentals including variables, functions, and control flow.',
      categoryId: seedCategories.find((c) => c.slug === 'computer-science')?.id,
      difficulty: 'Beginner',
      estimatedTime: 10, // minutes
      thumbnailUrl: 'https://via.placeholder.com/640x360.png?text=JavaScript+Quiz',
      createdAt: daysAgo(30), // 1 month ago
      updatedAt: daysAgo(21), // 3 weeks ago
    },
    {
      id: createId(),
      title: 'Advanced Calculus Concepts',
      slug: 'advanced-calculus-concepts',
      description:
        'Challenge yourself with advanced calculus problems involving integration, differentiation, and series.',
      categoryId: seedCategories.find((c) => c.slug === 'mathematics')?.id,
      difficulty: 'Advanced',
      estimatedTime: 25, // minutes
      thumbnailUrl: 'https://via.placeholder.com/640x360.png?text=Calculus+Quiz',
      createdAt: daysAgo(21), // 3 weeks ago
      updatedAt: daysAgo(14), // 2 weeks ago
    },
    {
      id: createId(),
      title: 'Basic Physics Principles',
      slug: 'basic-physics-principles',
      description:
        'Test your understanding of fundamental physics principles including mechanics, energy, and simple circuits.',
      categoryId: seedCategories.find((c) => c.slug === 'physics')?.id,
      difficulty: 'Intermediate',
      estimatedTime: 15, // minutes
      thumbnailUrl: 'https://via.placeholder.com/640x360.png?text=Physics+Quiz',
      createdAt: daysAgo(21), // 3 weeks ago
      updatedAt: daysAgo(10), // 1.5 weeks ago
    },
    {
      id: createId(),
      title: 'Spanish Vocabulary Test',
      slug: 'spanish-vocabulary-test',
      description:
        'Check your knowledge of common Spanish vocabulary words and phrases for everyday communication.',
      categoryId: seedCategories.find((c) => c.slug === 'language-learning')?.id,
      difficulty: 'Beginner',
      estimatedTime: 12, // minutes
      thumbnailUrl: 'https://via.placeholder.com/640x360.png?text=Spanish+Quiz',
      createdAt: daysAgo(10), // 1.5 weeks ago
      updatedAt: daysAgo(5), // 5 days ago
    },
  ]

  console.log('Seeding quizzes...')

  try {
    const insertedQuizzes = await db.insert(quizzes).values(quizData).returning()
    console.log(`${insertedQuizzes.length} quizzes inserted.`)

    // Seed quiz questions and answers
    console.log('Seeding quiz questions and answers...')

    const quizQuestionsData = []
    const quizAnswersData = []

    // JavaScript Fundamentals Quiz Questions
    const jsQuiz = insertedQuizzes.find((q) => q.slug === 'javascript-fundamentals-quiz')
    if (jsQuiz) {
      const jsQuestions = [
        {
          id: createId(),
          quizId: jsQuiz.id,
          question: 'Which of the following is not a JavaScript data type?',
          correctAnswerIndex: 3,
          explanation:
            'Float is not a distinct data type in JavaScript. JavaScript has Number type which includes both integers and floating-point numbers.',
          order: 0,
        },
        {
          id: createId(),
          quizId: jsQuiz.id,
          question: 'What does the "===" operator do in JavaScript?',
          correctAnswerIndex: 2,
          explanation:
            'The "===" operator checks for both value equality and type equality, without type conversion.',
          order: 1,
        },
        {
          id: createId(),
          quizId: jsQuiz.id,
          question: 'Which method is used to add elements to the end of an array in JavaScript?',
          correctAnswerIndex: 1,
          explanation:
            'The push() method adds one or more elements to the end of an array and returns the new length.',
          order: 2,
        },
      ]

      quizQuestionsData.push(...jsQuestions)

      // Add answers for each question
      const jsAnswers = [
        // Answers for question 1
        {
          id: createId(),
          questionId: jsQuestions[0].id,
          answerText: 'String',
          order: 0,
        },
        {
          id: createId(),
          questionId: jsQuestions[0].id,
          answerText: 'Number',
          order: 1,
        },
        {
          id: createId(),
          questionId: jsQuestions[0].id,
          answerText: 'Boolean',
          order: 2,
        },
        {
          id: createId(),
          questionId: jsQuestions[0].id,
          answerText: 'Float',
          order: 3,
        },
        // Answers for question 2
        {
          id: createId(),
          questionId: jsQuestions[1].id,
          answerText: 'Assigns a value to a variable',
          order: 0,
        },
        {
          id: createId(),
          questionId: jsQuestions[1].id,
          answerText: 'Compares values (with type conversion)',
          order: 1,
        },
        {
          id: createId(),
          questionId: jsQuestions[1].id,
          answerText: 'Compares both value and type (strict equality)',
          order: 2,
        },
        {
          id: createId(),
          questionId: jsQuestions[1].id,
          answerText: 'Checks if a value is defined',
          order: 3,
        },
        // Answers for question 3
        {
          id: createId(),
          questionId: jsQuestions[2].id,
          answerText: 'append()',
          order: 0,
        },
        {
          id: createId(),
          questionId: jsQuestions[2].id,
          answerText: 'push()',
          order: 1,
        },
        {
          id: createId(),
          questionId: jsQuestions[2].id,
          answerText: 'add()',
          order: 2,
        },
        {
          id: createId(),
          questionId: jsQuestions[2].id,
          answerText: 'insert()',
          order: 3,
        },
      ]

      quizAnswersData.push(...jsAnswers)
    }

    // Physics Quiz Questions
    const physicsQuiz = insertedQuizzes.find((q) => q.slug === 'basic-physics-principles')
    if (physicsQuiz) {
      const physicsQuestions = [
        {
          id: createId(),
          quizId: physicsQuiz.id,
          question: "What is Newton's First Law of Motion?",
          correctAnswerIndex: 0,
          explanation:
            "Newton's First Law, also known as the Law of Inertia, states that an object at rest will stay at rest, and an object in motion will stay in motion at constant velocity, unless acted upon by an external force.",
          order: 0,
        },
        {
          id: createId(),
          quizId: physicsQuiz.id,
          question: 'What is the SI unit of force?',
          correctAnswerIndex: 1,
          explanation: 'The SI unit of force is the newton (N), which is equivalent to kg·m/s².',
          order: 1,
        },
        {
          id: createId(),
          quizId: physicsQuiz.id,
          question: 'Which of the following is a form of energy?',
          correctAnswerIndex: 2,
          explanation:
            'Potential energy is energy stored in an object due to its position or state. Examples include gravitational potential energy, elastic potential energy, and chemical potential energy.',
          order: 2,
        },
      ]

      quizQuestionsData.push(...physicsQuestions)

      // Add answers for each question
      const physicsAnswers = [
        // Answers for question 1
        {
          id: createId(),
          questionId: physicsQuestions[0].id,
          answerText:
            'An object will remain at rest or in uniform motion unless acted upon by an external force',
          order: 0,
        },
        {
          id: createId(),
          questionId: physicsQuestions[0].id,
          answerText: 'Force equals mass times acceleration',
          order: 1,
        },
        {
          id: createId(),
          questionId: physicsQuestions[0].id,
          answerText: 'For every action, there is an equal and opposite reaction',
          order: 2,
        },
        {
          id: createId(),
          questionId: physicsQuestions[0].id,
          answerText: 'Energy cannot be created or destroyed, only transformed',
          order: 3,
        },
        // Answers for question 2
        {
          id: createId(),
          questionId: physicsQuestions[1].id,
          answerText: 'Watt',
          order: 0,
        },
        {
          id: createId(),
          questionId: physicsQuestions[1].id,
          answerText: 'Newton',
          order: 1,
        },
        {
          id: createId(),
          questionId: physicsQuestions[1].id,
          answerText: 'Joule',
          order: 2,
        },
        {
          id: createId(),
          questionId: physicsQuestions[1].id,
          answerText: 'Pascal',
          order: 3,
        },
        // Answers for question 3
        {
          id: createId(),
          questionId: physicsQuestions[2].id,
          answerText: 'Intensity',
          order: 0,
        },
        {
          id: createId(),
          questionId: physicsQuestions[2].id,
          answerText: 'Momentum',
          order: 1,
        },
        {
          id: createId(),
          questionId: physicsQuestions[2].id,
          answerText: 'Potential energy',
          order: 2,
        },
        {
          id: createId(),
          questionId: physicsQuestions[2].id,
          answerText: 'Velocity',
          order: 3,
        },
      ]

      quizAnswersData.push(...physicsAnswers)
    }

    // Spanish Quiz Questions
    const spanishQuiz = insertedQuizzes.find((q) => q.slug === 'spanish-vocabulary-test')
    if (spanishQuiz) {
      const spanishQuestions = [
        {
          id: createId(),
          quizId: spanishQuiz.id,
          question: 'What is the Spanish word for "hello"?',
          correctAnswerIndex: 0,
          explanation:
            '"Hola" is the standard greeting in Spanish, equivalent to "hello" in English.',
          order: 0,
        },
        {
          id: createId(),
          quizId: spanishQuiz.id,
          question: 'Which is the correct Spanish translation for "thank you"?',
          correctAnswerIndex: 2,
          explanation: '"Gracias" is the Spanish word for "thank you".',
          order: 1,
        },
        {
          id: createId(),
          quizId: spanishQuiz.id,
          question: 'What does "¿Cómo estás?" mean in English?',
          correctAnswerIndex: 1,
          explanation:
            '"¿Cómo estás?" translates to "How are you?" in English and is a common greeting phrase.',
          order: 2,
        },
      ]

      quizQuestionsData.push(...spanishQuestions)

      // Add answers for each question
      const spanishAnswers = [
        // Answers for question 1
        {
          id: createId(),
          questionId: spanishQuestions[0].id,
          answerText: 'Hola',
          order: 0,
        },
        {
          id: createId(),
          questionId: spanishQuestions[0].id,
          answerText: 'Adiós',
          order: 1,
        },
        {
          id: createId(),
          questionId: spanishQuestions[0].id,
          answerText: 'Buenos días',
          order: 2,
        },
        {
          id: createId(),
          questionId: spanishQuestions[0].id,
          answerText: 'Por favor',
          order: 3,
        },
        // Answers for question 2
        {
          id: createId(),
          questionId: spanishQuestions[1].id,
          answerText: 'Por favor',
          order: 0,
        },
        {
          id: createId(),
          questionId: spanishQuestions[1].id,
          answerText: 'De nada',
          order: 1,
        },
        {
          id: createId(),
          questionId: spanishQuestions[1].id,
          answerText: 'Gracias',
          order: 2,
        },
        {
          id: createId(),
          questionId: spanishQuestions[1].id,
          answerText: 'Disculpe',
          order: 3,
        },
        // Answers for question 3
        {
          id: createId(),
          questionId: spanishQuestions[2].id,
          answerText: 'What is your name?',
          order: 0,
        },
        {
          id: createId(),
          questionId: spanishQuestions[2].id,
          answerText: 'How are you?',
          order: 1,
        },
        {
          id: createId(),
          questionId: spanishQuestions[2].id,
          answerText: 'Where are you from?',
          order: 2,
        },
        {
          id: createId(),
          questionId: spanishQuestions[2].id,
          answerText: 'What time is it?',
          order: 3,
        },
      ]

      quizAnswersData.push(...spanishAnswers)
    }

    // Insert all questions and answers
    const insertedQuestions = await db.insert(quizQuestions).values(quizQuestionsData).returning()
    console.log(`${insertedQuestions.length} quiz questions inserted.`)

    const insertedAnswers = await db.insert(quizAnswers).values(quizAnswersData).returning()
    console.log(`${insertedAnswers.length} quiz answers inserted.`)

    return insertedQuizzes
  } catch (error) {
    console.error('Error seeding quizzes:', error)
    return []
  }
}

// Main seed function
async function seed() {
  try {
    console.log('Starting database seeding...')

    // Clear existing data first (for development only)
    await clearAllData()

    // Seed categories first
    const seededCategories = await seedCategories()

    // Seed videos and quizzes with the created categories
    await Promise.all([seedVideos(seededCategories), seedQuizzes(seededCategories)])

    console.log('Database seeding completed successfully!')
  } catch (error) {
    console.error('Database seeding failed:', error)
  }
}

// Run the seed function
seed()

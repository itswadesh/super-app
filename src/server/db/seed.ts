import { db } from '.'
import { Category, User, HostProfile, Vendor } from './schema'

// Helper function to generate unique IDs
const generateId = () => crypto.randomUUID()

// Seed food categories
async function seedFoodCategories() {
  const foodCategoryData = [
    {
      id: generateId(),
      name: 'Indian',
      slug: 'indian',
      description: 'Traditional Indian cuisine with rich flavors and spices',
    },
    {
      id: generateId(),
      name: 'Chinese',
      slug: 'chinese',
      description: 'Authentic Chinese dishes with diverse regional flavors',
    },
    {
      id: generateId(),
      name: 'Italian',
      slug: 'italian',
      description: 'Classic Italian cuisine featuring pasta, pizza, and Mediterranean ingredients',
    },
    {
      id: generateId(),
      name: 'Mexican',
      slug: 'mexican',
      description: 'Vibrant Mexican food with bold flavors and fresh ingredients',
    },
  ]

  console.log('Seeding food categories...')

  try {
    const insertedFoodCategories = await db.insert(Category).values(foodCategoryData).returning()
    console.log(`${insertedFoodCategories.length} food categories inserted.`)
    return insertedFoodCategories
  } catch (error) {
    console.error('Error seeding food categories:', error)
    return []
  }
}

// Seed a test host user
async function seedTestHost() {
  const testUserData = {
    id: 'a3bdbc50-a7cb-43bb-9ad5-469a5810788b', // Use the same ID as in hooks.server.ts
    name: 'Test User',
    email: 'test@example.com',
    phone: '+918249028220', // Use the requested phone number
    passwordHash: 'hashedpassword', // In real app, this would be properly hashed
    role: 'buyer' as const,
  }

  const testHostProfileData = {
    userId: testUserData.id,
    bio: 'Test host for food ordering system',
    location: 'Test City',
    cuisineSpecialties: ['Indian', 'Chinese'],
  }

  console.log('Seeding test host...')

  try {
    // Insert user
    const insertedUser = await db.insert(User).values(testUserData).returning()
    console.log('Test user inserted.')

    // Insert host profile
    const insertedHostProfile = await db.insert(HostProfile).values(testHostProfileData).returning()
    console.log('Test host profile inserted.')

    return { user: insertedUser[0], hostProfile: insertedHostProfile[0] }
  } catch (error) {
    console.error('Error seeding test host:', error)
    return null
  }
}

// Seed a test application for the test user
async function seedTestApplication(userId: string) {
  const testApplicationData = {
    userId,
    fullName: 'Test Chef',
    email: 'test@example.com',
    phone: '+918249028220',
    address: 'Test Address',
    idProof: 'test-proof',
    status: 'pending' as const,
  }

  console.log('Seeding test application...')

  try {
    const insertedApplication = await db.insert(Vendor).values(testApplicationData).returning()
    console.log('Test application inserted.')
    return insertedApplication[0]
  } catch (error) {
    console.error('Error seeding test application:', error)
    return null
  }
}

// Main seed function
async function seed() {
  try {
    console.log('Starting database seeding...')

    // Seed food categories first
    const seededCategories = await seedFoodCategories()

    // Seed test host
    const testHost = await seedTestHost()

    // Seed test application for the test user
    if (testHost) {
      await seedTestApplication(testHost.user.id)
    }

    console.log('Database seeding completed successfully!')
    if (testHost) {
      console.log('Test host ID:', testHost.user.id)
    }
  } catch (error) {
    console.error('Database seeding failed:', error)
  }
}

// Run the seed function
seed()

import { db } from '.'
import { Category, User, Vendor, Product } from './schema'

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
    id: 'dd4c4faf-4ee0-4c64-88e5-acb5e7aca9ec', // Use the same ID as in hooks.server.ts
    name: 'Test User',
    email: 'test@example.com',
    phone: '+918249028220', // Use the requested phone number
    passwordHash: 'hashedpassword', // In real app, this would be properly hashed
    role: 'buyer' as const,
  }

  console.log('Seeding test host...')

  try {
    // Insert user
    const insertedUser = await db.insert(User).values(testUserData).returning()
    console.log('Test user inserted.')

    return { user: insertedUser[0], hostProfile: null }
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
    city: 'Sunabeda',
    idProof: 'test-proof',
    status: 'approved' as const, // Set to approved for testing
  }

  console.log('Seeding test application...')

  try {
    const insertedApplication = await db.insert(Vendor).values(testApplicationData).returning()
    console.log('Test application inserted with approved status.')
    return insertedApplication[0]
  } catch (error) {
    console.error('Error seeding test application:', error)
    return null
  }
}

// Seed test foods for the approved vendor
async function seedTestFoods(userId: string, categories: any[]) {
  const testFoods = [
    {
      hostId: userId,
      name: 'Butter Chicken',
      slug: 'butter-chicken',
      description: 'Creamy and rich butter chicken with authentic spices',
      price: '250.00',
      categoryId: categories.find((c) => c.slug === 'indian')?.id,
      isVegetarian: false,
      isAvailable: true,
      preparationTime: 30,
    },
    {
      hostId: userId,
      name: 'Paneer Tikka',
      slug: 'paneer-tikka',
      description: 'Marinated paneer cubes grilled to perfection',
      price: '180.00',
      categoryId: categories.find((c) => c.slug === 'indian')?.id,
      isVegetarian: true,
      isAvailable: true,
      preparationTime: 25,
    },
    {
      hostId: userId,
      name: 'Chicken Fried Rice',
      slug: 'chicken-fried-rice',
      description: 'Wok-tossed rice with vegetables and tender chicken',
      price: '150.00',
      categoryId: categories.find((c) => c.slug === 'chinese')?.id,
      isVegetarian: false,
      isAvailable: true,
      preparationTime: 20,
    },
  ]

  console.log('Seeding test foods...')

  try {
    for (const food of testFoods) {
      await db.insert(Product).values(food)
    }
    console.log(`${testFoods.length} test foods inserted.`)
    return testFoods
  } catch (error) {
    console.error('Error seeding test foods:', error)
    return []
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
      const vendor = await seedTestApplication(testHost.user.id)

      // Seed test foods for the approved vendor
      if (vendor && seededCategories) {
        await seedTestFoods(testHost.user.id, seededCategories)
      }
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

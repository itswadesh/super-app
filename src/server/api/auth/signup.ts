import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../../db'
import { User, Vendor } from '../../db/schema'

export const routes = new Hono()

export const signupHost = async (data: {
  name: string
  email: string
  phone: string
  bio?: string
  location: string
  cuisineSpecialties: string[]
}) => {
  const { name, email, phone, bio, location, cuisineSpecialties } = data

  // Check if user already exists
  const existingUsers = await db.select().from(User).where(eq(User.phone, phone))
  if (existingUsers.length > 0) {
    throw { status: 400, message: 'User with this phone number already exists.' }
  }

  // Check if email already exists
  const existingEmails = await db.select().from(User).where(eq(User.email, email))
  if (existingEmails.length > 0) {
    throw { status: 400, message: 'User with this email already exists.' }
  }

  // Create user
  const userData = {
    name,
    email,
    phone,
    passwordHash: '', // Will be set later if needed
    role: 'host',
    isVerified: false,
    avatar: '',
  }

  const insertedUsers = await db.insert(User).values(userData).returning()
  const newUser = insertedUsers[0]

  // Create host profile
  const hostProfileData = {
    userId: newUser.id,
    bio: bio || '',
    location,
    cuisineSpecialties: JSON.stringify(cuisineSpecialties),
    isActive: true,
  }

  await db.insert(Vendor).values(hostProfileData)

  return {
    success: true,
    message: 'Host account created successfully. Please verify your phone number.',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
    },
  }
}

import { and, desc, eq, gte } from 'drizzle-orm'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { db } from '../../db'
import { Bus, BusBooking, BusRoute } from '../../db/schema'
import { getSessionTokenCookie, validateSessionToken } from '../../db/auth'
import { generateEntityId } from '../../utils'

// Type definitions
interface BusSearchQuery {
  source?: string
  destination?: string
  date?: string
}

interface BookingRequest {
  busId: string
  passengerName: string
  passengerEmail: string
  passengerPhone: string
  travelDate: string
  totalSeats: number
  seatNumbers?: string[]
}

interface BusResponse {
  id: string
  name: string
  type: string
  departureTime: string
  arrivalTime: string
  price: string
  availableSeats: number
  totalSeats: number
  amenities?: any
}

interface RouteResponse {
  id: string
  source: string
  destination: string
  distance?: number | null
  estimatedDuration?: string | null
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Type for bus booking insert operation
type BusBookingInsert = typeof BusBooking.$inferInsert

export const busBookingRoutes = new Hono()

// GET /api/bus-booking - Search for available buses
busBookingRoutes.get('/', async (c: Context) => {
  try {
    const sessionToken = getSessionTokenCookie(c)
    const session = await validateSessionToken(sessionToken || '')
    
    const { source, destination, date } = c.req.query()
    
    if (!source || !destination) {
      return c.json({
        success: false,
        error: 'Source and destination are required',
      }, 400)
    }
    
    // Find the route
    const route = await db.query.BusRoute.findFirst({
      where: and(
        eq(BusRoute.source, source as string),
        eq(BusRoute.destination, destination as string),
        eq(BusRoute.isActive, true)
      )
    })
    
    if (!route) {
      return c.json({
        success: false,
        error: 'No active route found for the specified source and destination',
      }, 404)
    }
    
    // Find available buses for this route
    const buses = await db.query.Bus.findMany({
      where: and(
        eq(Bus.routeId, route.id),
        eq(Bus.isActive, true),
        gte(Bus.availableSeats, 1) // Only show buses with available seats
      ),
      orderBy: [desc(Bus.departureTime)]
    })
    
    if (buses.length === 0) {
      return c.json({
        success: true,
        data: [],
        message: 'No buses available for the selected route'
      })
    }
    
    return c.json({
      success: true,
      data: {
        route: {
          id: route.id,
          source: route.source,
          destination: route.destination,
          distance: route.distance,
          estimatedDuration: route.estimatedDuration
        },
        buses: buses.map(bus => ({
          id: bus.id,
          name: bus.name,
          type: bus.type,
          departureTime: bus.departureTime,
          arrivalTime: bus.arrivalTime,
          price: bus.price,
          availableSeats: bus.availableSeats,
          totalSeats: bus.totalSeats,
          amenities: bus.amenities
        }))
      }
    })
  } catch (err) {
    console.error('Error searching buses:', err)
    return c.json({
      success: false,
      error: 'Failed to search for buses',
    }, 500)
  }
})

// POST /api/bus-booking - Create a new bus booking
busBookingRoutes.post('/', async (c: Context) => {
  const sessionToken = getSessionTokenCookie(c)
  const session = await validateSessionToken(sessionToken || '')
  
  if (!session?.user) {
    return c.json({
      success: false,
      error: 'Unauthorized',
    }, 401)
  }
  
  try {
    const data = await c.req.json()
    
    // Validate request data
    if (!data.busId || !data.passengerName || !data.passengerEmail || !data.passengerPhone || !data.travelDate || !data.totalSeats) {
      return c.json({
        success: false,
        error: 'Missing required fields',
      }, 400)
    }
    
    // Check if bus exists and has enough available seats
    const bus = await db.query.Bus.findFirst({
      where: and(
        eq(Bus.id, data.busId),
        eq(Bus.isActive, true)
      )
    })
    
    if (!bus) {
      return c.json({
        success: false,
        error: 'Bus not found or not available',
      }, 404)
    }
    
    if (bus.availableSeats < data.totalSeats) {
      return c.json({
        success: false,
        error: 'Not enough available seats',
      }, 400)
    }
    
    // Get route information
    const route = await db.query.BusRoute.findFirst({
      where: eq(BusRoute.id, bus.routeId)
    })
    
    if (!route) {
      return c.json({
        success: false,
        error: 'Invalid route',
      }, 400)
    }
    
    // Calculate total amount
    const totalAmount = Number(bus.price) * data.totalSeats
    
    // Start a transaction
    const result = await db.transaction(async (tx) => {
      const now = new Date()
      const bookingData = {
        id: generateEntityId('bus_booking'),
        userId: session.user.id,
        busId: data.busId,
        bookingReference: `BKB-${Date.now()}`,
        passengerName: data.passengerName,
        passengerEmail: data.passengerEmail,
        passengerPhone: data.passengerPhone,
        totalSeats: data.totalSeats,
        totalAmount: totalAmount.toString(),
        bookingDate: now,
        travelDate: new Date(data.travelDate),
        status: 'confirmed' as const,
        paymentStatus: 'pending' as const,
        paymentId: null,
        source: route.source,
        destination: route.destination,
        seatNumbers: data.seatNumbers || [],
        notes: null,
        createdAt: now,
        updatedAt: now
      }

      // Create booking
      const [booking] = await tx
        .insert(BusBooking)
        .values(bookingData)
        .returning()
      
      // Update available seats
      await tx
        .update(Bus)
        .set({
          availableSeats: bus.availableSeats - data.totalSeats,
          updatedAt: now
        })
        .where(eq(Bus.id, data.busId))
      
      return booking
    })
    
    // In a real app, you would:
    // 1. Process payment
    // 2. Send confirmation email
    // 3. Update booking status based on payment result
    
    return c.json({
      success: true,
      data: {
        bookingId: result.id,
        bookingReference: result.bookingReference,
        status: result.status,
        paymentStatus: result.paymentStatus,
        totalAmount: result.totalAmount
      },
      message: 'Booking created successfully'
    })
  } catch (err) {
    console.error('Error creating booking:', err)
    return c.json({
      success: false,
      error: 'Failed to create booking',
    }, 500)
  }
})

// Export the routes
export default busBookingRoutes

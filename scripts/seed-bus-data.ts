import { db } from '../src/server/db';
import { BusRoute, Bus, BusBooking, User } from '../src/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Define types for inserts
type BusRouteInsert = typeof BusRoute.$inferInsert;
type BusInsert = typeof Bus.$inferInsert;
type BusBookingInsert = typeof BusBooking.$inferInsert;
type UserInsert = typeof User.$inferInsert;

// Interface for bus data
interface BusData {
  name: string;
  type: string;
  totalSeats: number;
  departureTime: string;
  arrivalTime: string;
  price: string;
  amenities: string[];
}

// Helper function to generate random date within a range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to generate random seat numbers
function generateSeatNumbers(count: number, totalSeats: number): number[] {
  const seats: number[] = [];
  const availableSeats: number[] = Array.from({ length: totalSeats }, (_, i: number) => i + 1);
  
  for (let i = 0; i < count; i++) {
    if (availableSeats.length === 0) break;
    const randomIndex = Math.floor(Math.random() * availableSeats.length);
    const seat = availableSeats.splice(randomIndex, 1)[0];
    if (seat !== undefined) {
      seats.push(seat);
    }
  }
  
  return seats;
}

// Interface for route data
interface RouteData {
  source: string;
  destination: string;
  distance: number;
  estimatedDuration: string;
}

// Sample bus routes
const routes: RouteData[] = [
  { 
    source: 'Bhubaneswar', 
    destination: 'Cuttack', 
    distance: 30, 
    estimatedDuration: '45 mins' 
  },
  { 
    source: 'Bhubaneswar', 
    destination: 'Puri', 
    distance: 60, 
    estimatedDuration: '1.5 hours' 
  },
  { 
    source: 'Bhubaneswar', 
    destination: 'Konark', 
    distance: 65, 
    estimatedDuration: '2 hours' 
  },
];

// Sample buses
const buses: BusData[] = [
  {
    name: 'City Express',
    type: 'seater',
    totalSeats: 35,
    departureTime: '08:00',
    arrivalTime: '09:00',
    price: '150.00',
    amenities: ['AC', 'Charging Ports', 'Water Bottle']
  },
  {
    name: 'Metro Shuttle',
    type: 'semi-sleeper',
    totalSeats: 30,
    departureTime: '10:00',
    arrivalTime: '11:30',
    price: '200.00',
    amenities: ['AC', 'WiFi', 'Charging Ports', 'Blanket']
  },
  {
    name: 'Royal Cruiser',
    type: 'sleeper',
    totalSeats: 25,
    departureTime: '22:00',
    arrivalTime: '06:00',
    price: '500.00',
    amenities: ['AC', 'WiFi', 'Blanket', 'Pillow', 'Snacks']
  }
];

// Sample users
const users = [
  {
    phone: '+919876543210',
    otp: '1234',
    role: 'user' as const
  },
  {
    phone: '+919876543211',
    otp: '1234',
    role: 'user' as const
  }
];

async function seed() {
  console.log('🌱 Seeding database...');
  
  try {
    // Clear existing data in the correct order to respect foreign key constraints
    console.log('🧹 Clearing existing data...');
    
    // First, delete bookings
    try {
      console.log('  ➖ Deleting existing bookings...');
      await db.delete(BusBooking).run();
    } catch (error) {
      console.warn('  ⚠️ Could not delete bookings:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Then delete buses
    try {
      console.log('  ➖ Deleting existing buses...');
      await db.delete(Bus).run();
    } catch (error) {
      console.warn('  ⚠️ Could not delete buses:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Then delete routes
    try {
      console.log('  ➖ Deleting existing routes...');
      await db.delete(BusRoute).run();
    } catch (error) {
      console.warn('  ⚠️ Could not delete routes:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Note: Not deleting users to avoid affecting other parts of the application
    console.log('  ℹ️  Skipping user deletion to avoid affecting other data');
    
    // Insert users
    console.log('👥 Inserting users...');
    const userInserts: UserInsert[] = users.map(user => ({
      ...user,
      id: `user_${randomUUID()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    const insertedUsers = await db.insert(User).values(userInserts).returning();
    
    // Insert routes
    console.log('🛣️ Inserting routes...');
    const routeInserts: BusRouteInsert[] = routes.map(route => ({
      id: `route_${randomUUID()}`,
      source: route.source,
      destination: route.destination,
      distance: route.distance,
      estimatedDuration: route.estimatedDuration,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const insertedRoutes = await db.insert(BusRoute).values(routeInserts).returning();
    console.log(`✅ Inserted ${insertedRoutes.length} routes`);
    
    // Insert buses
    console.log('🚌 Inserting buses...');
    const busInserts: BusInsert[] = [];
    
    // Make sure we have at least one route
    if (insertedRoutes.length === 0) {
      throw new Error('No routes available to assign to buses');
    }
    
    // Create a copy of the routes array
    const routePool = [...insertedRoutes];
    
    for (const bus of buses) {
      // If we've used all routes, start reusing them
      if (routePool.length === 0) {
        routePool.push(...insertedRoutes);
      }
      
      // Get a route and remove it from the pool
      const route = routePool.pop()!;
      
      busInserts.push({
        id: `bus_${randomUUID()}`,
        name: bus.name,
        type: bus.type,
        totalSeats: bus.totalSeats,
        availableSeats: bus.totalSeats,
        departureTime: bus.departureTime,
        arrivalTime: bus.arrivalTime,
        price: bus.price,
        routeId: route.id,
        amenities: JSON.stringify(bus.amenities),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    const insertedBuses = await db.insert(Bus).values(busInserts).returning();
    
    // Insert bookings
    console.log('🎫 Inserting bookings...');
    const statuses = ['confirmed', 'cancelled', 'completed'] as const;
    const paymentStatuses = ['pending', 'paid', 'failed'] as const;
    
    // Make sure we have at least one bus and one user
    if (insertedBuses.length === 0 || insertedUsers.length === 0) {
      console.warn('Skipping bookings - need at least one bus and one user');
    } else {
      const bookingInserts: BusBookingInsert[] = [];
      const bookingCount = Math.min(20, insertedBuses.length * 5); // Limit to 20 or buses * 5, whichever is smaller
      
      for (let i = 0; i < bookingCount; i++) {
        const bus = insertedBuses[Math.floor(Math.random() * insertedBuses.length)];
        const user = insertedUsers[Math.floor(Math.random() * insertedUsers.length)];
        const route = insertedRoutes.find(r => r.id === bus.routeId);
        
        if (!route) {
          console.warn(`No route found for bus ${bus.id}, skipping booking`);
          continue;
        }
        
        const seatCount = Math.floor(Math.random() * 3) + 1; // 1-3 seats
        const seatNumbers = generateSeatNumbers(seatCount, bus.totalSeats);
        const totalAmount = parseFloat(bus.price.toString()) * seatCount;
        
        const travelDate = randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Within next 30 days
        const bookingDate = randomDate(new Date(travelDate.getTime() - 7 * 24 * 60 * 60 * 1000), travelDate); // 1-7 days before travel
        
        const status = statuses[Math.floor(Math.random() * statuses.length)] as 'confirmed' | 'cancelled' | 'completed';
        const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)] as 'pending' | 'paid' | 'failed';
        
        bookingInserts.push({
          id: `booking_${randomUUID()}`,
          userId: user.id,
          busId: bus.id,
          bookingReference: `BKB${Math.floor(100000 + Math.random() * 900000)}`,
          passengerName: `Passenger ${i + 1}`,
          passengerEmail: `passenger${i + 1}@example.com`,
          passengerPhone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
          totalSeats: seatCount,
          totalAmount: totalAmount.toString(),
          bookingDate,
          travelDate,
          status,
          paymentStatus,
          paymentId: paymentStatus === 'paid' ? `PAY${Math.floor(100000 + Math.random() * 900000)}` : null,
          source: route.source || 'Unknown',
          destination: route.destination || 'Unknown',
          seatNumbers: JSON.stringify(seatNumbers),
          notes: status === 'cancelled' ? 'Cancelled by user' : null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      if (bookingInserts.length > 0) {
        await db.insert(BusBooking).values(bookingInserts);
        console.log(`✅ Inserted ${bookingInserts.length} bookings`);
      } else {
        console.warn('No bookings were created');
      }
    }
    
    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error && 'stack' in error) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

seed();

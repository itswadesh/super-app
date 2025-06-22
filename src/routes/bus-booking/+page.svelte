<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import { toast } from 'svelte-sonner';
  import { Loader2 } from '@lucide/svelte';
  import { onMount } from 'svelte';

  // State using Svelte 5 runes
  let allBuses = $state<Array<{
    id: string;
    name: string;
    type: string;
    departureTime: string;
    arrivalTime: string;
    price: string;
    availableSeats: number;
    totalSeats: number;
    amenities?: string[];
  }>>([]);
  
  let selectedBus = $state<typeof allBuses[number] | null>(null);
  let showBookingForm = $state(false);
  let isLoading = $state(false);
  let isBooking = $state(false);
  let selectedSeats = $state('1');
  let selectedDate = $state(new Date().toISOString().split('T')[0]);
  let selectedBusName = $state('');
  
  // Default source and destination
  let source = 'City A';
  let destination = 'City B';
  
  // Filtered buses based on selections
  let buses = $derived(
    allBuses.filter(bus => {
      if (!bus) return false;
      const matchesDate = true; // Add date matching logic if needed
      const matchesBus = !selectedBusName || bus.name === selectedBusName;
      return matchesDate && matchesBus;
    })
  );
  
  // Fetch all available buses
  async function fetchBuses() {
    isLoading = true;
    try {
      const response = await fetch('/api/bus-booking');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch buses');
      }
      
      allBuses = data.data?.buses || [];
    } catch (error) {
      console.error('Error fetching buses:', error);
      toast.error('Failed to load buses. Please try again.');
    } finally {
      isLoading = false;
    }
  }
  
  // Format time to 12-hour format
  function formatTime(timeString: string) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }
  
  // Handle bus selection
  function selectBus(bus: typeof buses[number]) {
    selectedBus = bus;
    showBookingForm = true;
  }
  
  // Handle form submission
  async function handleBooking(event: SubmitEvent) {
    event.preventDefault();
    if (!selectedBus) return;
    
    const formData = new FormData(event.target as HTMLFormElement);
    const seats = parseInt(selectedSeats, 10);
    
    const bookingData = {
      busId: selectedBus.id,
      passengerName: formData.get('passengerName') as string,
      passengerEmail: formData.get('email') as string,
      passengerPhone: formData.get('phone') as string,
      travelDate: new Date().toISOString().split('T')[0],
      totalSeats: seats,
      seatNumbers: Array.from({ length: seats }, (_, i) => `A${i + 1}`) // Generate seat numbers
    };
    
    isBooking = true;
    
    try {
      const response = await fetch('/api/bus-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to book ticket');
      }
      
      toast.success('Booking confirmed! Your booking reference is ' + data.data.bookingReference);
      showBookingForm = false;
      selectedBus = null;
      fetchBuses(); // Refresh the bus list
      
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to book ticket');
    } finally {
      isBooking = false;
    }
  }
  
  // Initialize
  onMount(() => {
    fetchBuses();
  });
</script>

<main class="container mx-auto px-4 py-8 max-w-4xl">
  <div class="mb-8">
    <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
      <h1 class="text-3xl font-bold">Available Buses</h1>
      <div class="text-sm text-gray-500">
        Showing {buses.length} {buses.length === 1 ? 'bus' : 'buses'}
        {selectedBusName && ` matching "${selectedBusName}"`}
      </div>
    </div>
    
    <div class="bg-gray-50 p-4 rounded-lg">
      <h2 class="text-sm font-medium text-gray-700 mb-3">Filter Buses</h2>
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <Label for="dateFilter" class="block text-sm font-medium text-gray-700 mb-1">Date</Label>
          <Input
            id="dateFilter"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            bind:value={selectedDate}
            class="w-full"
          />
        </div>
        <div class="flex-1">
          <Label for="busFilter" class="block text-sm font-medium text-gray-700 mb-1">Bus Name</Label>
          <select
            id="busFilter"
            bind:value={selectedBusName}
            class="w-full p-2 border rounded-md h-10 bg-white text-gray-700"
          >
            <option value="">All Buses</option>
            <option value="City Express">City Express</option>
            <option value="Metro Shuttle">Metro Shuttle</option>
          </select>
        </div>
        <div class="flex items-end">
          <Button 
            type="button" 
            variant="outline" 
            onclick={() => {
              selectedDate = new Date().toISOString().split('T')[0];
              selectedBusName = '';
            }}
            class="h-10 w-full sm:w-auto"
          >
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  </div>
  
  {#if isLoading && buses.length === 0}
    <div class="flex justify-center items-center h-64">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
      <span class="ml-2">Loading buses...</span>
    </div>
  {:else if buses.length === 0}
    <div class="text-center py-12">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h10m0 0v10m0-10l-4-4m4 4l-4 4" />
      </svg>
      <h3 class="mt-2 text-lg font-medium text-gray-900">No buses available</h3>
      <p class="mt-1 text-gray-500">There are currently no buses available for booking.</p>
      <div class="mt-6">
        <Button on:click={fetchBuses}>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
          </svg>
          Refresh
        </Button>
      </div>
    </div>
  {:else}
    <div class="space-y-4">
      {#each buses as bus (bus.id)}
        <Card class="hover:shadow-md transition-shadow cursor-pointer" on:click={() => selectBus(bus)}>
          <CardContent class="p-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-4">
                  <div class="bg-primary/10 p-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h10m0 0v10m0-10l-4-4m4 4l-4 4" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold">{bus.name}</h3>
                    <p class="text-sm text-gray-500">{bus.type}</p>
                  </div>
                </div>
              </div>
              
              <div class="mt-4 md:mt-0 md:mx-6">
                <div class="flex items-center space-x-6">
                  <div class="text-center">
                    <p class="text-sm text-gray-500">Departure</p>
                    <p class="font-medium">{formatTime(bus.departureTime)}</p>
                  </div>
                  <div class="h-1 w-8 bg-gray-200 rounded-full"></div>
                  <div class="text-center">
                    <p class="text-sm text-gray-500">Arrival</p>
                    <p class="font-medium">{formatTime(bus.arrivalTime)}</p>
                  </div>
                </div>
              </div>
              
              <div class="mt-4 md:mt-0 text-right">
                <p class="text-2xl font-bold text-primary">${parseFloat(bus.price).toFixed(2)}</p>
                <p class="text-sm text-gray-500">{bus.availableSeats} seats left</p>
                <Button size="sm" class="mt-2" variant="outline">
                  Book Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
  
  <!-- Booking Modal -->
  {#if showBookingForm && selectedBus}
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 md:p-8 z-50 overflow-y-auto">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
        <div class="p-6 border-b flex justify-between items-center">
          <div>
            <h3 class="text-xl font-semibold">Book Your Seat</h3>
            <p class="text-sm text-gray-500">{selectedBus.name} • {selectedBus.type}</p>
          </div>
          <button 
            type="button" 
            class="text-gray-400 hover:text-gray-500"
            onclick={() => showBookingForm = false}
          >
            <span class="sr-only">Close</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="p-6">
          <div class="bg-gray-50 p-4 rounded-lg mb-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">Journey Details</p>
                <p class="text-sm text-gray-500">{selectedBus.departureTime} - {selectedBus.arrivalTime}</p>
              </div>
              <div class="text-right">
                <p class="font-medium">${selectedBus.price}</p>
                <p class="text-sm text-gray-500">{selectedBus.availableSeats} seats left</p>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
              <div>
                <p class="font-medium">{source}</p>
                <p class="text-gray-500">{selectedBus.departureTime}</p>
              </div>
              <div class="text-center">
                <div class="w-8 h-px bg-gray-300 my-2"></div>
                <span class="text-xs text-gray-400">to</span>
              </div>
              <div class="text-right">
                <p class="font-medium">{destination}</p>
                <p class="text-gray-500">{selectedBus.arrivalTime}</p>
              </div>
            </div>
          </div>
          
          <form onsubmit={(e) => { e.preventDefault(); handleBooking(e); }} class="space-y-6">
            <div class="space-y-4">
              <h4 class="font-medium">Passenger Details</h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label for="passengerName">Full Name</Label>
                  <Input
                    id="passengerName"
                    name="passengerName"
                    type="text"
                    required
                    placeholder="John Doe"
                    class="w-full"
                  />
                </div>
                
                <div>
                  <Label for="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="john@example.com"
                    class="w-full"
                  />
                </div>
                
                <div>
                  <Label for="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="+1 (555) 123-4567"
                    class="w-full"
                  />
                </div>
                
                <div>
                  <Label for="seats">Number of Seats</Label>
                  <select
                    id="seats"
                    name="seats"
                    bind:value={selectedSeats}
                    class="w-full p-2 border rounded bg-white h-10 text-sm"
                    required
                  >
                    {#each Array.from({ length: Math.min(5, selectedBus.availableSeats) }, (_, i) => i + 1) as seats}
                      <option value={seats}>
                        {seats} {seats === 1 ? 'Seat' : 'Seats'}
                      </option>
                    {/each}
                  </select>
                </div>
              </div>
            </div>
            
            <div class="border-t pt-4">
              <h4 class="font-medium mb-4">Fare Summary</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-600">Base Fare ({selectedSeats} × ${parseFloat(selectedBus.price).toFixed(2)})</span>
                  <span>${(parseFloat(selectedBus.price) * parseInt(selectedSeats, 10)).toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Taxes & Fees</span>
                  <span>$0.00</span>
                </div>
                <div class="border-t pt-2 mt-2 flex justify-between font-semibold">
                  <span>Total Amount</span>
                  <span class="text-primary">
                    ${(parseFloat(selectedBus.price) * parseInt(selectedSeats, 10)).toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div class="mt-6">
                <div class="flex items-start">
                  <input
                    id="terms"
                    type="checkbox"
                    class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mt-1"
                    required
                  />
                  <label for="terms" class="ml-2 block text-sm text-gray-700">
                    I agree to the <a href="/terms" class="text-primary hover:underline">Terms & Conditions</a> and 
                    <a href="/privacy" class="text-primary hover:underline">Privacy Policy</a>
                  </label>
                </div>
              </div>
              
              <div class="mt-6">
                <Button type="submit" class="w-full" disabled={isBooking}>
                  {#if isBooking}
                    <Loader2 class="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  {:else}
                    Confirm Booking
                  {/if}
                </Button>
                <p class="mt-2 text-xs text-center text-gray-500">
                  You'll receive booking details on your email & phone
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  {/if}
</main>

<svelte:head>
  <title>Bus Booking</title>
</svelte:head>
<!-- Toast notifications are handled by svelte-sonner -->

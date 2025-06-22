<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';
  import CustomSelect from '$lib/components/ui/custom-select.svelte';
  import CustomSelectItem from '$lib/components/ui/custom-select-item.svelte';
  import { Input } from '$lib/components/ui/input';
  import { toast } from 'svelte-sonner';

  // State using Svelte 5 runes
  let selectedDate = $state(new Date().toISOString().split('T')[0]);
  let source = $state('');
  let destination = $state('');
  let selectedSeats = $state('1');
  
  let availableBuses = $state<Array<{
    id: string;
    name: string;
    departure: string;
    arrival: string;
    price: number;
    seats: number;
  }>>([]);
  
  let selectedBus = $state<{
    id: string;
    name: string;
    departure: string;
    arrival: string;
    price: number;
    seats: number;
  } | null>(null);
  
  let showBookingForm = $state(false);
  let isLoading = $state(false);
  let bookingError = $state('');

  const cities = ['New York', 'Boston', 'Washington DC', 'Philadelphia', 'Baltimore'];
  
  // Format date for display
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  // Handle input changes
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const { name, value } = target;
    
    if (name === 'source') source = value;
    else if (name === 'destination') destination = value;
    else if (name === 'seats') selectedSeats = value;
  }
  
  // Handle date change
  function handleDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    selectedDate = target.value;
  }
  
  // Search for buses
  async function handleSearch() {
    if (!source || !destination || source === destination) {
      bookingError = 'Please select valid source and destination';
      return;
    }
    
    bookingError = '';
    isLoading = true;
    
    try {
      const params = new URLSearchParams({
        source,
        destination,
        date: selectedDate
      });
      
      const response = await fetch(`http://localhost:3001/api/buses/search?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch buses');
      }
      
      availableBuses = data.route?.buses || [];
      
      if (availableBuses.length === 0) {
        toast.info('No buses found for the selected route and date');
      }
    } catch (error) {
      console.error('Error searching buses:', error);
      toast.error('Failed to search for buses. Please try again.');
      availableBuses = [];
    } finally {
      isLoading = false;
    }
  }
  
  // Handle bus selection
  function selectBus(bus: any) {
    selectedBus = bus;
    showBookingForm = true;
  }
  
  // Handle form submission
  async function handleBooking(event: SubmitEvent) {
    event.preventDefault();
    
    if (!selectedBus) return;
    
    const formData = new FormData(event.target as HTMLFormElement);
    
    const bookingData = {
      busId: selectedBus.id,
      passengerName: formData.get('passengerName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      seats: parseInt(formData.get('seats') as string, 10),
      date: selectedDate,
      source,
      destination,
      totalPrice: selectedBus.price * parseInt(selectedSeats, 10)
    };
    
    isLoading = true;
    
    try {
      const response = await fetch('http://localhost:3001/api/buses/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to book ticket');
      }
      
      // Show success message
      toast.success('Booking confirmed! Check your email for details.');
      
      // Reset form
      showBookingForm = false;
      selectedBus = null;
      selectedSeats = '1';
      
      // Clear available buses to show the search form again
      availableBuses = [];
      
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to book ticket. Please try again.');
    } finally {
      isLoading = false;
    }
  }
  
  function handleBackToBuses() {
    showBookingForm = false;
  }
</script>

<main class="container mx-auto px-4 py-8 max-w-4xl">
  <h1 class="text-3xl font-bold mb-6">Bus Ticket Booking</h1>
  
  <Card class="mb-6">
    <CardHeader>
      <CardTitle>Search Buses</CardTitle>
    </CardHeader>
    <CardContent>
      <form on:submit|preventDefault={handleSearch} class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label for="source">From</Label>
            <select
              id="source"
              name="source"
              on:input={handleInput}
              class="w-full p-2 border rounded"
              required
            >
              <option value="">Select source</option>
              {#each cities as city}
                <option value={city} selected={source === city}>
                  {city}
                </option>
              {/each}
            </select>
          </div>
          
          <div>
            <Label for="destination">To</Label>
            <select
              id="destination"
              name="destination"
              on:input={handleInput}
              class="w-full p-2 border rounded"
              required
            >
              <option value="">Select destination</option>
              {#each cities.filter(c => c !== source) as city}
                <option value={city} selected={destination === city}>
                  {city}
                </option>
              {/each}
            </select>
          </div>
          
          <div>
            <Label for="date">Date</Label>
            <input
              type="date"
              id="date"
              name="date"
              bind:value={selectedDate}
              on:input={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
              class="w-full p-2 border rounded"
              required
            />
          </div>
        </div>
        
        <div class="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {#if isLoading}
              <span class="animate-spin mr-2">↻</span>
            {/if}
            Search Buses
          </Button>
        </div>
      </form>
      
      {#if bookingError}
        <p class="mt-2 text-red-500">{bookingError}</p>
      {/if}
    </CardContent>
  </Card>
  
  {#if availableBuses.length > 0}
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Available Buses</h2>
      
      {#each availableBuses as bus}
        <Card>
          <CardContent class="p-4">
            <div class="flex justify-between items-center w-full">
  <div>
    <h3 class="font-medium">{bus.name}</h3>
    <p class="text-sm text-gray-500">
      {bus.departure} - {bus.arrival}
    </p>
  </div>
  <div class="text-right">
    <p class="font-medium">${bus.price.toFixed(2)}</p>
    <p class="text-sm text-gray-500">{bus.seats} seats left</p>
  </div>
  <Button on:click={() => selectBus(bus)}>
    Select Seats
  </Button>
</div>
</CardContent>
</Card>
{/each}
</div>
  {:else if availableBuses.length === 0 && source && destination}
    <div class="text-center py-12">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2" />
      </svg>
      <h3 class="mt-2 text-lg font-medium text-gray-900">No buses found</h3>
      <p class="mt-1 text-gray-500">We couldn't find any buses for the selected route and date.</p>
      <div class="mt-6">
        <Button on:click={() => {
          source = '';
          destination = '';
          availableBuses = [];
        }} variant="outline">
          Modify Search
        </Button>
      </div>
    </div>
  {/if}
  
  {#if showBookingForm && selectedBus}
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="p-6 border-b">
          <h3 class="text-lg font-semibold">Book Your Seat</h3>
          <p class="text-sm text-gray-500">Complete your booking by filling the details below</p>
        </div>
        
        <div class="p-6">
          <div class="bg-gray-50 p-4 rounded-lg mb-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-500">Bus</span>
              <span class="font-medium">{selectedBus.name}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <div>
                <p class="font-medium">{selectedBus.departure}</p>
                <p class="text-gray-500">{source}</p>
              </div>
              <div class="text-center">
                <div class="w-8 h-px bg-gray-300 my-2"></div>
                <span class="text-xs text-gray-400">to</span>
              </div>
              <div class="text-right">
                <p class="font-medium">{selectedBus.arrival}</p>
                <p class="text-gray-500">{destination}</p>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-100">
              <div class="flex justify-between">
                <span class="text-sm text-gray-500">Date</span>
                <span class="text-sm font-medium">{formatDate(selectedDate)}</span>
              </div>
              <div class="flex justify-between mt-1">
                <span class="text-sm text-gray-500">Price per seat</span>
                <span class="text-sm font-medium">${selectedBus.price.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <form method="POST" on:submit|preventDefault={handleBooking} class="space-y-4">
            <input type="hidden" name="busId" value={selectedBus.id} />
            <input type="hidden" name="date" value={selectedDate} />
            <input type="hidden" name="source" value={source} />
            <input type="hidden" name="destination" value={destination} />
            
            <div class="space-y-2">
              <Label for="passengerName">Full Name</Label>
              <input
                type="text"
                id="passengerName"
                name="passengerName"
                required
                class="w-full p-2 border rounded"
                placeholder="John Doe"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="email">Email</Label>
              <input
                type="email"
                id="email"
                name="email"
                required
                class="w-full p-2 border rounded"
                placeholder="john@example.com"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="phone">Phone</Label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                class="w-full p-2 border rounded"
                placeholder="+1234567890"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="seats">Number of Seats</Label>
              <select
                id="seats"
                name="seats"
                on:input={handleInput}
                class="w-full p-2 border rounded"
                required
              >
                {#each Array.from({ length: Math.min(10, selectedBus.seats) }, (_, i) => i + 1) as num}
                  <option value={num} selected={selectedSeats === num.toString()}>
                    {num} {num === 1 ? 'seat' : 'seats'}
                  </option>
                {/each}
              </select>
            </div>
            
            <div class="pt-2">
              <p class="text-sm text-gray-500 mb-2">
                Total Amount: 
                <span class="font-semibold text-lg text-blue-600">
                  ${(selectedBus.price * parseInt(selectedSeats, 10)).toFixed(2)}
                </span>
              </p>
            </div>
            
            <div class="flex justify-end gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                on:click={handleBackToBuses}
              >
                Cancel
              </Button>
              <Button type="submit" class="bg-blue-600 hover:bg-blue-700">
                {isLoading ? 'Processing...' : 'Confirm Booking'}
              </Button>
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

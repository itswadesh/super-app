<script lang="ts">
import { onMount } from 'svelte'
// Define balloon type for type safety
type Balloon = {
  id: string
  colorStart: string
  colorEnd: string
  size: number
  xPos: number
  startOffsetY: number
  duration: number
  delay: number
}

// Using Svelte 5 runes with explicit typing
let balloons = $state<Balloon[]>([])
let animationRunning = $state(true)

// Balloon configuration
const maxBalloons = 1 // Only one balloon at a time
const minSize = 60
const maxSize = 140
const colors = [
  ['#FF5757', '#FFA6A6'], // Red
  ['#57C5FF', '#A6E1FF'], // Blue
  ['#57FF8F', '#A6FFD0'], // Green
  ['#F157FF', '#F7A6FF'], // Purple
  ['#FFD857', '#FFECAD'], // Yellow
]

// Create a new balloon with random properties
function createBalloon() {
  if (!animationRunning) return

  const colorIndex = Math.floor(Math.random() * colors.length)
  const size = minSize + Math.floor(Math.random() * (maxSize - minSize))

  // Create more varied starting positions
  // Balloons will now start from different areas along the bottom edge
  const xPos = 10 + Math.random() * 80 // Position from 10% to 90% horizontally
  const startOffsetY = -10 - Math.random() * 20 // Varied starting heights below viewport

  const duration = 12 + Math.random() * 8 // Duration between 12-20 seconds
  const delay = Math.random() * 3 // Random delay up to 3 seconds

  const balloon = {
    id: `balloon-${Date.now()}-${Math.random()}`,
    colorStart: colors[colorIndex][0],
    colorEnd: colors[colorIndex][1],
    size,
    xPos,
    startOffsetY,
    duration,
    delay,
  }

  // Add the balloon to our collection
  balloons = [...balloons, balloon]

  // Remove balloon after it completes animation (plus some buffer)
  setTimeout(
    () => {
      balloons = balloons.filter((b) => b.id !== balloon.id)
    },
    (duration + delay + 2) * 1000
  )
}

// Create new balloons at intervals
// Create the initial balloon immediately and set up the interval with onMount
onMount(() => {
  // Initial balloon
  createBalloon()

  // Create new balloons one at a time with a delay between them
  const interval = setInterval(() => {
    if (balloons.length < maxBalloons) {
      createBalloon()
    }
  }, 5000) // Longer interval between balloons

  return () => {
    clearInterval(interval)
    animationRunning = false
  }
})
</script>

<div class="balloons-container">
  {#each balloons as balloon (balloon.id)}
    <div 
      class="balloon-wrapper" 
      style="
        --balloon-x: {balloon.xPos}%;
        --balloon-y: {balloon.startOffsetY}px;
        --balloon-size: {balloon.size}px;
        --balloon-duration: {balloon.duration}s;
        --balloon-delay: {balloon.delay}s;
        --color-start: {balloon.colorStart};
        --color-end: {balloon.colorEnd};
      "
    >
      <svg 
        width="{balloon.size}" 
        height="{balloon.size * 1.33}" 
        viewBox="0 0 120 160" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Balloon String -->
        <path 
          d="M60 160C60 140 65 120 60 100" 
          stroke="rgba(255,255,255,0.8)" 
          stroke-width="2" 
          stroke-dasharray="5,5" 
          class="balloon-string" 
        />
        
        <!-- Balloon -->
        <ellipse 
          cx="60" 
          cy="50" 
          rx="50" 
          ry="50" 
          fill="url(#balloonGradient-{balloon.id})" 
        />
        
        <!-- Balloon Highlight -->
        <ellipse 
          cx="45" 
          cy="35" 
          rx="15" 
          ry="10" 
          fill="rgba(255,255,255,0.3)" 
          transform="rotate(-20 45 35)" 
        />
        
        <!-- Balloon Knot -->
        <path 
          d="M57 100C57 100 55 105 60 105C65 105 63 100 63 100L60 90L57 100Z" 
          fill="rgba(255,255,255,0.8)" 
        />
        
        <!-- Gradient Definition -->
        <defs>
          <radialGradient 
            id="balloonGradient-{balloon.id}" 
            cx="0.5" 
            cy="0.5" 
            r="0.5" 
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stop-color="{balloon.colorEnd}" />
            <stop offset="100%" stop-color="{balloon.colorStart}" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  {/each}
</div>

<style>
  .balloons-container {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 1; /* Lower z-index to position behind text and buttons */
    pointer-events: none;
  }
  
  .balloon-wrapper {
    position: absolute;
    will-change: transform;
    left: var(--balloon-x);
    bottom: var(--balloon-y);
    animation: flyUp var(--balloon-duration) ease-out forwards var(--balloon-delay);
    opacity: 0.85; /* Slightly transparent to blend better with background */
  }
  
  .balloon-string {
    transform-origin: top center;
    animation: wavyString 2s ease-in-out infinite;
  }
  
  @keyframes flyUp {
    0% { transform: translateY(0) rotate(0) translateX(0); }
    25% { transform: translateY(-30vh) rotate(5deg) translateX(20px); }
    50% { transform: translateY(-60vh) rotate(10deg) translateX(-15px); }
    75% { transform: translateY(-90vh) rotate(15deg) translateX(10px); }
    100% { transform: translateY(-120vh) rotate(20deg) translateX(-5px); }
  }
  
  @keyframes wavyString {
    0% { transform: translateX(0px); }
    50% { transform: translateX(5px); }
    100% { transform: translateX(0px); }
  }
</style>

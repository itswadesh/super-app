<script lang="ts">
import { onMount } from 'svelte'

// Animation settings
let animationActive = $state(true)
let balloons = $state<Balloon[]>([])
let containerElement: HTMLDivElement

// Define balloon type
type Balloon = {
  id: string
  color: string
  x: number
  y: number
  z: number // z-position for 3D effect
  rotateX: number // rotation on X axis
  rotateY: number // rotation on Y axis
  rotateZ: number // rotation on Z axis
  xMovement: number // horizontal drift
  scale: number
  duration: number
  delay: number
}

// Balloon colors
const colors = [
  '#F87171', // red
  '#60A5FA', // blue
  '#34D399', // green
  '#A78BFA', // purple
  '#FBBF24', // yellow
  '#FB7185', // pink
  '#38BDF8', // light blue
]

// Create a balloon with 3D movement
function createBalloon() {
  if (!animationActive) return

  const color = colors[Math.floor(Math.random() * colors.length)]
  const x = 10 + Math.random() * 80 // 10-90% from left
  const y = 105 // start below screen
  const z = -100 + Math.random() * 200 // -100px to +100px on z-axis

  // Rotation values
  const rotateX = -10 + Math.random() * 20 // -10deg to +10deg
  const rotateY = -10 + Math.random() * 20 // -10deg to +10deg
  const rotateZ = -10 + Math.random() * 20 // -10deg to +10deg

  // Horizontal movement
  const xMovement = -15 + Math.random() * 30 // -15% to +15% horizontal drift

  const scale = 0.3 + Math.random() * 0.4 // 0.3-0.7 scale
  const duration = 12 + Math.random() * 18 // 12-30 seconds
  const delay = Math.random() * 5 // 0-5 second delay

  const balloon = {
    id: `balloon-${Date.now()}-${Math.random()}`,
    color,
    x,
    y,
    z,
    rotateX,
    rotateY,
    rotateZ,
    xMovement,
    scale,
    duration,
    delay,
  }

  // Add the balloon
  balloons = [...balloons, balloon]

  // Remove balloon after animation completes
  setTimeout(
    () => {
      balloons = balloons.filter((b) => b.id !== balloon.id)
    },
    (duration + delay) * 1000
  )
}

// Initialize and manage the animation
onMount(() => {
  // Create initial balloon
  createBalloon()

  // Create new balloons only after the previous one is gone
  const interval = setInterval(() => {
    if (balloons.length === 0) {
      createBalloon()
    }
  }, 1000) // Check frequently to maintain continuous animation

  return () => {
    clearInterval(interval)
    animationActive = false
  }
})
</script>

<div class="balloon-container" bind:this={containerElement}>
  {#each balloons as balloon (balloon.id)}
    <div 
      class="balloon" 
      style="
        --x-start: {balloon.x}%;
        --x-end: calc({balloon.x}% + {balloon.xMovement}%);
        --z: {balloon.z}px;
        --rotate-x: {balloon.rotateX}deg;
        --rotate-y: {balloon.rotateY}deg;
        --rotate-z: {balloon.rotateZ}deg;
        --scale: {balloon.scale};
        --duration: {balloon.duration}s;
        --delay: {balloon.delay}s;
        left: {balloon.x}%;
        bottom: {balloon.y}%;
        transform: translateZ({balloon.z}px) rotateX({balloon.rotateX}deg) rotateY({balloon.rotateY}deg) rotateZ({balloon.rotateZ}deg) scale({balloon.scale});
        animation-duration: {balloon.duration}s;
        animation-delay: {balloon.delay}s;
      "
    >
      <div class="balloon-body" style="background-color: {balloon.color}"></div>
      <div class="balloon-string"></div>
    </div>
  {/each}
</div>

<style>
  .balloon-container {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 1;
    pointer-events: none;
    overflow: hidden;
    perspective: 1000px; /* Enable 3D space */
    perspective-origin: center;
    transform-style: preserve-3d;
  }
  
  .balloon {
    position: absolute;
    will-change: transform;
    animation: float3D linear forwards;
    transform-style: preserve-3d;
  }
  
  .balloon-body {
    width: 30px;
    height: 40px;
    border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
    position: relative;
    box-shadow: inset -5px -5px 10px rgba(0,0,0,0.1);
    /* Add highlight for 3D effect */
    background-image: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%);
  }
  
  .balloon-string {
    height: 50px;
    width: 1px;
    background: rgba(255,255,255,0.7);
    margin-left: 15px;
    transform-origin: top center;
    animation: swingString 2s ease-in-out infinite alternate;
  }
  
  @keyframes float3D {
    0% {
      bottom: -20%;
      opacity: 0;
      left: var(--x-start);
      transform: translateZ(var(--z)) rotateX(var(--rotate-x)) rotateY(var(--rotate-y)) rotateZ(var(--rotate-z)) scale(var(--scale));
    }
    10% {
      opacity: 1;
    }
    100% {
      bottom: 120%;
      opacity: 0;
      left: var(--x-end);
      transform: translateZ(var(--z)) rotateX(calc(var(--rotate-x) * -1)) rotateY(calc(var(--rotate-y) * -1)) rotateZ(calc(var(--rotate-z) * -1)) scale(var(--scale));
    }
  }
  
  @keyframes swingString {
    0% {
      transform: rotate(-2deg);
    }
    100% {
      transform: rotate(2deg);
    }
  }
</style>

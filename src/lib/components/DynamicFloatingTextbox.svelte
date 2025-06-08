<script lang="ts">
import FloatingTextbox from './FloatingTextbox.svelte'

// Props using Svelte 5 runes
const {
  id = '',
  name = '',
  value = '',
  label = '',
  type = 'text',
  required = false,
  placeholder = '',
  rows = 3,
  onInput = (val: string) => {},
} = $props()

// Function to handle input events
function handleInputEvent(event: CustomEvent<string>) {
  onInput(event.detail)
}
</script>

<FloatingTextbox
  {id}
  {name}
  {value}
  {label}
  {type}
  {required}
  {placeholder}
  {rows}
  on:input={handleInputEvent}
/>

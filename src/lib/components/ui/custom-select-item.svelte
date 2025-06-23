<script lang="ts">
export let value: string = ''
export let disabled: boolean = false
</script>

<option {value} {disabled}>
  <slot />
</option>

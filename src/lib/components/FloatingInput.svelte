<script lang="ts">
  // Props using Svelte 5 runes
  let {
    id,
    name,
    type = "text",
    value = "",
    required = false,
    label,
    placeholder = "",
    error = "",
    disabled = false,
    autocomplete = "off",
    className = "",
    oninput = (e: Event) => {},
    onblur = (e: Event) => {},
    onfocus = (e: Event) => {}
  } = $props<{
    id: string;
    name: string;
    type?: string;
    value?: string;
    required?: boolean;
    label: string;
    placeholder?: string;
    error?: string | boolean;
    disabled?: boolean;
    autocomplete?: string;
    className?: string;
    oninput?: (e: Event) => void;
    onblur?: (e: Event) => void;
    onfocus?: (e: Event) => void;
  }>();
  
  // Local state for the input value
  let inputValue = $state(value);
  
  // Update local value when prop changes
  $effect(() => {
    inputValue = value;
  });

  const hasValue = $derived(!!inputValue);
  const inputId = $derived(id || name);
  const showError = $derived(!!error);

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    inputValue = target.value;
    oninput?.(e);
  }

  function handleBlur(e: Event) {
    if (onblur) onblur(e);
  }

  function handleFocus(e: Event) {
    if (onfocus) onfocus(e);
  }
</script>

<div class="relative mb-4 pt-4">
  <input
    {id}
    {name}
    {type}
    {required}
    value={inputValue}
    {disabled}
    {autocomplete}
    oninput={handleInput}
    onblur={handleBlur}
    onfocus={handleFocus}
    class="w-full px-3 pt-4 pb-2 h-14 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent {className}"
    class:border-red-500={showError}
    class:border-gray-300={!showError}
    class:bg-gray-50={disabled}
    class:text-gray-400={disabled}
    placeholder={placeholder || " "}
    aria-invalid={showError}
    aria-describedby={showError ? `${inputId}-error` : undefined}
  />
  <label
    for={inputId}
    class="absolute left-3 transition-all mt-3 duration-200 pointer-events-none origin-top-left"
    class:scale-75={hasValue || placeholder}
    class:translate-y-[-8px]={hasValue || placeholder}
    class:translate-y-[20px]={!hasValue && !placeholder}
    class:text-blue-500={hasValue || placeholder}
    class:text-gray-500={!hasValue && !placeholder}
    class:text-red-500={showError}
  >
    {label}
    {#if required}
      <span class="text-red-500">*</span>
    {/if}
  </label>

  {#if showError}
    <p id={`${inputId}-error`} class="mt-1 text-sm text-red-600">
      {typeof error === "string" ? error : "This field is required"}
    </p>
  {/if}
</div>

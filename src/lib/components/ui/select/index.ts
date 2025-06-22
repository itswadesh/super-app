// Import components
import Select from './select.svelte';
import SelectItem from './select-item.svelte';
import SelectLabel from './select-label.svelte';
import SelectGroup from './select-group.svelte';
import SelectTrigger from './select-trigger.svelte';
import SelectContent from './select-content.svelte';
import SelectSeparator from './select-separator.svelte';
import SelectScrollUpButton from './select-scroll-up-button.svelte';
import SelectScrollDownButton from './select-scroll-down-button.svelte';

// Export all components
export {
  Select,
  SelectItem,
  SelectLabel,
  SelectGroup,
  SelectTrigger,
  SelectContent,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};

// For backward compatibility
export const Root = Select;
export const Item = SelectItem;
export const Label = SelectLabel;
export const Group = SelectGroup;

// Export with Select prefix
export const SelectRoot = Select;

// Re-export types
export type { SelectProps } from './select.svelte';
export type { SelectItemProps } from './select-item.svelte';
export type { SelectLabelProps } from './select-label.svelte';
export type { SelectGroupProps } from './select-group.svelte';

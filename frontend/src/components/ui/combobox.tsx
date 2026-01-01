/**
 * @file frontend/src/components/ui/combobox.tsx
 * @description Themed combobox built on shadcn/ui primitives to match the gilded tactical aesthetic.
 */

import * as React from 'react';
import { CheckIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react';

import cn from '@/lib/utils';
import { Button } from './button';
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandInput,
  CommandShortcut,
} from './command';
import { Popover, PopoverTrigger, PopoverContent } from './popover';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
  icon?: React.ReactNode;
  badge?: string;
  shortcut?: string;
  disabled?: boolean;
  meta?: Record<string, unknown>;
}

export interface ComboboxProps {
  options: readonly ComboboxOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  allowDeselect?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  showSearch?: boolean;
  clearLabel?: string;
  renderDisplay?: (option: ComboboxOption | null) => React.ReactNode;
  ariaLabel?: string;
}

const UNGROUPED_KEY = Symbol('combobox-ungrouped');

function buildSections(options: readonly ComboboxOption[]) {
  type SectionKey = string | typeof UNGROUPED_KEY;
  const sectionOrder: SectionKey[] = [];
  const sections = new Map<SectionKey, { label: string | null; items: ComboboxOption[] }>();

  options.forEach((option) => {
    const key = option.group ?? UNGROUPED_KEY;
    if (!sections.has(key)) {
      sections.set(key, {
        label: option.group ?? null,
        items: [],
      });
      sectionOrder.push(key);
    }
    sections.get(key)?.items.push(option);
  });

  return sectionOrder
    .map((key) => {
      const section = sections.get(key);
      if (!section) {
        return null;
      }
      return section;
    })
    .filter((section): section is { label: string | null; items: ComboboxOption[] } => section !== null);
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  allowDeselect = true,
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  showSearch = true,
  clearLabel = 'Clear selection',
  renderDisplay,
  ariaLabel,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  );

  const sections = React.useMemo(() => buildSections(options), [options]);

  const handleSelect = (selectedValue: string) => {
    if (allowDeselect && selectedValue === value) {
      onValueChange(null);
    } else {
      onValueChange(selectedValue);
    }
    setOpen(false);
  };

  const handleClear = () => {
    onValueChange(null);
    setOpen(false);
  };

  function renderItems(items: ComboboxOption[]) {
    return items.map((option) => {
      const isSelected = option.value === value;
      return (
        <CommandItem
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          onSelect={(currentValue) => {
            handleSelect(currentValue);
          }}
          className={cn(
            'rounded-2xl border border-transparent bg-midnight-900/20 text-sm text-shadow-100 transition hover:border-aurora-300/30 hover:bg-midnight-900/40',
            isSelected && 'border-aurora-300/40 bg-aurora-400/15 text-aurora-50'
          )}
        >
          {option.icon && <span className="text-aurora-200">{option.icon}</span>}
          <div className="flex min-w-0 flex-col text-left">
            <span className="truncate font-semibold uppercase tracking-[0.22em]">{option.label}</span>
            {option.description && <span className="truncate text-xs text-shadow-300">{option.description}</span>}
          </div>
          {option.badge && (
            <span className="ml-auto rounded-full border border-aurora-300/30 bg-midnight-950/60 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.18em] text-aurora-100">
              {option.badge}
            </span>
          )}
          {option.shortcut && <CommandShortcut className="ml-3">{option.shortcut}</CommandShortcut>}
          <CheckIcon
            className={cn(
              'ml-auto h-4 w-4 text-aurora-200 transition-opacity',
              isSelected ? 'opacity-100' : 'opacity-0'
            )}
          />
        </CommandItem>
      );
    });
  }

  const displayContent = renderDisplay ? (
    renderDisplay(selectedOption)
  ) : (
    <div className="flex w-full items-center gap-3">
      {selectedOption?.icon && <span className="text-aurora-200">{selectedOption.icon}</span>}
      <div className="flex min-w-0 flex-col text-left">
        <span className="truncate text-sm font-semibold tracking-[0.18em] text-shadow-100 uppercase">
          {selectedOption?.label ?? placeholder}
        </span>
        {selectedOption?.description && (
          <span className="truncate text-xs text-shadow-300">{selectedOption.description}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={open} onOpenChange={(nextOpen) => !disabled && setOpen(nextOpen)}>
        <PopoverTrigger asChild>
          <Button
            ref={null}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={ariaLabel ?? placeholder}
            className={cn(
              'h-12 w-full justify-between rounded-3xl border-aurora-400/25 bg-midnight-950/60 px-5 text-left font-semibold uppercase tracking-[0.32em] text-shadow-50 transition hover:border-aurora-300/40 hover:bg-midnight-900/70 focus-visible:ring-aurora-300/40 disabled:cursor-not-allowed',
              !selectedOption && 'text-shadow-400',
              triggerClassName
            )}
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              setOpen((prev) => !prev);
            }}
          >
            {displayContent}
            <ChevronsUpDownIcon className="ml-3 h-4 w-4 shrink-0 text-aurora-200/70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className={cn('w-[min(320px,90vw)] p-0', contentClassName)}>
          <Command className="rounded-[28px] border border-transparent bg-transparent shadow-none">
            {showSearch && <CommandInput placeholder={searchPlaceholder} className="h-10 rounded-2xl" />}
            <CommandList className="max-h-60 p-3">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              {sections.map(({ label, items }) => (
                <React.Fragment key={label ?? 'default'}>
                  {label ? <CommandGroup heading={label}>{renderItems(items)}</CommandGroup> : renderItems(items)}
                </React.Fragment>
              ))}
            </CommandList>
          </Command>
          {selectedOption && allowDeselect && (
            <button
              type="button"
              onClick={handleClear}
              className="flex w-full items-center justify-center gap-2 rounded-b-3xl border-t border-aurora-400/15 bg-midnight-950/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-shadow-300 transition hover:bg-midnight-900/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300/40"
            >
              <XIcon className="h-3.5 w-3.5" />
              {clearLabel}
            </button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

Combobox.displayName = 'Combobox';

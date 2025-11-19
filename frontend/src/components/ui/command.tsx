/**
 * @file frontend/src/components/ui/command.tsx
 * @description Radix/cmdk command palette primitives styled to match the gilded UI theme.
 */

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';

import cn from '@/lib/utils';

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-3xl border border-aurora-400/20 bg-popover/80 text-popover-foreground shadow-[0_30px_70px_rgba(5,8,18,0.6)] backdrop-blur-2xl',
      className
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('max-h-72 overflow-y-auto overscroll-contain p-2', className)}
    {...props}
  />
));
CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className={cn('px-4 py-6 text-center text-sm font-medium text-shadow-300', className)}
    {...props}
  />
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'space-y-1 rounded-2xl border border-midnight-500/50 bg-midnight-950/30 p-2 backdrop-blur-xl',
      'data-[headlessui-state=active]:border-aurora-400/40',
      className
    )}
    {...props}
  />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator ref={ref} className={cn('mx-2 my-3 h-px bg-midnight-500/40', className)} {...props} />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'flex cursor-pointer select-none items-center gap-3 rounded-2xl px-3 py-2 text-sm text-shadow-100 transition-colors',
      'data-[selected=true]:bg-aurora-400/20 data-[selected=true]:text-aurora-50 data-[selected=true]:shadow-[0_12px_30px_rgba(213,135,36,0.3)]',
      'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40',
      className
    )}
    {...props}
  />
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="relative px-5 pt-5">
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex h-11 w-full items-center rounded-2xl border border-midnight-500/70 bg-midnight-900/60 px-4 text-sm text-shadow-50 transition focus:border-aurora-300 focus:outline-none focus:ring-2 focus:ring-aurora-300/40',
        'placeholder:text-shadow-400',
        className
      )}
      {...props}
    />
    <div className="absolute inset-x-5 top-[calc(100%-10px)] h-px bg-gradient-to-r from-transparent via-aurora-400/30 to-transparent" />
  </div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

function CommandShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'ml-auto flex h-5 items-center rounded-md border border-midnight-500 px-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-shadow-300',
        className
      )}
      {...props}
    />
  );
}
CommandShortcut.displayName = 'CommandShortcut';

export {
  Command,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandSeparator,
  CommandItem,
  CommandInput,
  CommandShortcut,
};

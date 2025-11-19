/**
 * @file frontend/src/components/ui/menubar.tsx
 * @note Update README.md in this directory when modifying component behavior or props
 */

import * as React from 'react';
import * as MenubarPrimitive from '@radix-ui/react-menubar';

import cn from '@/lib/utils';

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      'flex h-10 items-center space-x-1 rounded-md border border-midnight-500/70 bg-midnight-500/60 p-1 text-shadow-50 shadow-sm backdrop-blur',
      className
    )}
    {...props}
  />
));
Menubar.displayName = MenubarPrimitive.Root.displayName;

const MenubarMenu = MenubarPrimitive.Menu;

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex cursor-default select-none items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-shadow-100 transition-colors hover:bg-midnight-400/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-midnight-900 data-[state=open]:bg-midnight-400/90',
      className
    )}
    {...props}
  />
));
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName;

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(({ className, align = 'start', sideOffset = 8, ...props }, ref) => (
  <MenubarPrimitive.Portal>
    <MenubarPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[12rem] rounded-lg border border-midnight-500/70 bg-midnight-600/90 p-1 shadow-[0_16px_32px_rgba(4,7,12,0.45)] backdrop-blur-md',
        className
      )}
      {...props}
    />
  </MenubarPrimitive.Portal>
));
MenubarContent.displayName = MenubarPrimitive.Content.displayName;

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-md px-3 py-2 text-sm text-shadow-100 transition-colors hover:bg-midnight-500/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300/40',
      className
    )}
    {...props}
  />
));
MenubarItem.displayName = MenubarPrimitive.Item.displayName;

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator ref={ref} className={cn('my-1 h-px bg-midnight-400/60', className)} {...props} />
));
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;

function MenubarShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('ml-auto text-xs tracking-[0.3em] text-shadow-400/80', className)} {...props} />;
}
MenubarShortcut.displayName = 'MenubarShortcut';

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-md px-3 py-2 text-sm text-shadow-100 transition-colors hover:bg-midnight-500/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300/40 data-[state=checked]:bg-midnight-500/80',
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-3 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <svg width="15" height="15" viewBox="0 0 15 15" className="text-aurora-200" aria-hidden>
          <path
            d="M11.466 3.899a.4.4 0 0 1 0 .566l-5.25 5.25a.4.4 0 0 1-.566 0l-2.4-2.4a.4.4 0 0 1 .566-.566L5.9 8.584l4.966-4.965a.4.4 0 0 1 .566 0Z"
            fill="currentColor"
          />
        </svg>
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
));
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName;

const MenubarRadioGroup = MenubarPrimitive.RadioGroup;

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-md px-3 py-2 text-sm text-shadow-100 transition-colors hover:bg-midnight-500/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300/40 data-[state=checked]:bg-midnight-500/80',
      className
    )}
    {...props}
  >
    <span className="absolute left-3 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <span className="h-1.5 w-1.5 rounded-full bg-aurora-200" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
));
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName;

const MenubarSub = MenubarPrimitive.Sub;
const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'flex cursor-default select-none items-center rounded-md px-3 py-2 text-sm text-shadow-100 transition-colors hover:bg-midnight-500/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300/40 data-[state=open]:bg-midnight-500/80',
      className
    )}
    {...props}
  />
));
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName;

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      'z-50 min-w-[12rem] rounded-lg border border-midnight-500/70 bg-midnight-600/90 p-1 shadow-[0_16px_32px_rgba(4,7,12,0.45)] backdrop-blur-md',
      className
    )}
    {...props}
  />
));
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName;

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
};

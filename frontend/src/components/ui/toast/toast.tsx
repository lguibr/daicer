import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import cn from '../../../lib/utils';

export const ToastProvider = ToastPrimitives.Provider;

export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed top-4 right-4 z-[100] flex max-h-screen w-full max-w-sm flex-col gap-3 outline-none',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  cn(
    'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden',
    'rounded-2xl border p-4 pr-6 shadow-2xl transition-all',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-80 data-[state=open]:fade-in-90',
    'data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full'
  ),
  {
    variants: {
      variant: {
        default: 'border-white/10 bg-slate-950/90 text-white',
        success: 'border-emerald-500/30 bg-emerald-950/90 text-emerald-50',
        destructive: 'border-red-500/40 bg-red-950/90 text-red-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface CustomToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>, VariantProps<typeof toastVariants> {}

export const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Root>, CustomToastProps>(
  ({ className, variant, ...props }, ref) => (
    <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />
  )
);
Toast.displayName = ToastPrimitives.Root.displayName;

export const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex shrink-0 items-center justify-center rounded-full border px-4 py-1 text-sm font-semibold text-white transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
      'hover:bg-white/10',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

export const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-3 top-3 rounded-full p-1 text-slate-200 transition-opacity hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

export const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

export const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description ref={ref} className={cn('text-sm opacity-90', className)} {...props} />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export type ToastProps = React.ComponentProps<typeof Toast>;
export type ToastActionElement = React.ReactElement<typeof ToastAction>;

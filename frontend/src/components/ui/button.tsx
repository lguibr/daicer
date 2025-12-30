/**
 * @file frontend/src/components/ui/button.tsx
 * @note Update README.md in this directory when modifying component behavior or props
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import cn from '@/lib/utils';
import { buttonVariants, type ButtonVariantProps } from './button-variants';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantProps {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button };

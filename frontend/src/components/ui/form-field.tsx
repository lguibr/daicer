/**
 * FormField Component
 * Normalized form field wrapper with label, error, and description
 */

import { type ReactNode } from 'react';
import Label from './label';

interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, description, error, required, children, className }: FormFieldProps) {
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={htmlFor} className="text-shadow-200">
          {label}
          {required && <span className="ml-1 text-accent">*</span>}
        </Label>
      )}
      {description && <p className="mt-1 text-xs text-shadow-400">{description}</p>}
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

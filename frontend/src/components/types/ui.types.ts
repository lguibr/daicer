/**
 * UI component type definitions
 */

/**
 * Button variant types
 */
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

/**
 * Button size types
 */
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

/**
 * Card variant types
 */
export type CardVariant = 'default' | 'elevated' | 'outlined';

/**
 * Input types
 */
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';

/**
 * Input size types
 */
export type InputSize = 'sm' | 'default' | 'lg';

/**
 * Select option interface
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * @file frontend/src/components/types/common.types.ts
 * @description Common component prop types shared across all components
 */

import type { ReactNode } from 'react';

/**
 * Base props that most components accept
 */
export interface BaseComponentProps {
  /** Additional CSS classes */
  className?: string;
  /** Component children */
  children?: ReactNode;
}

/**
 * Props for components with click handlers
 */
export interface ClickableProps {
  /** Click handler */
  onClick?: () => void;
  /** Whether the component is disabled */
  disabled?: boolean;
}

/**
 * Props for components with loading states
 */
export interface LoadingProps {
  /** Whether the component is in a loading state */
  loading?: boolean;
}

/**
 * Props for components with error states
 */
export interface ErrorProps {
  /** Error message to display */
  error?: string | null;
}

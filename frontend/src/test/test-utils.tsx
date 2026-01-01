/**
 * @file frontend/src/test/test-utils.tsx
 * @description Custom render utilities for tests with providers
 */
/* eslint-disable react-refresh/only-export-components */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { I18nProvider } from '../i18n';

interface AllTheProvidersProps {
  children: ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  return <I18nProvider>{children}</I18nProvider>;
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

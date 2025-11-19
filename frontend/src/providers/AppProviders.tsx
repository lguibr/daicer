import type { ReactNode } from 'react';

import { I18nProvider } from '../i18n';
import { Toaster } from '../components/ui/sonner';
import { RoleProvider } from '../contexts/RoleContext';

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <I18nProvider>
      <RoleProvider>
        {children}
        <Toaster />
      </RoleProvider>
    </I18nProvider>
  );
}

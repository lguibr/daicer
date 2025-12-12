import type { ReactNode } from 'react';

import { ApolloProvider } from '@apollo/client/react';
import { I18nProvider } from '../i18n';
import { Toaster } from '../components/ui/sonner';
import { RoleProvider } from '../contexts/RoleContext';

import { apolloClient } from '../lib/apollo';

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <ApolloProvider client={apolloClient}>
      <I18nProvider>
        <RoleProvider>
          {children}
          <Toaster />
        </RoleProvider>
      </I18nProvider>
    </ApolloProvider>
  );
}

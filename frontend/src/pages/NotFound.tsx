import { useCallback } from 'react';
import { toast } from 'sonner';

import { useI18n } from '../i18n';
import { StatusPageLayout } from './status/StatusPageLayout';

export default function NotFoundPage() {
  const { t } = useI18n();

  const handleCopyPath = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const payload = window.location.href;
    const fallbackPath = window.location.pathname || '/';

    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        throw new Error('clipboard-unavailable');
      }
      await navigator.clipboard.writeText(payload);
      const descriptionTemplate = t('statusPages.notFound.toastDescription');
      const description = descriptionTemplate.replace('{path}', fallbackPath);
      toast.success(t('statusPages.notFound.toastTitle'), {
        description,
      });
    } catch {
      toast.error(t('statusPages.generic.toastErrorTitle'), {
        description: t('statusPages.generic.toastErrorDescription'),
      });
    }
  }, [t]);

  return (
    <StatusPageLayout
      statusCode="404"
      titleKey="statusPages.notFound.title"
      descriptionKey="statusPages.notFound.description"
      helperTextKey="statusPages.notFound.helper"
      primaryAction={{
        labelKey: 'statusPages.notFound.primaryCta',
        to: '/',
      }}
      secondaryAction={{
        labelKey: 'statusPages.notFound.secondaryCta',
        onClick: handleCopyPath,
      }}
    />
  );
}

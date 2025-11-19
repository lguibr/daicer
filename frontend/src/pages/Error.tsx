import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import { useI18n } from '../i18n';
import { StatusPageLayout } from './status/StatusPageLayout';

function generateIncidentId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().split('-')[0]?.toUpperCase() ?? 'DAICER';
  }
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export default function ErrorPage() {
  const { t } = useI18n();
  const incidentId = useMemo(() => generateIncidentId(), []);
  const timestamp = useMemo(() => new Date().toISOString(), []);

  const handleReload = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.location.reload();
  }, []);

  const handleCopyIncident = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        throw new Error('clipboard-unavailable');
      }
      await navigator.clipboard.writeText(`${incidentId} • ${timestamp}`);
      const descriptionTemplate = t('statusPages.error.toastDescription');
      const description = descriptionTemplate.replace('{incidentId}', incidentId);
      toast.success(t('statusPages.error.toastTitle'), {
        description,
      });
    } catch {
      toast.error(t('statusPages.generic.toastErrorTitle'), {
        description: t('statusPages.generic.toastErrorDescription'),
      });
    }
  }, [incidentId, timestamp, t]);

  return (
    <StatusPageLayout
      statusCode="500"
      eyebrowKey="statusPages.error.eyebrow"
      titleKey="statusPages.error.title"
      descriptionKey="statusPages.error.description"
      helperTextKey="statusPages.error.helper"
      primaryAction={{
        labelKey: 'statusPages.error.primaryCta',
        onClick: handleReload,
      }}
      secondaryAction={{
        labelKey: 'statusPages.error.secondaryCta',
        onClick: handleCopyIncident,
      }}
    >
      <dl className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-400">{t('statusPages.error.incident')}</dt>
          <dd className="font-semibold text-white">{incidentId}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-400">{t('statusPages.error.timestamp')}</dt>
          <dd className="font-mono text-sm text-slate-200">{timestamp}</dd>
        </div>
      </dl>
    </StatusPageLayout>
  );
}

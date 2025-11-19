import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { DiceLoader } from '../../components/ui/dice-loader/DiceLoader';
import { DiceRollAnimation } from '../../components/ui/dice-roll-animation/DiceRollAnimation';
import { Button, type ButtonProps } from '../../components/ui/button';
import { useI18n } from '../../i18n';
import cn from '../../lib/utils';
import { useStatusDice } from './useStatusDice';

interface StatusPageAction {
  labelKey: string;
  to?: string;
  href?: string;
  onClick?: () => void;
  variant?: ButtonProps['variant'];
  target?: '_blank' | '_self';
  rel?: string;
}

interface StatusPageLayoutProps {
  statusCode: string;
  eyebrowKey?: string;
  titleKey: string;
  descriptionKey: string;
  helperTextKey?: string;
  loaderMessageKey?: string;
  primaryAction: StatusPageAction;
  secondaryAction?: StatusPageAction;
  children?: ReactNode;
}

function StatusActionButton({
  action,
  defaultVariant,
  label,
}: {
  action: StatusPageAction;
  defaultVariant: ButtonProps['variant'];
  label: string;
}) {
  const { href, target, rel, onClick, variant } = action;
  if (action.to) {
    return (
      <Button asChild size="lg" variant={variant ?? defaultVariant} onClick={onClick} className="min-w-[150px]">
        <Link to={action.to}>{label}</Link>
      </Button>
    );
  }
  if (href) {
    return (
      <Button asChild size="lg" variant={variant ?? defaultVariant} onClick={onClick} className="min-w-[150px]">
        <a href={href} target={target} rel={rel}>
          {label}
        </a>
      </Button>
    );
  }
  return (
    <Button size="lg" variant={variant ?? defaultVariant} onClick={onClick} className="min-w-[150px]">
      {label}
    </Button>
  );
}

export function StatusPageLayout({
  statusCode,
  eyebrowKey = 'statusPages.generic.eyebrow',
  titleKey,
  descriptionKey,
  helperTextKey,
  loaderMessageKey = 'statusPages.generic.loader',
  primaryAction,
  secondaryAction,
  children,
}: StatusPageLayoutProps) {
  const { t } = useI18n();
  const { dice, showLoader, showResult } = useStatusDice(statusCode);

  const eyebrow = t(eyebrowKey);
  const title = t(titleKey);
  const description = t(descriptionKey);
  const helperText = helperTextKey ? t(helperTextKey) : null;
  const loaderMessage = loaderMessageKey ? t(loaderMessageKey) : undefined;
  const primaryLabel = t(primaryAction.labelKey);
  const secondaryLabel = secondaryAction ? t(secondaryAction.labelKey) : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.2),_transparent_55%)] opacity-80" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(168,85,247,0.18),_transparent_60%)]" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center lg:gap-16 lg:py-28">
        <div className="flex-1 space-y-6">
          <span className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
            <span>{statusCode}</span>
            <span className="h-1 w-1 rounded-full bg-white/60" />
            <span>{eyebrow}</span>
          </span>

          <div className="space-y-4">
            <h1 className="text-4xl font-black leading-tight text-white lg:text-6xl">{title}</h1>
            <p className="text-lg text-slate-300 lg:text-xl">{description}</p>
            {helperText ? <p className="text-sm text-slate-400">{helperText}</p> : null}
          </div>

          <div className="flex flex-wrap gap-4">
            <StatusActionButton action={primaryAction} defaultVariant="default" label={primaryLabel} />
            {secondaryAction && secondaryLabel ? (
              <StatusActionButton action={secondaryAction} defaultVariant="outline" label={secondaryLabel} />
            ) : null}
          </div>

          {children ? <div className="space-y-4 text-sm text-slate-300">{children}</div> : null}
        </div>

        <div className="flex-1">
          <div
            className={cn(
              'relative rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-950/80',
              'p-8 shadow-[0_0_120px_rgba(14,116,144,0.35)]'
            )}
          >
            <div className="absolute right-10 top-[-14px] rounded-full border border-white/20 bg-slate-950 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-slate-200">
              {statusCode}
            </div>
            <div className="flex h-[360px] items-center justify-center">
              {showLoader ? (
                <DiceLoader size="large" message={loaderMessage} />
              ) : (
                <DiceRollAnimation dice={dice} size="large" colorByResult={false} autoStart showAxes={false} />
              )}
            </div>
            <div className="mt-6 space-y-2 text-center text-sm text-slate-400">
              <p>{t('statusPages.generic.prompt')}</p>
              {showResult ? (
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{t('statusPages.generic.ready')}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

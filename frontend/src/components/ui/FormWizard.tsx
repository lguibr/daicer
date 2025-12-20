import { createContext, useContext, useState, ReactNode } from 'react';
import { Check } from 'lucide-react';
import cn from '@/lib/utils';
import { Button } from './button';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface FormWizardContextValue {
  currentStepIndex: number;
  steps: Step[];
  goToStep: (index: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext: boolean;
  setCanGoNext: (can: boolean) => void;
}

const FormWizardContext = createContext<FormWizardContextValue | undefined>(undefined);

function useFormWizard() {
  const context = useContext(FormWizardContext);
  if (!context) {
    throw new Error('useFormWizard must be used within a FormWizard component');
  }
  return context;
}

interface FormWizardProps {
  steps: Step[];
  children: ReactNode;
  onComplete?: () => void;
  onStepChange?: (stepIndex: number) => void;
  className?: string;
}

function FormWizard({ steps, children, onComplete, onStepChange, className }: FormWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [canGoNext, setCanGoNext] = useState(true);

  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
      onStepChange?.(index);
    }
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      goToStep(currentStepIndex + 1);
    } else if (currentStepIndex === steps.length - 1 && onComplete) {
      onComplete();
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  };

  const value: FormWizardContextValue = {
    currentStepIndex,
    steps,
    goToStep,
    nextStep,
    previousStep,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === steps.length - 1,
    canGoNext,
    setCanGoNext,
  };

  return (
    <FormWizardContext.Provider value={value}>
      <div className={cn('flex flex-col gap-8', className)}>{children}</div>
    </FormWizardContext.Provider>
  );
}

interface FormWizardStepsProps {
  className?: string;
}

function FormWizardSteps({ className }: FormWizardStepsProps) {
  const { steps, currentStepIndex, goToStep } = useFormWizard();
  const currentStep = steps[currentStepIndex];

  return (
    <div className={cn('space-y-3', className)}>
      <nav aria-label="Progress" className="relative overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        {/* fade masks for scroll edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background via-background/60 to-transparent" />

        <ol className="flex min-w-max items-center gap-2 px-6 md:gap-4 md:px-0">
          {steps.map((step, index) => {
            const isComplete = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isFuture = index > currentStepIndex;

            return (
              <li key={step.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => (isFuture ? null : goToStep(index))}
                  disabled={isFuture}
                  className={cn(
                    'group flex items-center gap-3 transition-all',
                    (isComplete || isCurrent) && 'cursor-pointer',
                    isFuture && 'cursor-not-allowed opacity-40'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-full border-[3px] text-sm font-semibold transition-all md:h-12 md:w-12',
                      isComplete &&
                        'border-aurora-400 bg-aurora-500/20 text-aurora-100 group-hover:scale-110 group-hover:border-aurora-300 group-hover:bg-aurora-500/30',
                      isCurrent &&
                        'border-aurora-300 bg-aurora-500/30 text-aurora-50 ring-4 ring-aurora-500/20 shadow-[0_8px_24px_rgba(29,143,242,0.25)]',
                      isFuture && 'border-midnight-600 bg-midnight-700/70 text-shadow-400'
                    )}
                  >
                    {isComplete ? <Check className="h-5 w-5" /> : index + 1}
                  </div>
                  {/* desktop labels */}
                  <div className="hidden flex-col items-start md:flex">
                    <span
                      className={cn(
                        'font-display text-sm font-bold uppercase tracking-wider transition-colors',
                        isComplete && 'text-shadow-200 group-hover:text-aurora-200',
                        isCurrent && 'text-aurora-100 text-shadow-glow',
                        isFuture && 'text-shadow-500'
                      )}
                    >
                      {step.title}
                    </span>
                    {step.description && (
                      <span className="text-xs text-shadow-400 opacity-60 mix-blend-plus-lighter">
                        {step.description}
                      </span>
                    )}
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'mx-1 h-px w-6 transition-colors md:mx-2 md:h-0.5 md:w-10',
                      index < currentStepIndex ? 'bg-aurora-400/50' : 'bg-midnight-700'
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* mobile current step label */}
      {currentStep && (
        <div className="px-2 text-center md:hidden">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-shadow-400">{currentStep.title}</p>
          {currentStep.description && (
            <p className="mt-1 text-[11px] leading-snug text-shadow-500">{currentStep.description}</p>
          )}
        </div>
      )}
    </div>
  );
}

interface FormWizardContentProps {
  children: ReactNode;
  className?: string;
}

function FormWizardContent({ children, className }: FormWizardContentProps) {
  return <div className={cn('flex-1', className)}>{children}</div>;
}

interface FormWizardStepProps {
  step: string;
  children: ReactNode;
}

function FormWizardStep({ step, children }: FormWizardStepProps) {
  const { steps, currentStepIndex } = useFormWizard();
  const stepIndex = steps.findIndex((s) => s.id === step);

  if (stepIndex !== currentStepIndex) {
    return null;
  }

  return <div className="animate-in fade-in duration-300">{children}</div>;
}

interface FormWizardActionsProps {
  className?: string;
  previousLabel?: string;
  nextLabel?: string;
  completeLabel?: string;
  showPrevious?: boolean;
  showNext?: boolean;
  onNext?: () => void | Promise<void>;
  onPrevious?: () => void;
}

function FormWizardActions({
  className,
  previousLabel = 'Previous',
  nextLabel = 'Next',
  completeLabel = 'Complete',
  showPrevious = true,
  showNext = true,
  onNext,
  onPrevious,
}: FormWizardActionsProps) {
  const { nextStep, previousStep, isFirstStep, isLastStep, canGoNext } = useFormWizard();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNext = async () => {
    if (onNext) {
      setIsProcessing(true);
      try {
        await onNext();
        nextStep();
      } finally {
        setIsProcessing(false);
      }
    } else {
      nextStep();
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    }
    previousStep();
  };

  return (
    <div
      className={cn(
        'mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
        className
      )}
    >
      {showPrevious && (
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep || isProcessing}
          className="w-full min-w-[140px] border-midnight-600 bg-midnight-900/50 text-shadow-300 hover:bg-midnight-800 hover:text-white font-semibold sm:w-auto hover:border-aurora-500/30"
          size="lg"
          data-testid="wizard-back-btn"
        >
          {previousLabel}
        </Button>
      )}
      <div className="hidden flex-1 sm:block" />
      {showNext && (
        <Button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext || isProcessing}
          className="w-full min-w-[140px] border border-aurora-400/50 bg-gradient-to-br from-aurora-600 to-aurora-700 font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(211,143,31,0.3)] hover:from-aurora-500 hover:to-aurora-600 hover:shadow-[0_0_30px_rgba(211,143,31,0.5)] sm:w-auto transition-all transform hover:-translate-y-0.5"
          size="lg"
          data-testid={isLastStep ? 'wizard-complete-btn' : 'wizard-next-btn'}
        >
          {isProcessing ? 'Processing...' : isLastStep ? completeLabel : nextLabel}
        </Button>
      )}
    </div>
  );
}

export { FormWizard, FormWizardSteps, FormWizardContent, FormWizardStep, FormWizardActions, useFormWizard };
export type { Step };

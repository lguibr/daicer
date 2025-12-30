import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import clsx from 'clsx';
import { WizardProvider } from '../context/WizardContext';
// import { StepsHeader } from '../components/StepsHeader'; // We will create this or inline it
import PrivateLayout from '../../../components/layout/PrivateLayout';

const STEPS = [
  { path: 'dm-settings', label: 'DM & Scope' },
  { path: 'world-generation', label: 'World Config' },
  // { path: 'finalize', label: 'Review' }, // Optional, maybe just submit from world-gen?
];

export default function CreateRoomLayout() {
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop();
  const currentStepIndex = STEPS.findIndex((s) => s.path === currentPath);

  // If we are exactly at /create, redirect to first step
  if (location.pathname === '/create' || location.pathname === '/create/') {
    return <Navigate to={{ pathname: 'dm-settings', search: location.search }} replace />;
  }

  return (
    <PrivateLayout showNavbar>
      <WizardProvider>
        <div className="relative mx-auto min-h-screen max-w-6xl px-6 py-16 sm:px-10 lg:px-12">
          <header className="space-y-3 text-center mb-10">
            <p className="text-xs uppercase tracking-[0.45em] text-shadow-500">Room Creation Wizard</p>
            <h1 className="font-display text-3xl uppercase tracking-[0.4em] text-aurora-300 sm:text-4xl">
              Create Your Campaign
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-shadow-300">Configure your AI Dungeon Master and world</p>
          </header>

          {/* Progress Navigation */}
          <div className="rounded-2xl border border-midnight-500/60 bg-midnight-500/30 p-5 sm:p-6 mb-10">
            <nav aria-label="Wizard steps" className="flex flex-col gap-4">
              <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {STEPS.map((step, index) => {
                  const isActive = currentPath === step.path;
                  const isCompleted = index < currentStepIndex || (currentStepIndex === -1 && index === 0); // rough logic

                  return (
                    <li key={step.path}>
                      <Link
                        to={{ pathname: step.path, search: location.search }}
                        className={clsx(
                          'flex w-full flex-col gap-2 rounded-xl border px-4 py-3 text-left transition-all duration-200',
                          isActive &&
                            'border-accent/60 bg-gradient-to-br from-accent/15 via-nebula-500/25 to-midnight-700/40 text-accent',
                          !isActive &&
                            isCompleted &&
                            'border-aurora-500/60 bg-aurora-500/10 text-aurora-200 hover:border-aurora-400/70',
                          !isActive &&
                            !isCompleted &&
                            'border-midnight-500/60 bg-midnight-500/20 text-shadow-400 opacity-60'
                        )}
                      >
                        <span className="text-xs font-semibold uppercase tracking-[0.35em]">{step.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          <Outlet />
        </div>
      </WizardProvider>
    </PrivateLayout>
  );
}

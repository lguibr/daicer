import { useState } from 'react';
import { ChevronDown, ChevronRight, Activity, Swords } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// Types from Engine (Manual copy to ensure stability if import fails)
export interface ExecutionStep {
  type: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Allow relaxed access for UI component
}

// ExecutionTrace is an array of steps in engine
export type ExecutionTrace = ExecutionStep[];

interface TraceEventCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: any; // GameEvent
}

export default function TraceEventCard({ event }: TraceEventCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Safely extract trace
  // Safely extract trace steps
  const trace = event.payload?.trace;
  const steps = Array.isArray(trace) ? trace : trace?.steps;

  if (!steps || steps.length === 0) return null;

  const isAttack = event.type === 'ATTACK_RESULT';
  const outcome = event.payload?.outcome;
  const isHit = outcome === 'hit' || outcome === 'crit';

  return (
    <div className="w-full max-w-md my-2 select-none">
      <div
        onClick={() => setExpanded(!expanded)}
        className={clsx(
          'rounded-xl border p-3 cursor-pointer transition-all duration-200 overflow-hidden',
          isAttack
            ? isHit
              ? 'bg-red-950/20 border-red-900/50 hover:border-red-500/50'
              : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
            : 'bg-midnight-900 border-midnight-700 hover:border-aurora-500/50'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center shadow-inner',
                isAttack ? 'bg-red-500/10 text-red-500' : 'bg-aurora-500/10 text-aurora-400'
              )}
            >
              {isAttack ? <Swords className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-sm font-bold text-shadow-100 flex items-center gap-2">
                {isAttack ? 'Attack Action' : 'Game Event'}
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40 text-shadow-400">
                  {event.type}
                </span>
              </div>
              <div className="text-xs text-shadow-400">
                {isAttack ? (
                  <>
                    Result:{' '}
                    <span className={isHit ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                      {outcome?.toUpperCase()}
                    </span>
                  </>
                ) : (
                  'Details available'
                )}
              </div>
            </div>
          </div>

          <div className="text-shadow-500">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </div>

        {/* Expanded Content: The Trace */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                {steps.map((step: ExecutionStep, idx: number) => (
                  <div key={idx} className="text-xs bg-black/20 rounded p-2 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1 h-1 rounded-full bg-aurora-500/50" />
                      <span className="font-semibold text-aurora-200">{step.description}</span>
                    </div>

                    {/* Render Step Data pretty-printed */}
                    {step.type === 'roll_to_hit' && step.data && (
                      <div className="pl-3 font-mono text-shadow-300">
                        <div>
                          Die Roll: <span className="text-white">{step.data.roll}</span>
                        </div>
                        <div>
                          Total: <span className="text-yellow-400 font-bold">{step.data.total}</span> vs AC{' '}
                          {step.data.targetAc}
                        </div>
                      </div>
                    )}

                    {step.type === 'roll_damage' && step.data && (
                      <div className="pl-3 font-mono text-shadow-300">
                        <div className="text-red-300">
                          Damage: {step.data.total} ({step.data.type})
                        </div>
                      </div>
                    )}

                    {/* Fallback for other steps */}
                    {!['roll_to_hit', 'roll_damage'].includes(step.type) && step.data && (
                      <pre className="pl-3 text-[10px] text-zinc-500 overflow-x-auto">
                        {JSON.stringify(step.data, null, 1).replace(/[{}"]/g, '')}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

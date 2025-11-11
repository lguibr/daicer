import { useEffect, useMemo, useState } from 'react';
import { Play, Pause, StepForward, StepBack, RotateCcw, Loader2 } from 'lucide-react';
import { PrivateLayout } from '../components/layout';
import { CombatGrid } from '../components/combat/CombatGrid';
import { CharacterCard } from '../components/combat/CharacterCard';
import { CombatLog } from '../components/combat/CombatLog';
import type { CombatSimulation, CombatSimulationSummary } from '../types/combat-sim';
import { fetchCombatSimulation, fetchCombatSimulationSummaries } from '../services/simulations';
import type { CombatCharacter, CombatState } from '../hooks/useCombat';

const AUTO_PLAY_INTERVAL_MS = 2000;

export default function CombatDemoPage() {
  const [scenarios, setScenarios] = useState<CombatSimulationSummary[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<CombatSimulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadScenarios = async () => {
      try {
        setListError(null);
        const data = await fetchCombatSimulationSummaries();
        if (cancelled) return;
        setScenarios(data);
        if (!selectedScenarioId) {
          const [firstScenario] = data;
          if (firstScenario) {
            setSelectedScenarioId(firstScenario.id);
          }
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load combat scenarios';
        setListError(message);
      }
    };

    loadScenarios();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedScenarioId) return;

    let cancelled = false;

    const loadSimulation = async () => {
      try {
        setLoading(true);
        setError(null);
        setSimulation(null);
        setStepIndex(0);
        setIsPlaying(false);
        const data = await fetchCombatSimulation(selectedScenarioId);
        if (cancelled) return;
        setSimulation(data);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load combat simulation';
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSimulation();

    return () => {
      cancelled = true;
    };
  }, [selectedScenarioId]);

  useEffect(() => {
    if (!isPlaying || !simulation) return () => undefined;

    const handle = window.setInterval(() => {
      setStepIndex((prev) => {
        const next = prev + 1;
        if (next >= simulation.steps.length) {
          window.clearInterval(handle);
          setIsPlaying(false);
          return prev;
        }
        return next;
      });
    }, AUTO_PLAY_INTERVAL_MS);

    return () => {
      window.clearInterval(handle);
    };
  }, [isPlaying, simulation]);

  const currentStep =
    simulation && simulation.steps.length > 0
      ? simulation.steps[Math.min(stepIndex, simulation.steps.length - 1)]
      : null;
  const currentState: CombatState | null = currentStep?.state ?? simulation?.finalState ?? null;

  const activeScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? null,
    [scenarios, selectedScenarioId]
  );

  const playerCharacters: CombatCharacter[] = useMemo(
    () => (currentState ? currentState.characters.filter((c) => c.isPlayer) : []),
    [currentState]
  );

  const enemyCharacters: CombatCharacter[] = useMemo(
    () => (currentState ? currentState.characters.filter((c) => !c.isPlayer) : []),
    [currentState]
  );

  const activeCharacter = currentState
    ? (currentState.characters.find((c) => c.id === currentState.activeCharacterId) ?? null)
    : null;

  const totalSteps = simulation?.steps.length ?? 0;

  const clampStep = (value: number): number => {
    if (!simulation) return 0;
    return Math.max(0, Math.min(value, simulation.steps.length - 1));
  };

  const goToStep = (value: number) => {
    setStepIndex(clampStep(value));
  };

  const handlePlayPause = () => {
    if (!simulation) return;

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (stepIndex >= simulation.steps.length - 1) {
      setStepIndex(0);
    }

    setIsPlaying(true);
  };

  const handleStepForward = () => {
    if (!simulation) return;
    setIsPlaying(false);
    setStepIndex((prev) => clampStep(prev + 1));
  };

  const handleStepBack = () => {
    if (!simulation) return;
    setIsPlaying(false);
    setStepIndex((prev) => clampStep(prev - 1));
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setStepIndex(0);
  };

  const handleSelectScenario = (scenarioId: string) => {
    if (scenarioId === selectedScenarioId) return;
    setSelectedScenarioId(scenarioId);
  };

  return (
    <PrivateLayout showRoomInfo={false}>
      <div className="min-h-screen bg-midnight-900 py-12 px-6 sm:px-10 lg:px-12 text-shadow-50">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="space-y-2">
            <div className="flex items-center gap-3 text-aurora-300">
              <span className="text-3xl">🎯</span>
              <div>
                <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-[0.35em]">
                  Combat Simulation Demo
                </h1>
                <p className="text-sm text-shadow-300">
                  Deterministic combat walkthrough showcasing the tactical engine without LLM input.
                </p>
              </div>
            </div>

            {activeScenario && (
              <div className="flex flex-wrap items-center gap-4 text-sm text-shadow-200">
                <span className="font-semibold text-aurora-200">{activeScenario.title}</span>
                <span className="text-shadow-300">Focus: {activeScenario.focus}</span>
              </div>
            )}
          </header>

          {listError && (
            <div className="rounded-lg border border-red-500/50 bg-red-900/40 p-6 text-red-200">
              <h2 className="text-xl font-semibold mb-2">Failed to load scenario list</h2>
              <p className="text-sm">{listError}</p>
            </div>
          )}

          {scenarios.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-shadow-400">Scenario Selection</h2>
              <div className="grid gap-3 md:grid-cols-3">
                {scenarios.map((scenario) => {
                  const isActive = scenario.id === selectedScenarioId;
                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() => handleSelectScenario(scenario.id)}
                      className={`text-left rounded-xl border p-4 transition ${
                        isActive
                          ? 'border-aurora-500 bg-aurora-500/20 text-aurora-50 shadow-lg'
                          : 'border-shadow-700 bg-midnight-400/40 hover:border-aurora-400 hover:bg-midnight-300/50'
                      }`}
                    >
                      <div className="text-sm font-bold uppercase tracking-[0.25em] text-shadow-200">
                        {scenario.title}
                      </div>
                      <div className="mt-2 text-xs text-shadow-300">{scenario.focus}</div>
                      <div className="mt-3 text-xs text-shadow-400 leading-relaxed">{scenario.description}</div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="flex items-center gap-3 text-shadow-200">
                <Loader2 className="h-6 w-6 animate-spin text-aurora-300" />
                <span>Loading combat simulation...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-900/40 p-6 text-red-200">
              <h2 className="text-xl font-semibold mb-2">Failed to load simulation</h2>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && simulation && currentState && (
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr] items-start">
              <div className="space-y-6">
                <section className="flex flex-wrap items-center gap-3 bg-midnight-400/40 border border-shadow-800 rounded-lg p-4">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-shadow-800 hover:bg-shadow-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={handleRestart}
                    disabled={stepIndex === 0}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restart
                  </button>
                  <div className="h-6 w-px bg-shadow-700" />
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-shadow-800 hover:bg-shadow-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={handleStepBack}
                    disabled={stepIndex === 0}
                    aria-label="Previous step"
                  >
                    <StepBack className="h-4 w-4" />
                    Prev
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-nebula-700 hover:bg-nebula-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={handlePlayPause}
                    disabled={simulation.steps.length === 0}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Play
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-shadow-800 hover:bg-shadow-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={handleStepForward}
                    disabled={stepIndex >= simulation.steps.length - 1}
                    aria-label="Next step"
                  >
                    <StepForward className="h-4 w-4" />
                    Next
                  </button>
                  <div className="h-6 w-px bg-shadow-700" />
                  <div className="text-sm text-shadow-200">
                    Step {stepIndex + 1} / {totalSteps} • Round {currentState.round}{' '}
                    {activeCharacter ? `• ${activeCharacter.name}'s turn` : ''}
                  </div>
                </section>

                <section className="bg-midnight-400/30 border border-shadow-800 rounded-lg p-4">
                  <label
                    htmlFor="step-slider"
                    className="block text-xs uppercase tracking-[0.35em] text-shadow-400 mb-3"
                  >
                    Timeline
                  </label>
                  <input
                    id="step-slider"
                    type="range"
                    min={0}
                    max={Math.max(0, simulation.steps.length - 1)}
                    value={stepIndex}
                    onChange={(e) => goToStep(Number.parseInt(e.target.value, 10))}
                    className="w-full accent-aurora-400"
                  />
                  <div className="mt-2 text-sm text-shadow-200">
                    {currentStep ? currentStep.description : 'Final state'}
                  </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-12">
                  <div className="space-y-3 lg:col-span-3">
                    <h3 className="text-sm font-bold text-shadow-300 uppercase tracking-[0.3em]">Players</h3>
                    <div className="space-y-2">
                      {playerCharacters.map((char) => (
                        <CharacterCard
                          key={char.id}
                          character={char}
                          isActive={char.id === currentState.activeCharacterId}
                          isSelected={false}
                          onClick={() => {}}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-6">
                    <div className="bg-midnight-400/30 border border-shadow-800 rounded-lg p-4">
                      <div className="text-sm text-shadow-200 mb-3">
                        Visualizing deterministic grid state at step {stepIndex + 1}
                      </div>
                      <CombatGrid
                        characters={currentState.characters}
                        gridWidth={currentState.gridWidth}
                        gridHeight={currentState.gridHeight}
                        activeCharacterId={currentState.activeCharacterId}
                        selectedCharacterId={null}
                        reachableSquares={[]}
                        onSquareClick={() => {}}
                        onCharacterClick={() => {}}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 lg:col-span-3">
                    <h3 className="text-sm font-bold text-shadow-300 uppercase tracking-[0.3em]">Enemies</h3>
                    <div className="space-y-2">
                      {enemyCharacters.map((char) => (
                        <CharacterCard
                          key={char.id}
                          character={char}
                          isActive={char.id === currentState.activeCharacterId}
                          isSelected={false}
                          onClick={() => {}}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-4 lg:sticky lg:top-6">
                <CombatLog log={currentState.log} diceHistory={currentState.diceHistory} />

                <section className="bg-midnight-400/30 border border-shadow-800 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-bold text-shadow-300 uppercase tracking-[0.3em]">Timeline Overview</h3>
                  <div className="max-h-[360px] overflow-y-auto pr-1 text-sm space-y-2">
                    {simulation.steps.map((step, idx) => (
                      <button
                        key={step.index}
                        type="button"
                        className={`w-full text-left px-3 py-2 rounded-md transition ${
                          idx === stepIndex
                            ? 'bg-nebula-700 text-white'
                            : 'bg-shadow-800/40 text-shadow-200 hover:bg-shadow-800/60'
                        }`}
                        onClick={() => {
                          setIsPlaying(false);
                          goToStep(idx);
                        }}
                      >
                        <div className="text-xs font-semibold text-shadow-300 mb-1">Step {idx + 1}</div>
                        <div>{step.description}</div>
                      </button>
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          )}
        </div>
      </div>
    </PrivateLayout>
  );
}

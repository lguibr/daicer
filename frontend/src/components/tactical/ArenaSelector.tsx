/**
 * @file frontend/src/components/tactical/ArenaSelector.tsx
 * @description Arena picker using SpotlightCarousel with combobox quick select
 */

import { useCallback, useMemo } from 'react';
import { Map } from 'lucide-react';

import type { ArenaInfo } from './types';
import { SpotlightCarousel } from '../ui/spotlight-carousel/SpotlightCarousel';
import { Combobox, type ComboboxOption } from '../ui';

interface ArenaSelectorProps {
  arenas: ArenaInfo[];
  selectedArenaId: string | null;
  onSelect: (arenaId: string) => void;
  disabled?: boolean;
}

export function ArenaSelector({ arenas, selectedArenaId, onSelect, disabled = false }: ArenaSelectorProps) {
  const comboboxOptions = useMemo<ComboboxOption[]>(
    () =>
      arenas.map((arena) => ({
        value: arena.id,
        label: arena.name,
        description: arena.description,
        badge: `${arena.gridWidth}x${arena.gridHeight}`,
        icon: <Map className="h-4 w-4" />,
      })),
    [arenas]
  );

  const carouselItems = useMemo(
    () =>
      arenas.map((arena) => ({
        id: arena.id,
        title: arena.name,
        description: arena.description,
        accent: `${arena.gridWidth}x${arena.gridHeight} grid`,
        icon: <Map />,
        ctaLabel: selectedArenaId === arena.id ? 'Selected' : 'Select Arena',
        ctaHref: disabled ? undefined : '#',
      })),
    [arenas, disabled, selectedArenaId]
  );

  const selectedIndex = useMemo(
    () => arenas.findIndex((arena) => arena.id === selectedArenaId),
    [arenas, selectedArenaId]
  );

  const handleSelect = useCallback(
    (arenaId: string) => {
      if (disabled) {
        return;
      }
      onSelect(arenaId);
    },
    [disabled, onSelect]
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-aurora-400/20 bg-midnight-950/50 p-6 shadow-[0_22px_60px_rgba(6,8,18,0.55)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-[0.68rem] uppercase tracking-[0.5em] text-aurora-100/75">Quick Select</p>
          <p className="max-w-md text-sm leading-relaxed text-shadow-300">
            Jump to an arena instantly or browse the showcase carousel below. Each selection previews layout traits and
            grid sizing.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <Combobox
            options={comboboxOptions}
            value={selectedArenaId}
            onValueChange={(next) => {
              if (next) {
                handleSelect(next);
              }
            }}
            placeholder="Search arenas..."
            searchPlaceholder="Filter arenas..."
            allowDeselect={false}
            disabled={disabled || arenas.length === 0}
          />
        </div>
      </div>
      <SpotlightCarousel
        items={carouselItems}
        size="lg"
        autoPlay={false}
        startIndex={selectedIndex >= 0 ? selectedIndex : undefined}
        onSlideChange={(index) => {
          const arena = arenas[index];
          if (arena) {
            handleSelect(arena.id);
          }
        }}
        showControls={!disabled}
      />
    </div>
  );
}

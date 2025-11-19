import type { LucideIcon } from 'lucide-react';
import { Mountain, Waves, Sun, Snowflake, Flame, Trees, Cloud, Gem, Sparkles } from 'lucide-react';
import type { ArchetypeSigil } from './worldArchetypes';

export const ARCHETYPE_SIGILS: Record<ArchetypeSigil, LucideIcon> = {
  mountain: Mountain,
  tide: Waves,
  dune: Sun,
  frost: Snowflake,
  ember: Flame,
  grove: Trees,
  sky: Cloud,
  abyss: Gem,
  custom: Sparkles,
};

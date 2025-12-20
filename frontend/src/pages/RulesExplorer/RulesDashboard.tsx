import { Link } from 'react-router-dom';
import {
  BookOpen,
  Sword,
  Shield,
  Sparkles,
  Scroll,
  Skull,
  Users,
  Zap,
  Hammer,
  Archive,
  Feather,
  Eye,
} from 'lucide-react';
import cn from '@/lib/utils';
import { gildedTokens } from '@/theme/gildedTokens';

const CATEGORIES = [
  { id: 'classes', name: 'Classes', icon: Shield, desc: 'Archetypes and professions', color: 'text-aurora-300' },
  { id: 'subclasses', name: 'Subclasses', icon: Feather, desc: 'Specialized paths', color: 'text-aurora-400' },
  { id: 'races', name: 'Races', icon: Users, desc: 'Ancestries and origins', color: 'text-nebula-300' },
  { id: 'features', name: 'Features', icon: Zap, desc: 'Class and race abilities', color: 'text-aurora-200' },
  { id: 'traits', name: 'Traits', icon: Eye, desc: 'Innate characteristics', color: 'text-nebula-200' },
  { id: 'proficiencies', name: 'Proficiencies', icon: Hammer, desc: 'Skills and tools', color: 'text-shadow-300' },
  { id: 'spells', name: 'Spells', icon: Sparkles, desc: 'Magical effects and rituals', color: 'text-purple-300' },
  { id: 'magic-items', name: 'Magic Items', icon: Archive, desc: 'Enchanted objects', color: 'text-purple-200' },
  { id: 'magic-schools', name: 'Magic Schools', icon: BookOpen, desc: 'Arcane traditions', color: 'text-purple-400' },
  { id: 'equipment', name: 'Equipment', icon: Sword, desc: 'Weapons, armor, and gear', color: 'text-orange-300' },
  { id: 'monsters', name: 'Monsters', icon: Skull, desc: 'Creatures and foes', color: 'text-red-400' },
  { id: 'languages', name: 'Languages', icon: Scroll, desc: 'Spoken and written tongues', color: 'text-shadow-200' },
];

export function RulesDashboard() {
  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="relative z-10 flex flex-col items-center text-center gap-4 py-8">
        <h1 className={cn(gildedTokens.heroTitle, 'text-4xl sm:text-5xl lg:text-6xl')}>
          <span className="text-gradient-gold">Rules Codex</span>
        </h1>
        <p className={cn(gildedTokens.heroBody, 'max-w-xl text-shadow-200')}>
          Browse the ancient archives. Discover spells, monsters, and knowledge to forge your legend.
        </p>

        {/* Decorative Divider */}
        <div className="mt-4 flex w-full max-w-xs items-center gap-4 opacity-60">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-aurora-500 to-transparent" />
          <div className="h-2 w-2 rotate-45 border border-aurora-400 bg-midnight-900" />
          <div className="h-px w-full bg-gradient-to-r from-aurora-500 via-aurora-500 to-transparent" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {CATEGORIES.map((cat) => (
          <Link key={cat.id} to={`/rules/${cat.id}`} className="group relative">
            {/* Card Content */}
            <div className="glass-panel-interactive h-full flex flex-col items-center text-center gap-4 border-midnight-600/40">
              {/* Icon Halo */}
              <div className="relative mb-2">
                <div className="absolute inset-0 rounded-full bg-midnight-500 blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-50" />
                <div
                  className={cn(
                    'relative flex h-16 w-16 items-center justify-center rounded-full border border-midnight-500 bg-midnight-800/50 shadow-inner transition-all duration-500',
                    'group-hover:scale-110 group-hover:border-aurora-500/50 group-hover:shadow-[0_0_20px_rgba(211,143,31,0.2)]'
                  )}
                >
                  <cat.icon
                    className={cn('h-7 w-7 transition-colors duration-300', cat.color, 'group-hover:text-aurora-100')}
                  />
                </div>
              </div>

              {/* Text */}
              <div className="space-y-2">
                <h3 className="font-display text-xl font-bold tracking-wider text-shadow-100 transition-colors group-hover:text-aurora-200">
                  {cat.name}
                </h3>
                <p className="text-sm text-shadow-400 font-medium leading-relaxed group-hover:text-shadow-200">
                  {cat.desc}
                </p>
              </div>

              {/* Bottom Decoration */}
              <div className="mt-auto pt-4 opacity-0 transition-all duration-500 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
                <span className="text-[10px] uppercase tracking-[0.3em] text-aurora-500 font-bold">Explore</span>
              </div>
            </div>

            {/* Corner Accents (Optional, for extra flair) */}
            <div className="absolute top-0 left-0 h-4 w-4 border-l border-t border-white/0 transition-all duration-500 group-hover:border-aurora-500/30" />
            <div className="absolute bottom-0 right-0 h-4 w-4 border-r border-b border-white/0 transition-all duration-500 group-hover:border-aurora-500/30" />
          </Link>
        ))}
      </div>
    </div>
  );
}

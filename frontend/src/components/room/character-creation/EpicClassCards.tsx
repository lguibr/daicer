/**
 * Epic class selection cards with custom styling per class
 */

import {
  LucideIcon,
  Sword,
  Wand2,
  UserX,
  Cross,
  Shield,
  Flame,
  Music,
  Hand,
  Sparkles,
  Leaf,
  Target,
} from 'lucide-react';
import clsx from 'clsx';

interface ClassOption {
  value: string;
  label: string;
  description?: string;
}

interface ClassCardProps {
  classOption: ClassOption;
  isSelected: boolean;
  onClick: () => void;
}

// Class-specific configuration with icons, gradients, and attributes
const CLASS_CONFIG: Record<
  string,
  {
    icon: LucideIcon;
    gradient: string;
    borderColor: string;
    iconColor: string;
    badgeColor: string;
    primaryAttribute: string;
    role: string;
  }
> = {
  Fighter: {
    icon: Sword,
    gradient: 'from-red-900/40 via-orange-900/30 to-midnight-900/50',
    borderColor: 'border-red-500/40 hover:border-red-400/60',
    iconColor: 'text-red-400',
    badgeColor: 'bg-red-500/20 text-red-200 border-red-400/40',
    primaryAttribute: 'STR',
    role: 'Warrior',
  },
  Wizard: {
    icon: Wand2,
    gradient: 'from-blue-900/40 via-indigo-900/30 to-midnight-900/50',
    borderColor: 'border-blue-500/40 hover:border-blue-400/60',
    iconColor: 'text-blue-400',
    badgeColor: 'bg-blue-500/20 text-blue-200 border-blue-400/40',
    primaryAttribute: 'INT',
    role: 'Spellcaster',
  },
  Rogue: {
    icon: UserX,
    gradient: 'from-purple-900/40 via-violet-900/30 to-midnight-900/50',
    borderColor: 'border-purple-500/40 hover:border-purple-400/60',
    iconColor: 'text-purple-400',
    badgeColor: 'bg-purple-500/20 text-purple-200 border-purple-400/40',
    primaryAttribute: 'DEX',
    role: 'Stealth',
  },
  Cleric: {
    icon: Cross,
    gradient: 'from-yellow-900/40 via-amber-900/30 to-midnight-900/50',
    borderColor: 'border-yellow-500/40 hover:border-yellow-400/60',
    iconColor: 'text-yellow-400',
    badgeColor: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/40',
    primaryAttribute: 'WIS',
    role: 'Healer',
  },
  Ranger: {
    icon: Target,
    gradient: 'from-green-900/40 via-emerald-900/30 to-midnight-900/50',
    borderColor: 'border-green-500/40 hover:border-green-400/60',
    iconColor: 'text-green-400',
    badgeColor: 'bg-green-500/20 text-green-200 border-green-400/40',
    primaryAttribute: 'DEX',
    role: 'Tracker',
  },
  Paladin: {
    icon: Shield,
    gradient: 'from-cyan-900/40 via-sky-900/30 to-midnight-900/50',
    borderColor: 'border-cyan-500/40 hover:border-cyan-400/60',
    iconColor: 'text-cyan-400',
    badgeColor: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
    primaryAttribute: 'CHA',
    role: 'Holy Knight',
  },
  Barbarian: {
    icon: Flame,
    gradient: 'from-orange-900/40 via-red-900/30 to-midnight-900/50',
    borderColor: 'border-orange-500/40 hover:border-orange-400/60',
    iconColor: 'text-orange-400',
    badgeColor: 'bg-orange-500/20 text-orange-200 border-orange-400/40',
    primaryAttribute: 'STR',
    role: 'Berserker',
  },
  Bard: {
    icon: Music,
    gradient: 'from-pink-900/40 via-rose-900/30 to-midnight-900/50',
    borderColor: 'border-pink-500/40 hover:border-pink-400/60',
    iconColor: 'text-pink-400',
    badgeColor: 'bg-pink-500/20 text-pink-200 border-pink-400/40',
    primaryAttribute: 'CHA',
    role: 'Performer',
  },
  Monk: {
    icon: Hand,
    gradient: 'from-teal-900/40 via-cyan-900/30 to-midnight-900/50',
    borderColor: 'border-teal-500/40 hover:border-teal-400/60',
    iconColor: 'text-teal-400',
    badgeColor: 'bg-teal-500/20 text-teal-200 border-teal-400/40',
    primaryAttribute: 'DEX',
    role: 'Martial Artist',
  },
  Sorcerer: {
    icon: Sparkles,
    gradient: 'from-fuchsia-900/40 via-purple-900/30 to-midnight-900/50',
    borderColor: 'border-fuchsia-500/40 hover:border-fuchsia-400/60',
    iconColor: 'text-fuchsia-400',
    badgeColor: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/40',
    primaryAttribute: 'CHA',
    role: 'Mage',
  },
  Druid: {
    icon: Leaf,
    gradient: 'from-lime-900/40 via-green-900/30 to-midnight-900/50',
    borderColor: 'border-lime-500/40 hover:border-lime-400/60',
    iconColor: 'text-lime-400',
    badgeColor: 'bg-lime-500/20 text-lime-200 border-lime-400/40',
    primaryAttribute: 'WIS',
    role: 'Shapeshifter',
  },
  Warlock: {
    icon: Flame,
    gradient: 'from-violet-900/40 via-purple-900/30 to-midnight-900/50',
    borderColor: 'border-violet-500/40 hover:border-violet-400/60',
    iconColor: 'text-violet-400',
    badgeColor: 'bg-violet-500/20 text-violet-200 border-violet-400/40',
    primaryAttribute: 'CHA',
    role: 'Pact Master',
  },
};

export function EpicClassCard({ classOption, isSelected, onClick }: ClassCardProps) {
  const config = CLASS_CONFIG[classOption.value] || {
    icon: Sword,
    gradient: 'from-midnight-800/40 via-midnight-900/30 to-midnight-900/50',
    borderColor: 'border-aurora-500/40 hover:border-aurora-400/60',
    iconColor: 'text-aurora-400',
    badgeColor: 'bg-aurora-500/20 text-aurora-200 border-aurora-400/40',
    primaryAttribute: 'STR',
    role: 'Adventurer',
  };

  const Icon = config.icon;
  const firstTwoLetters = classOption.value.slice(0, 2).toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'group relative overflow-hidden rounded-2xl border-2 px-5 py-6 text-left transition-all duration-200',
        'hover:scale-[1.01] hover:shadow-lg',
        config.borderColor,
        isSelected
          ? 'ring-2 ring-aurora-400/60 shadow-lg'
          : 'hover:ring-1 hover:ring-offset-1 hover:ring-offset-midnight-900'
      )}
    >
      {/* Animated gradient background */}
      <div
        className={clsx(
          'absolute inset-0 bg-gradient-to-br transition-opacity duration-300',
          config.gradient,
          isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-90'
        )}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start gap-4">
          {/* Icon & Letters Container */}
          <div className="flex flex-col items-center gap-2">
            {/* Icon */}
            <div
              className={clsx(
                'flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all',
                config.borderColor,
                isSelected ? 'bg-white/10 scale-105' : 'bg-midnight-950/60'
              )}
            >
              <Icon className={clsx('h-6 w-6', config.iconColor)} strokeWidth={2.5} />
            </div>

            {/* First 2 letters */}
            <div className={clsx('text-xs font-black uppercase tracking-wider', config.iconColor)}>
              {firstTwoLetters}
            </div>
          </div>

          {/* Class info */}
          <div className="flex-1 space-y-2">
            {/* Class name & selected indicator */}
            <div className="flex items-start justify-between">
              <h3 className="font-display text-lg font-bold uppercase tracking-wider text-shadow-50">
                {classOption.value}
              </h3>
              {isSelected && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-aurora-500 shadow-md">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex gap-2">
              <span
                className={clsx(
                  'rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]',
                  config.badgeColor
                )}
              >
                {config.role}
              </span>
              <span
                className={clsx(
                  'rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]',
                  config.badgeColor
                )}
              >
                {config.primaryAttribute}
              </span>
            </div>

            {/* Description */}
            {classOption.description && (
              <p className="text-xs leading-relaxed text-shadow-300 line-clamp-2">{classOption.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Hover glow effect */}
      <div
        className={clsx(
          'absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          'bg-gradient-to-tr from-transparent via-white/5 to-transparent'
        )}
      />
    </button>
  );
}

interface EpicClassSelectionGridProps {
  options: ClassOption[];
  selectedClass: string;
  onSelect: (className: string) => void;
  loading?: boolean;
}

export function EpicClassSelectionGrid({ options, selectedClass, onSelect, loading }: EpicClassSelectionGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-aurora-500/30 border-t-aurora-500 mx-auto" />
          <p className="text-sm text-shadow-400">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((option) => (
        <EpicClassCard
          key={option.value}
          classOption={option}
          isSelected={selectedClass === option.value}
          onClick={() => onSelect(option.value)}
        />
      ))}
    </div>
  );
}

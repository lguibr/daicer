import { Swords, Footprints, Eye, Brain, Shield, Sparkles, Hand } from 'lucide-react';
import { Button } from '../ui/button';
import cn from '../../lib/utils';

interface ActionBarProps {
  onActionSelect: (actionText: string) => void;
  disabled?: boolean;
  className?: string;
}

const COMMON_ACTIONS = [
  { label: 'Attack', icon: Swords, text: '[Action: Attack] ', color: 'text-red-400' },
  { label: 'Move', icon: Footprints, text: '[Action: Move] ', color: 'text-emerald-400' },
  { label: 'Look', icon: Eye, text: '[Action: Perception Check] ', color: 'text-blue-400' },
  { label: 'Think', icon: Brain, text: '[Action: Insight Check] ', color: 'text-purple-400' },
  { label: 'Defend', icon: Shield, text: '[Action: Dodge] ', color: 'text-yellow-400' },
  { label: 'Cast', icon: Sparkles, text: '[Action: Cast Spell] ', color: 'text-cyan-400' },
  { label: 'Use', icon: Hand, text: '[Action: Use Item] ', color: 'text-orange-400' },
];

export function ActionBar({ onActionSelect, disabled, className }: ActionBarProps) {
  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide', className)}>
      {COMMON_ACTIONS.map((action) => (
        <Button
          key={action.label}
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => onActionSelect(action.text)}
          className="flex-shrink-0 gap-2 border border-midnight-600 bg-midnight-800/50 hover:bg-midnight-700 hover:border-aurora-500/50"
        >
          <action.icon className={cn('w-3 h-3', action.color)} />
          <span className="text-xs font-medium text-shadow-300">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}

import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import cn from '@/lib/utils';
import { gildedTokens } from '@/theme/gildedTokens';
import { RulesResourceList } from './RulesResourceList';

export function RulesCategoryPage() {
  const { category } = useParams<{ category: string }>();

  if (!category) return <div>Invalid Category</div>;

  const formattedTitle = category.replace(/-/g, ' ');

  return (
    <div className="h-full flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-6 border-b border-midnight-600/50 pb-6">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-10 w-10 rounded-full border border-midnight-500/50 bg-midnight-800/30 text-shadow-300 hover:bg-midnight-700 hover:text-aurora-200"
        >
          <Link to="/rules">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-widest text-shadow-100 sm:text-4xl flex items-center gap-3">
            {formattedTitle}
            <Sparkles className="h-5 w-5 text-aurora-500 opacity-50" />
          </h1>
        </div>
      </div>

      {/* Content Area - Using glass panel for list */}
      <div
        className={cn(gildedTokens.glassPanel, 'flex-1 overflow-hidden p-0 border-midnight-600/30 bg-midnight-900/30')}
      >
        <RulesResourceList category={category} />
      </div>
    </div>
  );
}

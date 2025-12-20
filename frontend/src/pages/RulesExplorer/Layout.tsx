import { Outlet } from 'react-router-dom';
import DynamicLayout from '@/components/layout/DynamicLayout';
import { gildedTokens } from '@/theme/gildedTokens';
import cn from '@/lib/utils';

export function RulesExplorerLayout() {
  return (
    <DynamicLayout showNavbar={true} className="bg-midnight-950" mainClassName="relative min-h-[calc(100vh-4.5rem)]">
      <div className={cn(gildedTokens.gradientBackdrop, 'fixed inset-0 pointer-events-none')} />

      {/* Content Container - with padding for the fixed breadcrumb rail */}
      <div className="mx-auto max-w-[1400px] p-6 sm:p-8 lg:p-10">
        <Outlet />
      </div>
    </DynamicLayout>
  );
}

import { useLocation, Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { useI18n } from '@/i18n';

interface BreadcrumbSegment {
  label: string;
  path: string;
}

/**
 * AppBreadcrumb component - Premium "Gilded" Edition
 * Transparent background with blur, Cinzel font for locations
 */
export default function AppBreadcrumb() {
  const location = useLocation();
  const { t } = useI18n();

  // Route label mappings
  const routeLabels: Record<string, string> = {
    room: t('navbar.links.rooms'),
    rooms: t('navbar.links.rooms'),
    game: t('navbar.links.game'),
    explore: t('navbar.links.explore'),
    rules: t('navbar.links.explore'),
    assets: t('navbar.links.assets'),
    '2d': '2D Assets',
    '3d': '3D Assets',
    maps: 'Maps',
    'character-sheet': 'Character Sheets',
    create: 'New Campaign',
    tactical: 'Tactical Combat',
    'test-setup': 'Debug Setup',
  };

  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0 || location.pathname === '/') {
    return null;
  }

  const breadcrumbs: BreadcrumbSegment[] = pathSegments.map((segment, index) => {
    const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
    // Try to format nicely if not in map (e.g. "magic-items" -> "Magic Items")
    const fallbackLabel = segment
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');

    const label = routeLabels[segment] || fallbackLabel;
    return { label, path };
  });

  return (
    <div className="sticky top-0 z-40 border-b border-midnight-500/20 bg-midnight-950/60 backdrop-blur-md">
      <div className="mx-auto max-w-[1400px] px-6 py-2 sm:px-8 lg:px-10">
        <Breadcrumb>
          <BreadcrumbList className="text-[11px] uppercase tracking-[0.15em] sm:text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  to="/"
                  className="flex items-center gap-2 text-shadow-400 transition-colors hover:text-aurora-300"
                >
                  <Home className="h-3.5 w-3.5" />
                  <span className="sr-only">Home</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={crumb.path} className="flex items-center gap-2">
                  <ChevronRight className="h-3 w-3 text-midnight-500" />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-display font-semibold text-aurora-200 drop-shadow-[0_0_8px_rgba(211,143,31,0.2)]">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link
                          to={crumb.path}
                          className="font-medium text-shadow-400 transition-colors hover:text-aurora-300"
                        >
                          {crumb.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </li>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}

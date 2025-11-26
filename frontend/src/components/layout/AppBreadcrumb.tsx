import { useLocation, Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useI18n } from '@/i18n';

interface BreadcrumbSegment {
  label: string;
  path: string;
}

/**
 * AppBreadcrumb component - automatically generates breadcrumbs based on current route
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
    assets: t('navbar.links.assets'),
    '2d': '2D',
    '3d': '3D',
    maps: 'Maps',
    'character-sheet': 'Character Sheet',
    create: 'Create',
    tactical: 'Tactical Combat',
    'test-setup': 'Test Setup',
  };

  // Parse path into segments
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Don't show breadcrumbs on root/landing
  if (pathSegments.length === 0 || location.pathname === '/') {
    return null;
  }

  // Build breadcrumb segments
  const breadcrumbs: BreadcrumbSegment[] = pathSegments.map((segment, index) => {
    const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const label = routeLabels[segment] || segment;
    return { label, path };
  });

  return (
    <Breadcrumb className="px-4 py-3 sm:px-6 lg:px-8 bg-midnight-500/30 border-b border-midnight-500/50">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="text-aurora-200 hover:text-aurora-100">
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <span key={crumb.path} className="flex items-center gap-1.5">
              <BreadcrumbSeparator className="text-shadow-400" />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-shadow-100">{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.path} className="text-shadow-300 hover:text-shadow-100">
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

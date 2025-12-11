/**
 * Equipment Shop Component
 * Main shop interface for purchasing and equipping items during character creation
 */

import { useState, useMemo } from 'react';
import { Filter, Package, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { EquipmentItemCard, type EquipmentItemData } from './EquipmentItemCard';
import { useI18n } from '../../i18n';
import { cn } from '../../lib/utils';

interface EquipmentShopProps {
  items: EquipmentItemData[];
  currentGold: number;
  equippedItems: Record<string, string | null>;
  inventory: Array<{ itemIndex: string; quantity: number }>;
  onBuyItem: (itemIndex: string) => void;
  onBuyStartingPack?: () => void;
  className?: string;
  startingPackCost?: number;
  mode?: 'game' | 'asset'; // NEW: Mode prop for game vs asset creation
}

type FilterOption = 'all' | 'Weapon' | 'Armor' | 'Adventuring Gear';

export function EquipmentShop({
  items,
  currentGold,
  equippedItems,
  inventory,
  onBuyItem,
  onBuyStartingPack,
  className,
  startingPackCost,
  mode = 'game', // Default to game mode
}: EquipmentShopProps) {
  const { t, localize } = useI18n();
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  // Asset mode gets unlimited gold (9999999)
  const displayGold = mode === 'asset' ? 9999999 : currentGold;

  const filters: Array<{ value: FilterOption; label: string }> = [
    { value: 'all', label: t('equipment.shop.filterAll') },
    { value: 'Weapon', label: t('equipment.shop.filterWeapon') },
    { value: 'Armor', label: t('equipment.shop.filterArmor') },
    { value: 'Adventuring Gear', label: t('equipment.shop.filterGear') },
  ];

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return items;
    return items.filter((item) => item.equipmentCategory === activeFilter);
  }, [items, activeFilter]);

  const totalWeight = useMemo(() => {
    let weight = 0;
    // Add equipped items weight
    Object.values(equippedItems).forEach((itemIndex) => {
      if (itemIndex) {
        const item = items.find((i) => i.index === itemIndex);
        if (item) weight += item.weight;
      }
    });
    // Add inventory items weight
    inventory.forEach(({ itemIndex, quantity }) => {
      const item = items.find((i) => i.index === itemIndex);
      if (item) weight += item.weight * quantity;
    });
    return weight;
  }, [equippedItems, inventory, items]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Asset Mode Badge */}
      {mode === 'asset' && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <p className="flex items-center gap-2 text-sm text-emerald-200">
            <Sparkles className="h-4 w-4" />
            <strong>Asset Creation Mode:</strong> Unlimited Gold - Buy anything for fun!
          </p>
        </div>
      )}

      {/* Header with gold display */}
      <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-sm text-muted-foreground">{t('equipment.shop.currentGold')}</div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-amber-500">{displayGold} gp</div>
              {mode === 'asset' && <Badge variant="secondary">∞</Badge>}
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="text-sm text-muted-foreground">{t('equipment.shop.totalWeight')}</div>
            <div className="text-lg font-medium">{totalWeight.toFixed(1)} lb</div>
          </div>
        </div>

        {onBuyStartingPack && startingPackCost !== undefined && (
          <Button
            onClick={onBuyStartingPack}
            disabled={mode === 'game' && currentGold < startingPackCost}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            <Package className="mr-2 h-4 w-4" />
            {t('equipment.shop.buyPack')} ({startingPackCost} gp)
          </Button>
        )}
      </div>

      {/* Equipped Items Display */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4" />
          {t('equipment.shop.equipped')}
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
          {Object.entries(equippedItems).map(([slot, itemIndex]) => {
            const item = itemIndex ? items.find((i) => i.index === itemIndex) : null;
            return (
              <div key={slot} className="rounded-md border border-border bg-background p-2">
                <div className="text-xs text-muted-foreground">{t(`equipment.slots.${slot}`)}</div>
                <div className="truncate text-sm font-medium">
                  {item ? localize(item, 'name') : t('equipment.slots.empty')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            variant={activeFilter === filter.value ? 'default' : 'outline'}
            size="sm"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <EquipmentItemCard
            key={item.index}
            item={item}
            onBuy={onBuyItem}
            currentGold={displayGold}
            disabled={false}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">No items found in this category.</div>
      )}
    </div>
  );
}

/**
 * Equipment Item Card Component
 * Displays individual equipment items with stats and purchase/equip actions
 */

import { ShoppingCart, Swords, Shield, Backpack } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useI18n } from '../../i18n';

export interface EquipmentItemData {
  index: string;
  name: string;
  equipmentCategory: string;
  cost: {
    quantity: number;
    unit: string;
  };
  weight: number;
  damage?: {
    damageDice: string;
    damageType: string;
  };
  armorClass?:
    | number
    | {
        base: number;
        dexBonus?: boolean;
        maxBonus?: number;
      };
  properties?: string[];
  desc?: string[];
  description?: string; // Add description string
  name_es?: string;
  name_ptBR?: string;
  description_es?: string;
  description_ptBR?: string;
}

interface EquipmentItemCardProps {
  item: EquipmentItemData;
  onBuy?: (itemIndex: string) => void;
  onEquip?: (itemIndex: string) => void;
  currentGold: number;
  disabled?: boolean;
}

function getItemIcon(category: string) {
  if (category === 'Weapon') return Swords;
  if (category === 'Armor') return Shield;
  return Backpack;
}

function convertToGold(quantity: number, unit: string): number {
  const rates: Record<string, number> = {
    cp: 0.01,
    sp: 0.1,
    ep: 0.5,
    gp: 1,
    pp: 10,
  };
  return quantity * (rates[unit] || 1);
}

export function EquipmentItemCard({ item, onBuy, onEquip, currentGold, disabled }: EquipmentItemCardProps) {
  const { t, localize } = useI18n();
  const Icon = getItemIcon(item.equipmentCategory);
  const costInGold = convertToGold(item.cost.quantity, item.cost.unit);
  const canAfford = currentGold >= costInGold;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{localize(item, 'name')}</CardTitle>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-amber-500">
            <span>{costInGold}</span>
            <span className="text-xs">gp</span>
          </div>
        </div>
        <CardDescription className="text-xs">{t(`equipment.categories.${item.equipmentCategory}`)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">{t('equipment.shop.weight')}</div>
            <div className="font-medium">{item.weight} lb</div>
          </div>
          {item.damage && (
            <div>
              <div className="text-xs text-muted-foreground">{t('equipment.shop.damage')}</div>
              <div className="font-medium">
                {item.damage.damageDice} {item.damage.damageType}
              </div>
            </div>
          )}
          {item.armorClass && (
            <div>
              <div className="text-xs text-muted-foreground">{t('equipment.shop.armorClass')}</div>
              <div className="font-medium">
                {typeof item.armorClass === 'number' ? item.armorClass : item.armorClass.base} AC
              </div>
            </div>
          )}
        </div>

        {item.properties && item.properties.length > 0 && (
          <div>
            <div className="mb-1 text-xs text-muted-foreground">{t('equipment.shop.properties')}</div>
            <div className="flex flex-wrap gap-1">
              {item.properties.map((prop) => (
                <span key={prop} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs">
                  {prop}
                </span>
              ))}
            </div>
          </div>
        )}

        {(item.description || (item.desc && item.desc.length > 0)) && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {localize(item, 'description') || item.desc?.[0]}
          </p>
        )}

        {onBuy && (
          <Button
            onClick={() => onBuy(item.index)}
            disabled={!canAfford || disabled}
            className="w-full"
            size="sm"
            variant={canAfford ? 'default' : 'outline'}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {canAfford ? t('equipment.shop.buy') : t('equipment.shop.insufficientGold')}
          </Button>
        )}

        {onEquip && (
          <Button onClick={() => onEquip(item.index)} disabled={disabled} className="w-full" size="sm">
            {t('equipment.shop.equip')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

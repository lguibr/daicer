import { useMemo } from 'react';
import { useI18n } from '../../i18n';

interface RandomItemProps {
  /** Array of pre-translated items (strings or React nodes) */
  items?: (string | React.ReactNode)[];
  /** Array of i18n translation keys to translate and pick from */
  itemKeys?: string[];
}

/**
 * Randomly selects and displays one item from a list on mount.
 * Supports both pre-translated content and i18n keys.
 *
 * @example
 * // With translation keys
 * <RandomItem itemKeys={["diceLoader.messages.summoning", "diceLoader.messages.rattling"]} />
 *
 * @example
 * // With pre-translated strings
 * <RandomItem items={["Hello", "Hi", "Hey"]} />
 *
 * @example
 * // With React components
 * <RandomItem items={[<Alert>Success!</Alert>, <Alert>Great!</Alert>]} />
 */
export function RandomItem({ items, itemKeys }: RandomItemProps) {
  const { t } = useI18n();

  const randomItem = useMemo(() => {
    // Use itemKeys if provided (translate then pick)
    if (itemKeys && itemKeys.length > 0) {
      const randomKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
      return randomKey ? t(randomKey) : null;
    }

    // Fall back to items
    if (items && items.length > 0) {
      return items[Math.floor(Math.random() * items.length)];
    }

    // No valid input
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps: only randomize once on mount

  return <>{randomItem}</>;
}

// Domain-specific hooks
export { default as useAuth } from './useAuth';
export { useCombat } from './useCombat';
export { useRoomWizard } from './useRoomWizard';
export { default as useSocket } from './useSocket';
export { useDebouncedBusy } from './useDebouncedBusy';
export type { DebouncedBusyOptions, DebouncedBusyResult } from './useDebouncedBusy';

// Game data hooks
export {
  useAlignments,
  useRaces,
  useClasses,
  useBackgrounds,
  useSkills,
  useAbilities,
  useLanguages,
  useMagicSchools,
  useConditions,
  useDamageTypes,
  useEquipment,
  useWeaponProperties,
  useMonsters,
} from './useGameData';

// General utility hooks from @uidotdev/usehooks
// Re-export commonly used hooks for convenience
export {
  // Dimensions & Layout
  useWindowSize,
  useMeasure,
  useMediaQuery,
  useOrientation,
  useIntersectionObserver,

  // State Management
  useLocalStorage,
  useSessionStorage,
  usePrevious,
  useToggle,
  useCounter,
  useList,
  useSet,
  useMap,
  useQueue,
  useDefault,
  useObjectState,

  // Performance
  useDebounce,
  useThrottle,

  // User Interaction
  useHover,
  useClickAway,
  useMouse,
  useCopyToClipboard,
  useIdle,
  useLongPress,

  // Browser APIs
  useNetworkState,
  usePreferredLanguage,
  useDocumentTitle,
  useVisibilityChange,
  useWindowScroll,
  useLockBodyScroll,
  useIsClient,
  useFavicon,
  useScript,

  // Other Utilities
  useRenderInfo,
  useRenderCount,
  useHistoryState,
  useIsFirstRender,
  useGeolocation,
  useBattery,
} from '@uidotdev/usehooks';

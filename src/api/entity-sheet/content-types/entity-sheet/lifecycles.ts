import { AsyncLocalStorage } from 'node:async_hooks';
import { errors } from '@strapi/utils';
import { InventorySchema } from '@/types/Inventory';
import type { Core } from '@strapi/strapi';

const { ApplicationError } = errors;
declare let strapi: Core.Strapi;
interface LifecycleEvent {
  params?: { data?: Record<string, unknown> };
  result?: { documentId?: string };
}

// Scope suppression to this async call chain; independent requests still derive.
const deriving = new AsyncLocalStorage<ReadonlySet<string>>();
const sourceFields = ['inventory', 'stats', 'level', 'class', 'race', 'actions', 'features', 'traits', 'proficiencies'];
async function derive(event: LifecycleEvent) {
  const sheetId = event.result?.documentId;
  if (!sheetId || deriving.getStore()?.has(sheetId)) return;
  const active = new Set(deriving.getStore());
  active.add(sheetId);
  try {
    await deriving.run(active, () => strapi.service('api::game.entity-derivation').deriveAndPersist(sheetId));
  } catch (error) {
    strapi.log.error('EntitySheet derivation failed', error);
    throw new ApplicationError('EntitySheet derivation failed: ' + (error as Error).message);
  }
}

/** Validate writes, then derive from populated persisted relations without changing mechanical state. */
export default {
  async beforeCreate(event: LifecycleEvent) {
    if (event.params?.data) validateInventorySlots(event.params.data);
  },
  async beforeUpdate(event: LifecycleEvent) {
    if (event.params?.data) validateInventorySlots(event.params.data);
  },
  afterCreate: derive,
  async afterUpdate(event: LifecycleEvent) {
    if (sourceFields.some((key) => Object.prototype.hasOwnProperty.call(event.params?.data ?? {}, key))) await derive(event);
  },
};

// Validates inventory slots using strict Zod schema
function validateInventorySlots(data: { inventory?: unknown }) {
  if (!data.inventory || !Array.isArray(data.inventory)) {
    return;
  }

  // Parse against Zod Schema to ensure structure
  const result = InventorySchema.safeParse(data.inventory);

  if (!result.success) {
    // If schema validation fails, log warning but maybe allow loose data if legacy?
    // For strictness, we throw.
    const issues = result.error.issues.map((i) => i.message).join(', ');
    throw new ApplicationError(`Invalid Inventory Structure: ${issues}`);
  }

  const items = result.data;
  const slots = new Set<string>();

  for (const item of items) {
    // Skip if item doesn't have a slot or is in backpack
    if (!item.slot || item.slot === 'backpack') {
      continue;
    }

    if (slots.has(item.slot)) {
      throw new ApplicationError(`You cannot have more than one item equipped in the ${item.slot} slot.`);
    }

    slots.add(item.slot);
  }
}

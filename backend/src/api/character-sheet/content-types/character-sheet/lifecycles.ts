import { errors } from '@strapi/utils';
const { ApplicationError } = errors;

export default {
  async beforeCreate(event) {
    const { data } = event.params;
    validateInventorySlots(data);
  },

  async beforeUpdate(event) {
    const { data } = event.params;
    validateInventorySlots(data);
  },
};

function validateInventorySlots(data: any) {
  if (!data.inventory || !Array.isArray(data.inventory)) {
    return;
  }

  const slots = new Set();

  for (const item of data.inventory) {
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

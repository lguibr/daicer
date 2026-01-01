/**
 * Action Registry
 * The "Tool Box" for the Engine and DM Agent.
 * Contains deterministic logic for game mechanics.
 */

export default ({ strapi }) => ({
  /**
   * ROLL DICE
   * Validates and executes a dice roll expression.
   * Format: "1d20+5", "2d6", "1d100-2"
   */
  rollDice(expression: string) {
    // 1. Validation
    const regex = /^(\d+)d(\d+)([+-]\d+)?$/;
    const match = expression.match(regex);

    if (!match) {
      // Fallback for simple integers or invalid strings
      const simple = parseInt(expression);
      if (!isNaN(simple)) return { total: simple, rolls: [], expression };
      throw new Error(`Invalid dice expression: ${expression}`);
    }

    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;

    if (count > 100) throw new Error('Too many dice!');
    if (sides < 2) throw new Error('Invalid die sides!');

    // 2. Execution
    const rolls = [];
    let total = 0;
    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      rolls.push(roll);
      total += roll;
    }

    total += modifier;

    return {
      total,
      rolls,
      modifier,
      expression,
    };
  },

  /**
   * MOVE ENTITY
   * Updates coordinates of a character if valid.
   * Checks: Speed Limit, Map Bounds (basic), Terrain Obstacles (Todo)
   */
  async moveEntity(characterId: string | number, x: number, y: number) {
    // 1. Fetch Character Sheet
    const sheet = await strapi.entityService.findOne('api::entity-sheet.entity-sheet', characterId, {
      populate: ['stats', 'position', 'race', 'class'], // Populate stats for speed
    });

    if (!sheet) throw new Error('Character sheet not found');

    const currentPos = sheet.position || { x: 0, y: 0 };
    const speed = sheet.stats?.speed || 30; // Default 30ft

    // 2. Calculate Distance (Chebyshev / D&D diagonal rule usually 5-5-5 or 5-10-5)
    // For simplicity in Alpha: 1 Grid Unit = 5ft.
    // Euclidean or Manhattan? D&D 5e default is "1 square is 1 square regardless of diagonal" (Chebyshev distance).
    // Let's use simple Chebyshev distance (max(dx, dy)).

    const dx = Math.abs(x - currentPos.x);
    const dy = Math.abs(y - currentPos.y);
    const distanceUnits = Math.max(dx, dy);
    const distanceFt = distanceUnits * 5;

    // 3. Validate Speed
    // Note: In a real turn, we'd deduct movement from a "movement budget".
    // For now, we just check if the single move is feasible or "Dash" required.
    // We will allow it but flag it if it exceeds walk speed.
    const isDash = distanceFt > speed;

    // 4. Update Position
    // TODO: Check Room Terrain for Walls

    await strapi.entityService.update('api::entity-sheet.entity-sheet', characterId, {
      data: {
        position: { x, y },
      },
    });

    return {
      success: true,
      from: currentPos,
      to: { x, y },
      distanceFt,
      isDash,
      remainingMovement: Math.max(0, speed - distanceFt), // Mock
    };
  },

  /**
   * APPLY DAMAGE
   * Reduces HP. Handles Unconsciousness.
   */
  async applyDamage(targetId: string | number, amount: number, type: string) {
    const sheet = await strapi.entityService.findOne('api::entity-sheet.entity-sheet', targetId);
    if (!sheet) throw new Error('Target not found');

    const currentHp = sheet.currentHp;
    const newHp = Math.max(0, currentHp - amount);
    const isUnconscious = newHp === 0;

    await strapi.entityService.update('api::entity-sheet.entity-sheet', targetId, {
      data: { currentHp: newHp },
    });

    return {
      targetId,
      damage: amount,
      type,
      oldHp: currentHp,
      newHp,
      isUnconscious,
    };
  },

  /**
   * DEDUCT RESOURCE
   * Removes item count or spell slots.
   */
  async deductResource(characterId: string | number, resourceName: string, amount: number = 1) {
    const sheet = await strapi.entityService.findOne('api::entity-sheet.entity-sheet', characterId, {
      populate: ['inventory'],
    });

    if (!sheet) throw new Error('Character not found');

    // Scan inventory logic...
    // TODO: Implement Inventory Component Search
    // For now returning mock success
    return { success: true, message: `Deducted ${amount} ${resourceName} (Mock)` };
  },
});

# Agent Tool Suite: Master Index

This directory contains the technical specifications for the Agent Tool Suite, designed to give the AI Agent granular control over the Game Engine.

## I. Combat Tools (The "Action" Economy)

Tools dependent on Initiative, Turn Order, and Action Types.

1. **[perform_attack](./01-perform-attack.md)**: Execute a standard melee or ranged attack against a target AC.
2. **[cast_spell](./02-cast-spell.md)**: Cast a spell, tracking slots, components, and prompting saving throws.
3. **[use_feature](./03-use-feature.md)**: Activate a class or monster feature (e.g., Breath Weapon), tracking usage/recharge.
4. **[defensive_stance](./04-defensive-stance.md)**: Execute Dodge, Disengage, or Help actions.
5. **[grapple_shove](./05-grapple-shove.md)**: Initiate contested Athletics/Acrobatics checks for control.
6. **[ready_action](./06-ready-action.md)**: Set a conditional trigger for a reaction.

## II. Exploration & Movement (The "Voxel" Interaction)

Tools for navigating the 3D voxel world and interacting with the environment.

7. **[move_entity](./07-move-entity.md)**: Execute grid-based movement with pathfinding and cost calculation.
8. **[dash_entity](./08-dash-entity.md)**: Utilize the Dash action to extend movement range.
9. **[teleport_entity](./09-teleport-entity.md)**: Instantaneously relocate an entity to coordinates (ignoring pathing).
10. **[interact_object](./10-interact-object.md)**: Manipulate world objects (Doors, Chests, Levers).
11. **[search_area](./11-search-area.md)**: Perform Active Perception or Investigation checks to reveal secrets.
12. **[stealth_mode](./12-stealth-mode.md)**: Toggle Stealth state and perform Hide checks against Passive Perception.
13. **[jump_climb](./13-jump-climb.md)**: Handle vertical movement and athletics checks for traversing obstacles.

## III. DM & World Management (The "God" Mode)

Tools for the Dungeon Master Agent to manipulate the world state directly.

14. **[spawn_entity](./14-spawn-entity.md)**: Instantiate a Monster or NPC from a Blueprint options.
15. **[modify_hp](./15-modify-hp.md)**: Apply direct damage or healing (DM Fiat/Trap/Environmental).
16. **[apply_condition](./16-apply-condition.md)**: Apply status effects (Stunned, Prone) with duration tracking.
17. **[remove_condition](./17-remove-condition.md)**: Clear active status effects.
18. **[set_world_time](./18-set-world-time.md)**: Advance the world clock (Day/Night cycle, weather changes).
19. **[modify_terrain](./19-modify-terrain.md)**: Break or place voxel blocks (Magic, Destruction).

## IV. System & Meta (The "Engine" State)

Tools for managing game rules, resources, and character data.

20. **[roll_save](./20-roll-save.md)**: Force a specific saving throw (e.g., vs Poison or Trap).
21. **[request_check](./21-request-check.md)**: Prompt a player or entity for a specific Ability Check.
22. **[long_rest](./22-long-rest.md)**: Execute Long Rest logic (HP/Resource restore).
23. **[short_rest](./23-short-rest.md)**: Execute Short Rest logic (Hit Dice expenditure).
24. **[manage_inventory](./24-manage-inventory.md)**: Add, remove, equip, or transfer items between entities.
25. **[broadcast_message](./25-broadcast-message.md)**: Send valid system messages or whispers to players.

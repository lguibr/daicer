# Rules Consolidation: Design Analysis & QA Log

## Context

We are consolidating the game rules into a unified "Deterministic Engine" that handles all logic (dice, math, state), while the LLM acts purely as a Narrator/Interpreter. The `CharacterSheet` is the central source of truth.

## Topic 1: Combat & Action Economy

1.  **Q:** How does the Engine uniquely identify an "Action" (e.g., Attack, Spell, Dash) when a player requests it via natural language?
    **A:** The LLM interprets the request. Each "Action" (Move, Attack, Cast Spell) is treated as a Tool. Some tools might digest specific actions from the Character Sheet payload for that message turn.

2.  **Q:** Does `structuredActions` on `CharacterSheet` flatten all available actions (Class features + Racial traits + Item actions), or is it computed on the fly?
    **A:** **Flattened.** Best approach is to flatten it so we can easily add more actions (leveling, lore-based) in the future.

3.  **Q:** How does the Engine handle "Multiattack" deterministically? Does it require separate validation for each target, or one "macro-action"?
    **A:** The attack roll is unique, but saves and damage computations are individual per target/hit.

4.  **Q:** How are "Reactions" (e.g., Attack of Opportunity, Shield spell) triggered? Does the engine pause resolution to ask for player input?
    **A:** **Out of Scope.** We will not handle reactions for the MVP.

5.  **Q:** How is "Initiative" stored? Is it a list on the `Room` entity or a circular linked list of `Turn` objects?
    **A:** Initiative is rolled at the start of combat. The DM (LLM/User) manually ends combat. New attacks restart the combat state with fresh initiatives.

6.  **Q:** When the LLM narrates a "Crit", does it receive raw dice data (e.g., "Natural 20") or just a "Outcome: Critical_Hit" flag from the engine?
    **A:** Normal data (raw dice results) is enough for the LLM; no special flag required.

7.  **Q:** How are "Bonus Actions" restricted? Does the `CharacterSheet` state track `hasUsedBonusAction` per turn?
    **A:** **Yes.** State tracking per turn.

8.  **Q:** How does the engine handle "Improvised Actions" (e.g., swinging from a chandelier)? Does it fallback to a genetic "Skill Check" action?
    **A:** Rolls a Skill Check (Proficiency) if applicable, otherwise falls back to a raw Attribute check (e.g., STR).

9.  **Q:** For "Grappling", how does the engine enforce the "Grappled" condition state on the target?
    **A:** **Modified.** Grappling will be treated as "Stunned" status for now.

10. **Q:** How does the engine validate "Range" and "Line of Sight" using the Voxel Map before allowing an attack?
    **A:** Simple validation. If no line of sight, the engine returns "Attack not possible: Not visible". It always attempts to validate the user's intent.

## Topic 2: Spellcasting & Magic

11. **Q:** How does the `Spellbook` component map to the `Spells` collection? Is it a list of IDs or a deep copy of spell data?
    **A:** Relation by ID is fine for data, but "Used Since Last Rest" tracking must be computed/stored separately.

12. **Q:** How are "Spell Slots" tracked? Is there a `slotsAvailable` JSON object on `CharacterSheet`, e.g., `{"1": 4, "2": 2}`?
    **A:** **New Component.** Use a clear Component structure, not a raw JSON object.

13. **Q:** How does the engine enforce "Components" (V, S, M)? Does it check if hands are free for Somatic/Material?
    **A:** **Clarification Needed / Skipped.** (User requested clarification, effectively skipping for MVP logic unless specified).

14. **Q:** How are "Concentration" spells handled? Does taking damage auto-trigger a CON save in the engine?
    **A:** **Yes.**

15. **Q:** How does `KnowledgeSnippet` usage integrate with identifying enemy spells (e.g., Counterspell logic)?
    **A:** Purely for LLM Grounding (flavor/narration). Not used for mechanics like Counterspell identification.

16. **Q:** For "Ritual Casting", does the engine enforce the +10 minute casting time increase?
    **A:** **Yes.** Enforce the time rule (turn/time tracking).

17. **Q:** How do "Upcast" spells work? Does the action payload include `{ level: 3 }` for a Magic Missile?
    **A:** **Out of Scope.** Not used for MVP.

18. **Q:** How are "Area of Effect" (AoE) templates (Cone, Cube, Sphere) validated against the 3D grid?
    **A:** **2D Validation.** Walls and non-walkable obstacles break line of sight/effect. Shapes supported: Cone, Square, Line, Circle.

19. **Q:** How does the engine handle "Saving Throws" for multiple targets? Does it loop through all Entities in the AoE?
    **A:** Loops through each entity, processing saving throws individually (multiple times if necessary).

20. **Q:** Does the `Spell` entity need a `script` field to define custom deterministic logic (e.g., `fireball.ts`)?
    **A:** **No.** Support standard spells only. "Weird" spells are out of scope for MVP.

## Topic 3: Features, Traits & Resources

21. **Q:** How are "Class Features" (e.g., Sneak Attack) represented? Are they "Passive toggles" or "Active triggers"?
    **A:** **Passive Toggles** that the LLM can utilize.

22. **Q:** How does the engine track "Limited Use" features (e.g., Channel Divinity: 1/Short Rest)?
    **A:** Track the "Latest Turn/Rest" timestamp per character to validate if the feature is available.

23. **Q:** How are "Racial Traits" (e.g., Halfling Luck) automated? Does the engine auto-reroll 1s?
    **A:** **Yes.** Auto-reroll 1s.

24. **Q:** Do `Features` have a standard `hooks` system (e.g., `onAttack`, `onDamageTaken`)?
    **A:** (User was unsure, effectively "No" for MVP or needs definition).

25. **Q:** How is "Ki Points" or "Sorcery Points" storage standardized in the schema?
    **A:** Stored on the Character Sheet mixed with Datetime checks against rests.

26. **Q:** How do "Feats" integrate? Are they just another type of `Feature` entry?
    **A:** **Yes.**

27. **Q:** How does the engine handle "Resistance/Immunity" dynamically? (e.g., Tiefling Fire Resistance vs Fireball)?
    **A:** **Todo.** Not handled in MVP.

28. **Q:** For "Legendary Actions", how does the engine inject them into the turn order?
    **A:** Treated as **Normal Actions** for MVP.

29. **Q:** How are "Conditions" (Blind, Poisoned) applied and expired? Durations in rounds/minutes?
    **A:** **Rounds/Turns.**

30. **Q:** Does `KnowledgeSnippet` allow the LLM to explain _why_ a feature worked (e.g., "His skin is immune to fire!")?
    **A:** **Yes.** Engine is deterministic; KnowledgeSnippet is for explanation/narration only.

## Topic 4: Resting & Recovery

31. **Q:** How is a "Short Rest" executed? Does the engine just restore "Short Rest" resources and allow Hit Dice spending?
    **A:** **Yes.** But cannot rest in combat or if receiving "hit kill" damage.

32. **Q:** How are "Hit Dice" spent? Is it a transaction: `spend_hit_dice(amount: 1)` -> returns HP gain?
    **A:** **Yes.**

33. **Q:** How does "Long Rest" reset heavily customizable resources (e.g., Wizard prepared spells)?
    **A:** Uses Datetime logic to reset spells/resources used _before_ the rest completion.

34. **Q:** Does the engine prevent "Long Rest" if 24 hours haven't passed?
    **A:** **No.**

35. **Q:** How is "Exhaustion" tracked and calculated?
    **A:** **Out of Scope.** Not for MVP.

36. **Q:** Does "Arcane Recovery" (Wizard) trigger a UI prompt during Short Rest?
    **A:** **No.** Not necessary for MVP.

37. **Q:** How do environmental hazards (Extreme Cold) interrupt rests?
    **A:** **No.** Not for MVP.

38. **Q:** How is "Sleeping" status handled? Auto-fail perception checks?
    **A:** **No.** Just divides Perception check result by 2.

39. **Q:** Does the engine snapshot state before rest in case of ambush?
    **A:** **Yes.**

40. **Q:** How are "Temporary HP" cleared during rests?
    **A:** Cleared by checking for active "Turns" buffs and removing them on rest.

## Topic 5: Leveling & Progression

41. **Q:** How is "XP" awarded? Is it per session, per monster kill, or milestone?
    **A:** **Per Monster Kill.**

42. **Q:** When `level` increases, does the engine auto-calculate new `maxHp` (fixed vs rolled)?
    **A:** **Calculated.** Real dice roll logic.

43. **Q:** How are new `Spells` learned on level up? Does the UI query the allowed spell list?
    **A:** **Simplified.** Characters learn _all_ next available spells for MVP.

44. **Q:** How does "Multiclassing" affect the `CharacterSheet` structure? Array of classes?
    **A:** **Out of Scope.** Not allowed for MVP.

45. **Q:** How are "Proficiency Bonus" updates propagated to all skills/attacks?
    **A:** **Unknown/Todo.** Needs further definition.

46. **Q:** How does "ASI" (Ability Score Improvement) update base stats? Direct mutation?
    **A:** **Out of Scope.**

47. **Q:** How are "Subclass" choices stored? Is it a separate relation or just a field on `Class`?
    **A:** **Out of Scope.** Not allowed for MVP.

48. **Q:** Does the engine validate prerequisites for Feats during leveling?
    **A:** **Yes.** And auto-adds them.

49. **Q:** How is "Equipment" starter packs handled for new characters?
    **A:** Instantiated characters come with pre-populated inventory equipment.

50. **Q:** Can the LLM "suggest" level-up choices based on narrative?
    **A:** **No.** Not for MVP.

## Topic 6: Inventory & Equipment

51. **Q:** How is "AC" (Armor Class) calculated dynamically (Armor + Shield + DEX cap)?
    **A:** **Yes.**

52. **Q:** How does "Encumbrance" affect movement speed in the engine?
    **A:** **Out of Scope.**

53. **Q:** How are "Magic Items" properties (e.g., +1 Sword) merged into `structuredActions`?
    **A:** **Out of Scope.**

54. **Q:** How is "Attunement" tracked (Max 3 slots)?
    **A:** **Out of Scope.**

55. **Q:** How do "Consumables" (Potions) work? Action to "Consume"?
    **A:** **Out of Scope.**

56. **Q:** How is "Ammunition" tracking handled? Auto-decrement arrows?
    **A:** **Out of Scope.** Infinite ammo for MVP.

57. **Q:** How does the engine handle "Two-Handed" vs "Versatile" weapon logic?
    **A:** **Out of Scope.**

58. **Q:** Can items grant "Spells" (e.g., Wand of Magic Missiles)? How do they appear in `Spellbook`?
    **A:** (Question skipped/Implicitly Out of Scope).

59. **Q:** How is "Currency" (GP, SP, CP) stored? Simple object or itemized?
    **A:** **Simple Object.**

60. **Q:** How does "Looting" work? Transferring items from Monster Inventory to Player Inventory?
    **A:** **Out of Scope.**

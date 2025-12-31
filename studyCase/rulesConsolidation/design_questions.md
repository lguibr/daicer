# Rules Consolidation: Design Analysis & MVP Questions

## Context

We are consolidating the game rules into a unified "Deterministic Engine" that handles all logic (dice, math, state), while the LLM acts purely as a Narrator/Interpreter. The `CharacterSheet` is the central source of truth.

## Topic 1: Combat & Action Economy (10 Questions)

1.  How does the Engine uniquely identify an "Action" (e.g., Attack, Spell, Dash) when a player requests it via natural language?
2.  Does `structuredActions` on `CharacterSheet` flatten all available actions (Class features + Racial traits + Item actions), or is it computed on the fly?
3.  How does the Engine handle "Multiattack" deterministically? Does it require separate validation for each target, or one "macro-action"?
4.  How are "Reactions" (e.g., Attack of Opportunity, Shield spell) triggered? Does the engine pause resolution to ask for player input?
5.  How is "Initiative" stored? Is it a list on the `Room` entity or a circular linked list of `Turn` objects?
6.  When the LLM narrates a "Crit", does it receive raw dice data (e.g., "Natural 20") or just a "Outcome: Critical_Hit" flag from the engine?
7.  How are "Bonus Actions" restricted? Does the `CharacterSheet` state track `hasUsedBonusAction` per turn?
8.  How does the engine handle "Improvised Actions" (e.g., swinging from a chandelier)? Does it fallback to a genetic "Skill Check" action?
9.  For "Grappling", how does the engine enforce the "Grappled" condition state on the target?
10. How does the engine validate "Range" and "Line of Sight" using the Voxel Map before allowing an attack?

## Topic 2: Spellcasting & Magic (10 Questions)

11. How does the `Spellbook` component map to the `Spells` collection? Is it a list of IDs or a deep copy of spell data?
12. How are "Spell Slots" tracked? Is there a `slotsAvailable` JSON object on `CharacterSheet`, e.g., `{"1": 4, "2": 2}`?
13. How does the engine enforce "Components" (V, S, M)? Does it check if hands are free for Somatic/Material?
14. How are "Concentration" spells handled? Does taking damage auto-trigger a CON save in the engine?
15. How does `KnowledgeSnippet` usage integrate with identifying enemy spells (e.g., Counterspell logic)?
16. For "Ritual Casting", does the engine enforce the +10 minute casting time increase?
17. How do "Upcast" spells work? Does the action payload include `{ level: 3 }` for a Magic Missile?
18. How are "Area of Effect" (AoE) templates (Cone, Cube, Sphere) validated against the 3D grid?
19. How does the engine handle "Saving Throws" for multiple targets? Does it loop through all Entities in the AoE?
20. Does the `Spell` entity need a `script` field to define custom deterministic logic (e.g., `fireball.ts`)?

## Topic 3: Features, Traits & Resources (10 Questions)

21. How are "Class Features" (e.g., Sneak Attack) represented? Are they "Passive toggles" or "Active triggers"?
22. How does the engine track "Limited Use" features (e.g., Channel Divinity: 1/Short Rest)?
23. How are "Racial Traits" (e.g., Halfling Luck) automated? Does the engine auto-reroll 1s?
24. Do `Features` have a standard `hooks` system (e.g., `onAttack`, `onDamageTaken`)?
25. How is "Ki Points" or "Sorcery Points" storage standardized in the schema?
26. How do "Feats" integrate? Are they just another type of `Feature` entry?
27. How does the engine handle "Resistance/Immunity" dynamically? (e.g., Tiefling Fire Resistance vs Fireball)?
28. For "Legendary Actions", how does the engine inject them into the turn order?
29. How are "Conditions" (Blind, Poisoned) applied and expired? Durations in rounds/minutes?
30. Does `KnowledgeSnippet` allow the LLM to explain _why_ a feature worked (e.g., "His skin is immune to fire!")?

## Topic 4: Resting & Recovery (10 Questions)

31. How is a "Short Rest" executed? Does the engine just restore "Short Rest" resources and allow Hit Dice spending?
32. How are "Hit Dice" spent? Is it a transaction: `spend_hit_dice(amount: 1)` -> returns HP gain?
33. How does "Long Rest" reset heavily customizable resources (e.g., Wizard prepared spells)?
34. Does the engine prevent "Long Rest" if 24 hours haven't passed?
35. How is "Exhaustion" tracked and calculated?
36. Does "Arcane Recovery" (Wizard) trigger a UI prompt during Short Rest?
37. How do environmental hazards (Extreme Cold) interrupt rests?
38. How is "Sleeping" status handled? Auto-fail perception checks?
39. Does the engine snapshot state before rest in case of ambush?
40. How are "Temporary HP" cleared during rests?

## Topic 5: Leveling & Progression (10 Questions)

41. How is "XP" awarded? Is it per session, per monster kill, or milestone?
42. When `level` increases, does the engine auto-calculate new `maxHp` (fixed vs rolled)?
43. How are new `Spells` learned on level up? Does the UI query the allowed spell list?
44. How does "Multiclassing" affect the `CharacterSheet` structure? Array of classes?
45. How are "Proficiency Bonus" updates propagated to all skills/attacks?
46. How does "ASI" (Ability Score Improvement) update base stats? Direct mutation?
47. How are "Subclass" choices stored? Is it a separate relation or just a field on `Class`?
48. Does the engine validate prerequisites for Feats during leveling?
49. How is "Equipment" starter packs handled for new characters?
50. Can the LLM "suggest" level-up choices based on narrative?

## Topic 6: Inventory & Equipment (10 Questions)

51. How is "AC" (Armor Class) calculated dynamically (Armor + Shield + DEX cap)?
52. How does "Encumbrance" affect movement speed in the engine?
53. How are "Magic Items" properties (e.g., +1 Sword) merged into `structuredActions`?
54. How is "Attunement" tracked (Max 3 slots)?
55. How do "Consumables" (Potions) work? Action to "Consume"?
56. How is "Ammunition" tracking handled? Auto-decrement arrows?
57. How does the engine handle "Two-Handed" vs "Versatile" weapon logic?
58. Can items grant "Spells" (e.g., Wand of Magic Missiles)? How do they appear in `Spellbook`?
59. How is "Currency" (GP, SP, CP) stored? Simple object or itemized?
60. How does "Looting" work? Transferring items from Monster Inventory to Player Inventory?

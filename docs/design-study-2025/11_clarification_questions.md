# Design Study 11: 64 Critical Clarification Questions

This document serves as a "Stress Test" for the proposed design. It identifies 64 specific ambiguities and decision points that must be resolved to bridge the gap between "Concept" and "Implementation".

## I. Combat Mode & Turn Structure (8 Questions)

1.  **Turn Granularity**: If one player is in Combat (Turn-based) and another is far away (Real-time), how do we synchronize the clock? Do we force "Global Turns" or use "Local Time Bubbles"?

A: Force a global turn timer is the simpler and current solution we will tackle

2.  **Initiative Triggers**: What precise event transitions the game from "Free Roam" to "Combat Mode"? Is it an NLP intent ("I attack"), a proximity trigger, or a manual DM toggle?

A: The DM LLM Agent will decide when to transition to combat mode

3.  **Movement Budgeting**: In combat, grid movement is precise (5ft squares). Does the `NavMesh` enforce exact integer tile costs, or do we allow "fuzzy" movement (e.g., 2.5ft left over)?

A: The NavMesh will enforce exact integer tile costs we allow fuzzy moviments but floor to the nearest tile

4.  **Reaction Timing**: If a player wants to use a "Reaction" (e.g., Attack of Opportunity), does the engine pause the turn automatically, or must the player pre-declare triggers?

A: The engine will pause the turn automatically and will need to define who is the user(s) that can perform the action and the action itself so the DM LLM Agent can react to it after the player(s) declare its action

5.  **Simultaneous Turns**: For large battles, will we support "Side-based Initiative" (All players move, then all monsters move) to speed up play, or strictly individual sequential turns?

A: Individual sequential turns ONLY

6.  **Disengagement**: How does a player successfully "flee" combat to return to Travel Mode? Is there a specific distance or visual contact break required?

A: The player will need to declare its action to flee combat and the DM LLM Agent will decide when to transition to travel mode

7.  **Dynamic Terrain**: If a wall is destroyed during combat (Turn 3), does the `NavGraph` update immediately for the next player (Turn 4), or at the end of the round?

A: The first implementation of the game will not have dynamic terrain

8.  **Time Limits**: To keep momentum, will there be a configurable "Turn Timer" for players before their character automatically Dodges?

A: The first implementation of the game will not have time limits

## II. Exploration & Long Distance Travel (8 Questions)

9.  **Travel Scale**: In Non-Combat mode, is movement still 1:1 on the grid, or do we switch to a "Region Map" (Where 1 hex = 1 mile)?

A: The map should have a fixed scale of 1 square of the grid = 1 square of the map = 1 feet of the world

10. **Time Dilation**: "I walk to the next town" takes 4 hours in-game. Does the engine fast-forward the `WorldClock` instantly, or simulate the ticks?

A: The engine will fast-forward the WorldClock instantly but simulate the entropy system and some internal ticks

11. **Random Encounters**: During fast travel, how often does the engine query the `EntropySystem` for interruptions? Is it distance-based or time-based?

A: The engine will query the EntropySystem for interruptions every 100 feet of travel

12. **Party Tethering**: Can the party split up across different Chunks (miles apart) in Exploration Mode? If so, how does the frontend handle rendering two distant locations simultaneously?

A: Yes we allow the party to split up across different Chunks (miles apart) in Exploration Mode even in combat mode but still blocking everybody by now, the front end will always centralize the map over the player(s) that is/are the user(s)

13. **Stamina & Resources**: Does long-distance travel automatically deduct resources (Rations, Water)? If so, where is this data stored and tracked?

A: The engine will deduct resources (Rations, Water) every 100000 feet of travel

14. **Road Magnetism**: When clicking "Move to Town", does the pathfinding prefer established `RoadNodes` even if they are geometrically longer than a straight line through the woods?

A: Theres no click move to town all inputs and outputs NEED to be done via the chat and the user can only CTRL + click a tile to mention it to the DM all actions are done by the DM that will generate the dificulties and challenges and roll dices or challegns tools with programatic real randomesa and using the chars sheets and npc sheets as references on the calculations

15. **Interrupt Intents**: If a player is mid-travel (auto-walking) and types "Stop, I see something!", what is the latency/precision of that interrupt?

A: The game rolls up over the chat not over a real stream on things but a chat with turns specially on normal turns travel and so on it could be in parallel every play send its actions and the DM will react to it after the player(s) declare its action with the real things that happen as the player messages are just intentions buyt the DM collapse to the reality

16. **Fog governing**: In Exploration Mode, is Fog of War permanent, or does "Known Territory" remain visible on the map forever?

A: The Fog of War is permanent and the Known Territory is visible on the map forever and users start knowing a good ratious arountd the mapo

## III. The Entropy System (8 Questions)

17. **Definition of Entropy**: Does "Entropy" specifically refer to "Chaos/Corruption" spreading (narrative), or "System Decay" (walls crumbling, items rusting)?

A: Entropy will be a system to change weather, start a new random enconter of challenge X, change the environment, or any trigger or value like that that will thewn be sent to the DM when computing a round

18. **Quantification**: Is Entropy a global float value (`0.0 - 1.0`), a per-chunk value, or a per-entity stat?

A: It will be numbers or values on enums with several difrent things that will be sent to the DM when computing a round

19. **Entropy Triggers**: What increases Entropy? Player violence? Magic usage? Time passing?

A: Time passing

20. **Visual Manifestation**: How does high Entropy look? Do colors desaturate? Do textures distort? Do more "Void" particles appear?

A: The game will not have visual manifestation of entropy

21. **Gameplay Impact**: Does high Entropy alter RNG? (e.g., Critical Fails become more common, or Magic becomes unstable?)

A: The game will not have gameplay impact of entropy

22. **Reversibility**: Can players reduce Entropy? (e.g., Hallowing a shrine, repairing a structure, defeating a Boss?)

A: No

23. **Structure Decay**: Will the Entropy System automatically "age" structures? (e.g., A pristine castle becomes a ruin after 1000 game-years or high entropy spikes?)

A: No

24. **NPC Sanity**: Does high Entropy affect NPC behavior scripts? (e.g., Guards become hostile, merchants speak gibberish?)

A: No

## IV. World Generation & Infrastructure (8 Questions)

25. **Road Persistence**: If we generate a road using a "Macro Pass", what happens if a player builds a wall across it? Does the road graph break/reroute?

A: Players will not be able to change the map for now

26. **Vertical Highways**: How do we generate roads in vertical biomes (e.g., Bridges between mountain peaks, elevators in underdark cities)?

A: The map have Surface that includes any mountain and stuff like that, and 3 underlevels and 3 upperlevels that are connected to the surface by elevators and stairs only on structures the rest will be dirt/floor/ground or sky/clouds

27. **Biome Blending**: With the new "Zone" system, how do we handle the transition seams between a "Desert Zone" and a "Forest Zone" to look natural?

A: The map will be generated with zones that will be blended to look natural bvut moisture and elevation should handle it well

28. **Structure Foundations**: If a structure is stamped on a slope, does the generator build a "Cobblestone Foundation" down to the ground, or flatten the earth up to the floor?

A: The generator will build a "Cobblestone Foundation" down to the ground

29. **City Zoning**: Does the generator respect logical zoning (e.g., "No loud Blacksmiths next to the Library") or is it purely random density?

A: The generatorhave no zoning by now

30. **Water Logic**: Do rivers flow downhill based on the noise map? If a player digs a canal, will the water simulation fill it?

A: Players dont change map and we will have not direction on water by now

31. **Infinite Coordinates**: Do we have a hard cap on coordinate size (e.g., +/- 1,000,000) before floating point errors break the physics/rendering?

A: No

32. **Seed Versioning**: If we update the World Gen algorithm, do existing worlds break? How do we version-stamp chunks to know which generator created them?

A: We dont care with older versions and will wip it

## V. Verticality & 3D Physics (8 Questions)

33. **Camera Controls**: In a 3D tactical view, can players rotate the camera 360 degrees, or is it a fixed isometric angle?

FIxed isometric

34. **Roof Translucency**: When inside a building (Layer 0), how do we handle an enemy on the roof (Layer 1)? Are they rendered as a "Ghost"?

A: They will be rendered as a "Ghost"

35. **Falling Damage**: Is falling damage calculated purely by Z-difference? Do we account for "arrested falls" (grabbing a ledge)?

A: No

36. **Flying Entities**: How does a flying player select an arbitrary Z-level in the UI? (e.g., "Hover 15ft above the goblin").

A: DM will handle it with role play by now

37. **Line of Sight (Vertical)**: Can a player at the bottom of a well seeing someone at the top? Does the "Lid" of the well block LOS?

A: No

38. **Stacked Entities**: Can a player stand directly on top of another entity (e.g., riding a mount, or standing on a slime)?

A: No

39. **Projectiles**: Does a physical projectile (Arrow) have a parabolic arc that can go _over_ a low wall, or is it a straight raycast?

A: No

40. **Basement Lighting**: How do we handle "Sunlight" penetrating into deep Z-levels? Does the first solid block at Z=0 block all skylight below?

A: we dont handle it

## VI. Data, Persistence & Scale (8 Questions)

41. **Delta Size**: If a player burns down a forest (modifying 500 tiles/trees), does the `ChunkDelta` object become too large for a single Firestore document?

A: Player dontt change map by now

42. **Cache invalidation**: If we update the `RoadNetwork` in a region, do we force-regenerate all cached chunks in that region?

A: No and we dont regenerate it

43. **Entity Limits**: What is the hard limit of active Entities ticking in a room before performance degrades? (100? 1000?)

A: No limit by now

44. **History Storage**: Do we keep a history of map states? (e.g., "Time Travel" to see the map 50 turns ago?)

A: No

45. **Offline Progress**: Does the world simulate (Entropy, NPC movement) when no players are online?

A: No

46. **Asset Streaming**: For custom player-uploaded assets (tokens, textures), do we assume they are immediately available or implement lazy loading placeholders?

A: No

47. **Synchronization Rate**: Is 20Hz (50ms) realistic for Firestore+Socket writes, or should we aim for 4Hz (250ms) for map updates?

A: Game via turns dont need it only when DM change the map and entitryes at end of turns

48. **Sharding**: If all players congregate in one chunk, how do we handle the read/write hotspot on that single document?

A: Is not allow to be in same square

## VII. Natural Language & AI (8 Questions)

49. **Intent Ambiguity**: If the LLM returns "Ambiguous Target", does the game pause and ask the player via UI, or does the DM decide?

A: DM decide

50. **Narrative vs Rules**: If the LLM narration says "You chop the orc's head off" but the HP is not 0, which source of truth wins?

A: Char sheet is always the true, DM is the storyt teller the thing happen via code random dices and char sheets and then the DM interpret all it making sense and calling tools to help it

51. **Context Window**: How many previous turns of "Chat History" does the Movement Parser see? (e.g., to understand "I go back the way I came").

A: 50 turns

52. **Hallucination Safety**: How do we prevent the LLM from inventing map features ("I open the golden chest" when there is no chest)?

A: We dont prevent it

53. **DM Overrides**: Can the DM edit the JSON intent _before_ it executes if they disagree with the AI's interpretation?

A: No

54. **Multilingual Intents**: Do we maintain a separate mapping of "Verbs" for each language, or rely on the LLM to translate "Atacar" -> "ATTACK"?

A: We dont need it since all is via llm and chat typed by user in any language but the game have locales and a room a specific language thatt llms should return but the plater cn use wtcver we wants

55. **NPC Conversations**: Do NPCs have memory of previous conversations stored in their Entity data, or is it purely session-based?

A: Pure session based

56. **Sound Cues**: Can the NLP engine trigger client-side audio? (e.g., User: "I scream!" -> System: Plays scream.mp3).

A: No

## VIII. UX & Game Master Tools (8 Questions)

57. **Mobile Support**: Is the complex 3D grid and tactical UI expected to be playable on touch devices/phones?
    A:Yes
58. **Accessibility**: How do we visualize "Noise" or "Entropy" for colorblind users?

A: We dont need it 59. **DM Invisibility**: Can the DM explore the map in "Ghost Mode" without triggering awareness/events/entropy?

A: Yes anmd it always have a very big awarness on its context and messages 60. **Map Markers**: Can players place persistent "Notes" on the map (e.g., "Danger Here") that saves to the world data?

A: No

61. **Undo System**: If a player mis-clicks a move in Combat, can they "Undo" it if they haven't confirmed the action?

A: NO we dont need it

62. **Fog of War Preview**: Can the DM see "What the players see" to ensure they aren't revealing secrets accidentally?
    A: YEs

63. **Quick-Build**: Can the DM Drag-and-Drop a "Generic Encounter" (3 Goblins + Campfire) instantly during play?

Yes but it should be trigger mostly by entropy system and the DM will call a tool with a level of challenge and it will return a generic encounter with the monsters and so on PLUS the biome will also be a parameter so we grab bettere real monsters for it 64. **Loading Screens**: When teleporting via "Fast Travel" to a distant ungenerated region, how do we handle the generation delay UX?

A: We dont need it

---

## IX. Follow-up Stress Test (20 Additional Questions)

_New issues arising from the answers provided above._

65. **Mobile Precision (Touch UX)**: Given "1 grid = 1 foot" and "Mobile Support = Yes", a standard 5ft square is 5x5 tiles. On a phone screen, how do we distinguish a touch on tile `(100, 100)` vs `(100, 101)`? Do we need a "Zoom to Cursor" loupe?
66. **Global Timer Expiry**: If we "Force a global turn timer", what happens exactly when it hits 0? Does the player auto-dodge, or does the server just hang until the DM forces a skip?
67. **Disconnect Handling**: In a "Global Turn Timer" system with "Sequential Turns", if Player 3 disconnects, does the entire game stall for everyone else?
68. **Diagonal Mathematics**: With "Exact integer costs" + "Floor to nearest tile", does moving diagonally count as 1 tile (Chebyshev) or 1.41 tiles?
69. **Entropy Accumulator**: "Query every 100ft". Does walking back and forth in a 10ft room trigger entropy (Accumulated Distance), or strictly displacement from origin?
70. **Resource Threshold**: "Every 100,000 feet" (19 miles) = 1 Ration. This seems extremely generous (Standard D&D is 1 day/24 miles). Is this intended to make survival trivial?
71. **Hallucination UX**: If "We don't prevent" hallucinated chests, and a player says "I open the chest", does the DM Agent need a UI tool to "Spawn Item on the Fly" to honor the hallucination?
72. **Door Destruction**: "No dynamic terrain". If I cast _Shatter_ on a wooden door, does it remain an indestructible object that blocks movement forever?
73. **Ghost Awareness**: The DM is invisible but has "Big Awareness". Does the DM Agent see private whispers between players to police meta-gaming?
74. **Fat Finger Safety**: "No Undo" + "Mobile". If a player taps a trap tile by accident, is there truly no confirmation prompt?
75. **Turn Latency**: "Sequential Turns Only". In a large battle (20 monsters + 5 players), Player 1 might wait 5+ minutes for their next turn. Is this acceptable for the target "Game Loop"?
76. **Soft Caps**: "No Entity Limit". Firestore has a write limit of ~1/sec per document (hotspot). If 100 goblins move, that's 100 writes. Do we batch these updates?
77. **Fog Persistence**: "Fog is permanent". If I leave a room, does it go pitch black (no memory) or greyed out?
78. **Zone Transitions**: "Moisture/Elevation handles it". Does the biome generator support abrupt transitions (e.g., Oasis in Desert) or is it always smooth Perlin gradients?
79. **Sky Foundations**: "Cobblestone down to ground". If we have a floating Sky Castle at Z=100, does it generate a 100-block tall cobblestone pillar to Z=0?
80. **Context Window limit**: "50 turns". Detailed combat logs consume token counts rapidly. Do we summarize turns 1-40 into a "Previous State" paragraph to save context?
81. **Map Change vs Interaction**: "Players can't change map". Can they at least change _State_? (e.g., Open a Door, Pull a Lever, Light a Torch)?
82. **Waiting vs moving**: If "Time Passing" triggers Entropy, does using the "Wait" command (standing still) increase the Entropy counter?
83. **Chat Spam**: If players spam "I look around" 50 times in 1 minute, does that count as "50 turns" for the History buffer?
84. **Initiative Ordering**: "Individual Sequential". Is initiative strictly Agility-based, or does the DM Agent dynamically decide who goes next for dramatic effect (Popcorn Initiative)?

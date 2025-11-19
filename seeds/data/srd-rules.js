/**
 * D&D 5e SRD Rules - Curated Text for RAG
 * Source: D&D 5e SRD (Open Game License)
 */
export const SRD_RULES = [
    // ============================================================================
    // COMBAT RULES
    // ============================================================================
    {
        id: 'combat-initiative',
        title: 'Initiative',
        category: 'combat',
        content: `Initiative determines the order of turns in combat. When combat starts, every participant makes a Dexterity check to determine their place in the initiative order. The DM makes one roll for an entire group of identical creatures, so each member of the group acts at the same time. The DM ranks the combatants in order from the one with the highest Dexterity check total to the one with the lowest. This is the order (called the initiative order) in which they act during each round. The initiative order remains the same from round to round.`,
        tags: ['initiative', 'dexterity', 'combat-start', 'turn-order'],
    },
    {
        id: 'combat-actions-in-combat',
        title: 'Actions in Combat',
        category: 'combat',
        content: `When you take your action on your turn, you can take one of the actions presented here, an action you gained from your class or a special feature, or an action that you improvise. Many monsters have action options of their own in their stat blocks. Common actions include: Attack (make one melee or ranged attack), Cast a Spell, Dash (gain extra movement), Disengage (your movement doesn't provoke opportunity attacks), Dodge (attacks against you have disadvantage), Help (aid an ally), Hide (make a Dexterity (Stealth) check), Ready (prepare an action to trigger later), Search (make a Wisdom (Perception) or Intelligence (Investigation) check), Use an Object (interact with an object).`,
        tags: ['actions', 'attack', 'cast-spell', 'dash', 'disengage', 'dodge', 'help', 'hide'],
    },
    {
        id: 'combat-bonus-action',
        title: 'Bonus Actions',
        category: 'combat',
        content: `Various class features, spells, and other abilities let you take an additional action on your turn called a bonus action. You can take a bonus action only when a special ability, spell, or other feature of the game states that you can do something as a bonus action. You otherwise don't have a bonus action to take. You can take only one bonus action on your turn, so you must choose which bonus action to use when you have more than one available. You choose when to take a bonus action during your turn, unless the bonus action's timing is specified.`,
        tags: ['bonus-action', 'turn-economy'],
    },
    {
        id: 'combat-movement',
        title: 'Movement and Position',
        category: 'combat',
        content: `On your turn, you can move a distance up to your speed. You can use as much or as little of your speed as you like on your turn, following the rules here. Your movement can include jumping, climbing, and swimming. These different modes of movement can be combined with walking, or they can constitute your entire move. However you're moving, you deduct the distance of each part of your move from your speed until it is used up or until you are done moving. You can break up your movement on your turn, using some of your speed before and after your action.`,
        tags: ['movement', 'speed', 'positioning'],
    },
    {
        id: 'combat-attack-rolls',
        title: 'Attack Rolls',
        category: 'combat',
        content: `When you make an attack, your attack roll determines whether the attack hits or misses. To make an attack roll, roll a d20 and add the appropriate modifiers. If the total of the roll plus modifiers equals or exceeds the target's Armor Class (AC), the attack hits. The AC of a character is determined at character creation, whereas the AC of a monster is in its stat block. Modifiers to the roll typically include: ability modifier (Strength for melee attacks, Dexterity for ranged attacks), proficiency bonus (if proficient with the weapon).`,
        tags: ['attack-roll', 'd20', 'armor-class', 'to-hit'],
    },
    {
        id: 'combat-damage-rolls',
        title: 'Damage and Damage Rolls',
        category: 'combat',
        content: `Each weapon, spell, and harmful monster ability specifies the damage it deals. You roll the damage die or dice, add any modifiers, and apply the damage to your target. Magic weapons, special abilities, and other factors can grant a bonus to damage. When attacking with a weapon, you add your ability modifier—the same modifier used for the attack roll—to the damage. A spell tells you which dice to roll for damage and whether to add any modifiers. If a spell or other effect deals damage to more than one target at the same time, roll the damage once for all of them.`,
        tags: ['damage', 'damage-roll', 'modifiers'],
    },
    {
        id: 'combat-critical-hits',
        title: 'Critical Hits',
        category: 'combat',
        content: `When you score a critical hit, you get to roll extra dice for the attack's damage against the target. Roll all of the attack's damage dice twice and add them together. Then add any relevant modifiers as normal. To speed up play, you can roll all the damage dice at once. For example, if you score a critical hit with a dagger, roll 2d4 for the damage, rather than 1d4, and then add your relevant ability modifier.`,
        tags: ['critical-hit', 'nat-20', 'damage'],
    },
    {
        id: 'combat-advantage-disadvantage',
        title: 'Advantage and Disadvantage',
        category: 'combat',
        content: `Sometimes a special ability or spell tells you that you have advantage or disadvantage on an ability check, a saving throw, or an attack roll. When that happens, you roll a second d20 when you make the roll. Use the higher of the two rolls if you have advantage, and use the lower roll if you have disadvantage. If multiple situations affect a roll and each one grants advantage or imposes disadvantage on it, you don't roll more than one additional d20. If two favorable situations grant advantage, for example, you still roll only one additional d20. If circumstances cause a roll to have both advantage and disadvantage, you are considered to have neither of them, and you roll one d20.`,
        tags: ['advantage', 'disadvantage', 'roll-mechanics'],
    },
    {
        id: 'combat-opportunity-attacks',
        title: 'Opportunity Attacks',
        category: 'combat',
        content: `You can make an opportunity attack when a hostile creature that you can see moves out of your reach. To make the opportunity attack, you use your reaction to make one melee attack against the provoking creature. The attack occurs right before the creature leaves your reach. You can avoid provoking an opportunity attack by taking the Disengage action. You also don't provoke an opportunity attack when you teleport or when someone or something moves you without using your movement, action, or reaction.`,
        tags: ['opportunity-attack', 'reaction', 'movement', 'disengage'],
    },
    {
        id: 'combat-cover',
        title: 'Cover',
        category: 'combat',
        content: `Walls, trees, creatures, and other obstacles can provide cover during combat, making a target more difficult to harm. A target can benefit from cover only when an attack or other effect originates on the opposite side of the cover. There are three degrees of cover. Half cover (+2 to AC and Dexterity saving throws): A target has half cover if an obstacle blocks at least half of its body. Three-quarters cover (+5 to AC and Dexterity saving throws): A target has three-quarters cover if about three-quarters of it is covered by an obstacle. Total cover (can't be targeted directly): A target with total cover can't be targeted directly by an attack or a spell.`,
        tags: ['cover', 'armor-class', 'defense', 'positioning'],
    },
    // ============================================================================
    // ABILITY CHECKS AND SAVING THROWS
    // ============================================================================
    {
        id: 'abilities-ability-checks',
        title: 'Ability Checks',
        category: 'abilities',
        content: `An ability check tests a character's or monster's innate talent and training in an effort to overcome a challenge. The DM calls for an ability check when a character or monster attempts an action (other than an attack) that has a chance of failure. When the outcome is uncertain, the dice determine the results. For every ability check, the DM decides which of the six abilities is relevant to the task at hand and the difficulty of the task, represented by a Difficulty Class (DC). The more difficult a task, the higher its DC. To make an ability check, roll a d20 and add the relevant ability modifier. As with other d20 rolls, apply bonuses and penalties, and compare the total to the DC. If the total equals or exceeds the DC, the ability check is a success.`,
        tags: ['ability-check', 'skill-check', 'dc', 'd20'],
    },
    {
        id: 'abilities-saving-throws',
        title: 'Saving Throws',
        category: 'abilities',
        content: `A saving throw—also called a save—represents an attempt to resist a spell, a trap, a poison, a disease, or a similar threat. You don't normally decide to make a saving throw; you are forced to make one because your character or monster is at risk of harm. To make a saving throw, roll a d20 and add the appropriate ability modifier. The DC for a saving throw is determined by the effect that causes it. The result of a successful or failed saving throw is also detailed in the effect that allows the save.`,
        tags: ['saving-throw', 'save', 'resistance', 'd20'],
    },
    // ============================================================================
    // SPELLCASTING
    // ============================================================================
    {
        id: 'spells-casting-a-spell',
        title: 'Casting a Spell',
        category: 'spells',
        content: `When a character casts any spell, the same basic rules are followed, regardless of the character's class or the spell's effects. Each spell description begins with a block of information, including the spell's name, level, school of magic, casting time, range, components, and duration. The rest of a spell entry describes the spell's effect. Casting Time: Most spells require a single action to cast, but some spells require a bonus action, a reaction, or much more time to cast. Range: The target of a spell must be within the spell's range. Components: A spell's components are the physical requirements you must meet in order to cast it (Verbal, Somatic, Material). Duration: A spell's duration is the length of time the spell persists (Instantaneous, rounds, minutes, hours, concentration).`,
        tags: ['spellcasting', 'spell-components', 'casting-time', 'range', 'duration'],
    },
    {
        id: 'spells-concentration',
        title: 'Concentration',
        category: 'spells',
        content: `Some spells require you to maintain concentration in order to keep their magic active. If you lose concentration, such a spell ends. You lose concentration on a spell if you cast another spell that requires concentration, if you take damage (make a Constitution saving throw with DC = 10 or half the damage taken, whichever is higher), or if you are incapacitated or die. The DM might also decide that certain environmental phenomena automatically break concentration.`,
        tags: ['concentration', 'spell-duration', 'constitution-save'],
    },
    {
        id: 'spells-spell-attack-rolls',
        title: 'Spell Attack Rolls',
        category: 'spells',
        content: `Some spells require the caster to make an attack roll to determine whether the spell effect hits the intended target. Your attack bonus with a spell attack equals your spellcasting ability modifier + your proficiency bonus. Most spells that require attack rolls involve ranged attacks.`,
        tags: ['spell-attack', 'attack-roll', 'spellcasting-ability'],
    },
    {
        id: 'spells-saving-throws',
        title: 'Spell Saving Throws',
        category: 'spells',
        content: `Many spells specify that a target can make a saving throw to avoid some or all of a spell's effects. The spell specifies the ability that the target uses for the save and what happens on a success or failure. The DC to resist one of your spells equals 8 + your spellcasting ability modifier + your proficiency bonus + any special modifiers.`,
        tags: ['spell-save-dc', 'saving-throw', 'spellcasting'],
    },
    // ============================================================================
    // CONDITIONS
    // ============================================================================
    {
        id: 'condition-blinded',
        title: 'Blinded Condition',
        category: 'conditions',
        content: `A blinded creature can't see and automatically fails any ability check that requires sight. Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage.`,
        tags: ['blinded', 'condition', 'advantage', 'disadvantage'],
    },
    {
        id: 'condition-charmed',
        title: 'Charmed Condition',
        category: 'conditions',
        content: `A charmed creature can't attack the charmer or target the charmer with harmful abilities or magical effects. The charmer has advantage on any ability check to interact socially with the creature.`,
        tags: ['charmed', 'condition', 'social'],
    },
    {
        id: 'condition-frightened',
        title: 'Frightened Condition',
        category: 'conditions',
        content: `A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight. The creature can't willingly move closer to the source of its fear.`,
        tags: ['frightened', 'condition', 'fear', 'disadvantage'],
    },
    {
        id: 'condition-grappled',
        title: 'Grappled Condition',
        category: 'conditions',
        content: `A grappled creature's speed becomes 0, and it can't benefit from any bonus to its speed. The condition ends if the grappler is incapacitated or if an effect removes the grappled creature from the reach of the grappler or grappling effect.`,
        tags: ['grappled', 'condition', 'movement', 'speed'],
    },
    {
        id: 'condition-incapacitated',
        title: 'Incapacitated Condition',
        category: 'conditions',
        content: `An incapacitated creature can't take actions or reactions.`,
        tags: ['incapacitated', 'condition', 'actions'],
    },
    {
        id: 'condition-paralyzed',
        title: 'Paralyzed Condition',
        category: 'conditions',
        content: `A paralyzed creature is incapacitated and can't move or speak. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage. Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.`,
        tags: ['paralyzed', 'condition', 'critical-hit', 'advantage'],
    },
    {
        id: 'condition-poisoned',
        title: 'Poisoned Condition',
        category: 'conditions',
        content: `A poisoned creature has disadvantage on attack rolls and ability checks.`,
        tags: ['poisoned', 'condition', 'disadvantage'],
    },
    {
        id: 'condition-prone',
        title: 'Prone Condition',
        category: 'conditions',
        content: `A prone creature's only movement option is to crawl, unless it stands up and thereby ends the condition. The creature has disadvantage on attack rolls. An attack roll against the creature has advantage if the attacker is within 5 feet of the creature. Otherwise, the attack roll has disadvantage.`,
        tags: ['prone', 'condition', 'advantage', 'disadvantage', 'movement'],
    },
    {
        id: 'condition-restrained',
        title: 'Restrained Condition',
        category: 'conditions',
        content: `A restrained creature's speed becomes 0, and it can't benefit from any bonus to its speed. Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage. The creature has disadvantage on Dexterity saving throws.`,
        tags: ['restrained', 'condition', 'advantage', 'disadvantage', 'speed'],
    },
    {
        id: 'condition-stunned',
        title: 'Stunned Condition',
        category: 'conditions',
        content: `A stunned creature is incapacitated, can't move, and can speak only falteringly. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage.`,
        tags: ['stunned', 'condition', 'incapacitated', 'advantage'],
    },
    {
        id: 'condition-unconscious',
        title: 'Unconscious Condition',
        category: 'conditions',
        content: `An unconscious creature is incapacitated, can't move or speak, and is unaware of its surroundings. The creature drops whatever it's holding and falls prone. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage. Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.`,
        tags: ['unconscious', 'condition', 'prone', 'critical-hit', 'advantage'],
    },
    // ============================================================================
    // EXPLORATION
    // ============================================================================
    {
        id: 'exploration-perception-investigation',
        title: 'Perception and Investigation',
        category: 'exploration',
        content: `Wisdom (Perception) checks let you spot, hear, or otherwise detect the presence of something. It measures your general awareness of your surroundings and the keenness of your senses. Intelligence (Investigation) checks are used when you look around for clues and make deductions based on those clues. You might deduce the location of a hidden object, discern from the appearance of a wound what kind of weapon dealt it, or determine the weakest point in a tunnel that could cause it to collapse.`,
        tags: ['perception', 'investigation', 'wisdom', 'intelligence', 'detection'],
    },
    {
        id: 'exploration-stealth',
        title: 'Stealth and Hiding',
        category: 'exploration',
        content: `When you try to hide, make a Dexterity (Stealth) check. Until you are discovered or you stop hiding, that check's total is contested by the Wisdom (Perception) check of any creature that actively searches for signs of your presence. You can't hide from a creature that can see you clearly. An invisible creature can always try to hide. Signs of its passage might still be noticed, and it does have to stay quiet.`,
        tags: ['stealth', 'hiding', 'dexterity', 'invisibility'],
    },
];

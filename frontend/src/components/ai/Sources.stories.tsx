/**
 * Storybook stories for Sources component
 * Demonstrates citation display for RAG/retrieval systems
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Sources, SourcesTrigger, SourcesContent, Source } from './Sources';
import { Message, MessageContent, MessageHeader, MessageSender, MessageAvatar } from './Message';

const meta: Meta<typeof Sources> = {
  title: 'AI/Sources',
  component: Sources,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0a0e1a' }],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Sources>;

export const Default: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <Sources>
        <SourcesTrigger count={3} />
        <SourcesContent>
          <Source href="https://www.dndbeyond.com/spells/fireball" title="Fireball Spell Description" />
          <Source href="https://roll20.net/compendium/dnd5e/Fireball" title="Fireball - Roll20 Compendium" />
          <Source href="https://www.5esrd.com/spellcasting/all-spells/f/fireball/" title="Fireball - 5e SRD" />
        </SourcesContent>
      </Sources>
    </div>
  ),
};

export const SingleSource: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <Sources>
        <SourcesTrigger count={1} />
        <SourcesContent>
          <Source href="https://www.dndbeyond.com/classes/wizard" title="Wizard Class Guide" />
        </SourcesContent>
      </Sources>
    </div>
  ),
};

export const ManySources: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <Sources>
        <SourcesTrigger count={7} />
        <SourcesContent>
          <Source href="https://www.dndbeyond.com" title="D&D Beyond - Official Digital Toolset" />
          <Source href="https://roll20.net" title="Roll20 - Virtual Tabletop" />
          <Source href="https://www.5esrd.com" title="5e System Reference Document" />
          <Source href="https://criticalrole.fandom.com" title="Critical Role Wiki" />
          <Source href="https://forgottenrealms.fandom.com" title="Forgotten Realms Wiki" />
          <Source href="https://www.gmbinder.com" title="GM Binder - Homebrew Content" />
          <Source href="https://koboldpress.com" title="Kobold Press - Third Party Content" />
        </SourcesContent>
      </Sources>
    </div>
  ),
};

export const NoTitle: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <Sources>
        <SourcesTrigger count={2} />
        <SourcesContent>
          <Source href="https://www.dndbeyond.com/spells/fireball" />
          <Source href="https://roll20.net/compendium/dnd5e/Spells:Fireball" />
        </SourcesContent>
      </Sources>
    </div>
  ),
};

export const CustomContent: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <Sources>
        <SourcesTrigger count={3} />
        <SourcesContent>
          <Source href="https://www.dndbeyond.com/spells/fireball">
            <div>
              <p className="font-medium">Fireball - D&D Beyond</p>
              <p className="text-xs text-nebula-400">Official spell description with errata</p>
              <p className="text-xs text-nebula-500 mt-1">Last updated: Jan 2024</p>
            </div>
          </Source>
          <Source href="https://www.sageadvice.eu/fireball">
            <div>
              <p className="font-medium">Sage Advice on Fireball</p>
              <p className="text-xs text-nebula-400">Official rulings and clarifications</p>
            </div>
          </Source>
          <Source href="https://rpg.stackexchange.com/questions/fireball-aoe">
            <div>
              <p className="font-medium">Fireball AOE Discussion</p>
              <p className="text-xs text-nebula-400">Community discussion on area of effect</p>
            </div>
          </Source>
        </SourcesContent>
      </Sources>
    </div>
  ),
};

export const InMessage: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <Message from="DM">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar name="DM" />
            <MessageSender isDM>Dungeon Master</MessageSender>
          </div>
        </MessageHeader>
        <MessageContent>
          <p className="text-shadow-50 mb-3">
            Fireball is a 3rd-level evocation spell. When you cast it, you create a bright streak that flashes to a
            point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in
            a 20-foot-radius sphere centered on that point must make a Dexterity saving throw.
          </p>

          <Sources>
            <SourcesTrigger count={3} />
            <SourcesContent>
              <Source href="https://www.dndbeyond.com/spells/fireball" title="Fireball - D&D Beyond" />
              <Source href="https://www.5esrd.com/spellcasting/all-spells/f/fireball/" title="Fireball - 5e SRD" />
              <Source href="https://roll20.net/compendium/dnd5e/Fireball" title="Fireball - Roll20" />
            </SourcesContent>
          </Sources>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const BeforeResponse: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <Message from="DM">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar name="DM" />
            <MessageSender isDM>Dungeon Master</MessageSender>
          </div>
        </MessageHeader>
        <MessageContent>
          <Sources>
            <SourcesTrigger count={5} />
            <SourcesContent>
              <Source href="https://www.dndbeyond.com/spells" title="Spell Database" />
              <Source href="https://www.5esrd.com" title="5e SRD Rules" />
              <Source href="https://roll20.net/compendium" title="Roll20 Compendium" />
              <Source href="https://www.gmbinder.com/homebrew" title="Homebrew Spells" />
              <Source href="https://koboldpress.com/deep-magic" title="Deep Magic Supplement" />
            </SourcesContent>
          </Sources>

          <p className="mt-3 text-shadow-50">
            Based on the official rules and homebrew content, here are some powerful fire spells available to a
            7th-level wizard...
          </p>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const LongURLs: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <Sources>
        <SourcesTrigger count={3} />
        <SourcesContent>
          <Source
            href="https://www.dndbeyond.com/spells/fireball?source=phb&page=241&utm_source=google&utm_medium=organic"
            title="Fireball Spell - Player's Handbook"
          />
          <Source
            href="https://www.reddit.com/r/DnD/comments/abc123/detailed_discussion_about_fireball_spell_mechanics_and_edge_cases"
            title="Detailed Fireball Discussion"
          />
          <Source
            href="https://rpg.stackexchange.com/questions/123456/how-does-fireball-interact-with-cover-and-line-of-sight"
            title="Fireball and Line of Sight"
          />
        </SourcesContent>
      </Sources>
    </div>
  ),
};

export const Collapsed: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <Sources>
        <SourcesTrigger count={4} />
        <SourcesContent>
          <Source href="https://www.dndbeyond.com" title="D&D Beyond" />
          <Source href="https://roll20.net" title="Roll20" />
          <Source href="https://www.5esrd.com" title="5e SRD" />
          <Source href="https://koboldpress.com" title="Kobold Press" />
        </SourcesContent>
      </Sources>
      <p className="mt-4 text-sm text-shadow-400">Click to expand and see the sources</p>
    </div>
  ),
};

export const RealWorldExample: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <Message from="DM">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar name="DM" />
            <MessageSender isDM>Dungeon Master</MessageSender>
          </div>
        </MessageHeader>
        <MessageContent>
          <p className="text-shadow-50 mb-3">
            The ancient city of Myth Drannor was once the pinnacle of elven civilization in Faerûn. Founded in -2550 DR,
            it stood as a beacon of cooperation between the races until its fall in 714 DR during the Weeping War.
          </p>

          <p className="text-shadow-50 mb-3">
            The city was protected by a powerful mythal—a permanent magical field—that still functions to this day,
            though its powers are diminished. Many adventurers have sought the legendary treasures said to lie within
            the ruins, but few return.
          </p>

          <Sources>
            <SourcesTrigger count={4} />
            <SourcesContent>
              <Source
                href="https://forgottenrealms.fandom.com/wiki/Myth_Drannor"
                title="Myth Drannor - Forgotten Realms Wiki"
              />
              <Source
                href="https://www.dndbeyond.com/sources/scag/sword-coast-and-the-north#MythDrannor"
                title="Sword Coast Adventurer's Guide"
              />
              <Source
                href="https://www.dmsguild.com/product/28234/City-of-the-Spider-Queen"
                title="City of the Spider Queen (Adventure Module)"
              />
              <Source
                href="https://forgottenrealms.fandom.com/wiki/Weeping_War"
                title="The Weeping War - Historical Context"
              />
            </SourcesContent>
          </Sources>

          <p className="mt-3 text-shadow-50">
            Your party stands at the edge of the forest, gazing upon the overgrown ruins. What do you do?
          </p>
        </MessageContent>
      </Message>
    </div>
  ),
};

/**
 * @file frontend/src/components/ui/typography.stories.tsx
 * @note Keep stories in sync with typography base classes for visual QA.
 */

import type { Meta, StoryObj } from '@storybook/react';

import {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyLarge,
  TypographyLead,
  TypographyList,
  TypographyMuted,
  TypographyP,
  TypographySmall,
  TypographyTable,
  TypographyTableContainer,
} from './typography';

const meta = {
  title: 'UI/Typography',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <div className="space-y-8">
      <section className="space-y-4">
        <TypographyLead>Codex Annals</TypographyLead>
        <TypographyH1>Chronicles of the Starforge</TypographyH1>
        <TypographyP>
          The Starforge hums with a cadence older than the realms themselves, etching brilliant sigils into the void
          while scholars transcribe every resonance.
        </TypographyP>
      </section>

      <section className="space-y-3">
        <TypographyH2>Arcanum Council Notes</TypographyH2>
        <TypographyH3>Agenda Highlights</TypographyH3>
        <TypographyH4>Key Motions</TypographyH4>
        <TypographyList>
          <li>Approve restoration budget for the Sapphire Observatory.</li>
          <li>Authorize portal calibration above the Astral Causeway.</li>
          <li>Commission field report from the Vanguard expedition.</li>
        </TypographyList>
      </section>

      <section className="space-y-4">
        <TypographyBlockquote>
          &ldquo;From the first ember we charted the firmament, and in every constellation we found a mirror of our own
          resolve.&rdquo;
        </TypographyBlockquote>
        <TypographyP>
          Archmage Serune concluded the session with an admonition to document rituals in deterministic format using{' '}
          <TypographyInlineCode>task()</TypographyInlineCode> bindings to avoid chronospatial drift.
        </TypographyP>
      </section>

      <section className="space-y-2">
        <TypographyLarge>Field Dispatch Summary</TypographyLarge>
        <TypographySmall>Reference Archive #4472-NEB</TypographySmall>
        <TypographyMuted>Compiled for review by the LangGraph audit circle.</TypographyMuted>
      </section>
    </div>
  ),
};

export const DataTable: Story = {
  render: () => (
    <TypographyTableContainer>
      <TypographyTable>
        <thead>
          <tr>
            <th scope="col">Phase</th>
            <th scope="col">Result</th>
            <th scope="col">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Invocation</td>
            <td>Stabilized</td>
            <td>12:04:33</td>
          </tr>
          <tr>
            <td>Traversal</td>
            <td>In Progress</td>
            <td>12:06:18</td>
          </tr>
          <tr>
            <td>Resolution</td>
            <td>Queued</td>
            <td>--</td>
          </tr>
        </tbody>
      </TypographyTable>
    </TypographyTableContainer>
  ),
};

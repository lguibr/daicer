/**
 * Seed Control Component
 * Reusable seed input with randomize button
 */

import React from 'react';
import Input from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export interface SeedControlProps {
  seed: string;
  onSeedChange: (seed: string) => void;
  label?: string;
}

export function SeedControl({ seed, onSeedChange, label = 'Seed' }: SeedControlProps) {
  const randomize = () => {
    const randomSeed = Math.random().toString(36).substring(2, 15);
    onSeedChange(randomSeed);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium min-w-[60px]">{label}:</label>
      <Input
        type="text"
        value={seed}
        onChange={(e) => onSeedChange(e.target.value)}
        className="flex-1"
        placeholder="Enter seed..."
      />
      <Button onClick={randomize} variant="outline" size="icon" title="Randomize seed">
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}

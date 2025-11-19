/**
 * Debug Stats Component
 * Shows generation statistics and performance metrics
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface DebugStatsProps {
  stats: Record<string, string | number>;
}

export function DebugStats({ stats }: DebugStatsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{key}:</span>
            <span className="font-mono">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

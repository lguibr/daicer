import { EntityFeature } from '@daicer/engine';

interface ClassFeatureSource {
  name: string;
  description: string;
  level: number;
  // usage?
}

interface RaceFeatureSource {
  name: string;
  description: string;
}

interface HydrationContext {
  characterLevel: number;
  classFeatures: ClassFeatureSource[];
  raceFeatures: RaceFeatureSource[];
}

export function hydrateFeatures(ctx: HydrationContext): EntityFeature[] {
  const features: EntityFeature[] = [];

  // 1. Race Features (Always active)
  for (const f of ctx.raceFeatures) {
    features.push({
      name: f.name,
      description: f.description,
      // Race features usually constant, simplistic mapping for now.
    });
  }

  // 2. Class Features (Filtered by Level)
  for (const f of ctx.classFeatures) {
    if (f.level <= ctx.characterLevel) {
      features.push({
        name: f.name,
        description: f.description,
        // Logic for usage would go here if data source has it
      });
    }
  }

  return features;
}

export const FeatureHydrator = {
  hydrateFeatures,
};

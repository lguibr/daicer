import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Label from '@/components/ui/label';
import Input from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Enums from Schema
const WORLD_SIZES = ['intimate', 'small', 'medium', 'large', 'vast', 'epic'];
const ADVENTURE_LENGTHS = ['flash', 'short', 'medium', 'long', 'epic', 'legendary'];
const DIFFICULTIES = ['storyteller', 'easy', 'medium', 'challenging', 'gritty', 'deadly'];

// DM Style Maps
const VERBOSITY_MAP = ['Whisper (Minimal)', 'Terse', 'Measured', 'Storied', 'Lyrical', 'Epic', 'Operatic (Grand)'];
const DETAIL_MAP = ['Minimal', 'Lean', 'Focused', 'Balanced', 'Textured', 'Immersive', 'Cinematic'];
const ENGAGEMENT_MAP = ['Observer', 'Facilitator', 'Guide', 'Collaborator', 'Showrunner', 'Auteur', 'Oracle'];
const NARRATIVE_MAP = ['Sandbox', 'Reactive', 'Responsive', 'Structured', 'Plotted', 'Storied', 'Authored'];

interface DMSetupProps {
  onCreate: (data: any) => void;
  onCancel: () => void;
}

export function DMSetup({ onCreate, onCancel }: DMSetupProps) {
  const [formData, setFormData] = useState({
    theme: '',
    setting: '',
    tone: '',
    worldSize: 'small',
    adventureLength: 'short',
    difficulty: 'easy',
    style: {
      verbosity: 3,
      detail: 3,
      engagement: 3,
      narrative: 3,
      specialMode: '',
      customDirectives: '',
    },
  });

  const handleCreate = () => {
    onCreate(formData);
  };

  const updateStyle = (key: string, val: number | string) => {
    setFormData((prev) => ({
      ...prev,
      style: { ...prev.style, [key]: val },
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-aurora-500 tracking-tighter">CREATE NEW CAMPAIGN</h1>
        <p className="text-muted-foreground">Configure your AI Dungeon Master and World Initialization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Scope & Frame */}
        <div className="space-y-6">
          <Card className="bg-midnight-900 border-midnight-800">
            <CardHeader>
              <CardTitle className="text-lg text-aurora-400">Campaign Scope</CardTitle>
              <CardDescription>Set the scale and challenge of your adventure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>World Size</Label>
                  <Select value={formData.worldSize} onValueChange={(v) => setFormData({ ...formData, worldSize: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORLD_SIZES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Adventure Length</Label>
                  <Select
                    value={formData.adventureLength}
                    onValueChange={(v) => setFormData({ ...formData, adventureLength: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ADVENTURE_LENGTHS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-midnight-900 border-midnight-800">
            <CardHeader>
              <CardTitle className="text-lg text-aurora-400">Story Frame</CardTitle>
              <CardDescription>Define the genre and atmosphere</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme / Genre</Label>
                <Input
                  placeholder="e.g. High Fantasy, Cyberpunk, Gothic Horror"
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Setting Details</Label>
                <Input
                  placeholder="e.g. A floating city above an acid sea..."
                  value={formData.setting}
                  onChange={(e) => setFormData({ ...formData, setting: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tone</Label>
                <Input
                  placeholder="e.g. Dark, Whimsical, Gritty"
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: DM Style */}
        <Card className="bg-midnight-900 border-midnight-800 h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg text-aurora-400">DM Personality & Style</CardTitle>
            <CardDescription>Configure how the AI narrates the game</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-1">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label>Verbosity</Label>
                  <span className="text-aurora-300">{VERBOSITY_MAP[formData.style.verbosity]}</span>
                </div>
                <Slider
                  value={[formData.style.verbosity]}
                  min={0}
                  max={6}
                  step={1}
                  onValueChange={([v]) => updateStyle('verbosity', v)}
                  className="cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label>Descriptive Detail</Label>
                  <span className="text-aurora-300">{DETAIL_MAP[formData.style.detail]}</span>
                </div>
                <Slider
                  value={[formData.style.detail]}
                  min={0}
                  max={6}
                  step={1}
                  onValueChange={([v]) => updateStyle('detail', v)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label>Engagement Level</Label>
                  <span className="text-aurora-300">{ENGAGEMENT_MAP[formData.style.engagement]}</span>
                </div>
                <Slider
                  value={[formData.style.engagement]}
                  min={0}
                  max={6}
                  step={1}
                  onValueChange={([v]) => updateStyle('engagement', v)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label>Narrative Control</Label>
                  <span className="text-aurora-300">{NARRATIVE_MAP[formData.style.narrative]}</span>
                </div>
                <Slider
                  value={[formData.style.narrative]}
                  min={0}
                  max={6}
                  step={1}
                  onValueChange={([v]) => updateStyle('narrative', v)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-midnight-800 space-y-4">
              <div className="space-y-2">
                <Label>Special Mode (Optional)</Label>
                <Input
                  placeholder="e.g. Shakespearean, Noir Detective"
                  value={formData.style.specialMode}
                  onChange={(e) => updateStyle('specialMode', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Custom Directives</Label>
                <Input
                  placeholder="e.g. Always check for traps first..."
                  value={formData.style.customDirectives}
                  onChange={(e) => updateStyle('customDirectives', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-midnight-800">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleCreate} className="bg-aurora-600 hover:bg-aurora-500 text-midnight-950 font-bold px-8">
          Create Campaign
        </Button>
      </div>
    </div>
  );
}

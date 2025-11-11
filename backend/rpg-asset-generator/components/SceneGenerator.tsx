import React, { useState, useMemo } from 'react';
import type { FinalAvatarImages, GridData, CellSelection, AvatarImage } from '../types';
import { editImage } from '../services/geminiService';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Loader } from './ui/Loader';

interface SceneGeneratorProps {
  finalAvatarImages: FinalAvatarImages | null;
  gridData: GridData | null;
  selectedCell: CellSelection | null;
}

const CORE_STYLE_PROMPT =
  'dark fantasy art, atmospheric lighting, style of classic D&D illustrations mixed with Magic: The Gathering card art, high detail, moody, cohesive with a dark theme';

const ImageDisplay: React.FC<{
  src: string;
  alt: string;
  onClick?: () => void;
  isSelected?: boolean;
  disabled: boolean;
}> = ({ src, alt, onClick, isSelected, disabled }) => (
  <img
    src={src}
    alt={alt}
    onClick={disabled ? undefined : onClick}
    className={`rounded-lg object-cover aspect-square transition-all ${!disabled ? 'cursor-pointer hover:scale-105 hover:ring-4 ring-slate-400' : 'opacity-50 cursor-not-allowed'} ${isSelected ? 'ring-4 ring-green-500 scale-105' : 'ring-2 ring-slate-700'}`}
  />
);

export const SceneGenerator: React.FC<SceneGeneratorProps> = ({ finalAvatarImages, gridData, selectedCell }) => {
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarImage | null>(null);
  const [prompt, setPrompt] = useState<string>('looking cautious and holding a torch.');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedScene, setGeneratedScene] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = useMemo(
    () => finalAvatarImages && gridData && selectedCell,
    [finalAvatarImages, gridData, selectedCell]
  );

  const handleGenerateScene = async () => {
    if (!canGenerate || !selectedAvatar) {
      setError('Please ensure an avatar, grid, and cell are selected.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedScene(null);

    const cellContext = gridData[selectedCell.y][selectedCell.x].description;
    const fullPrompt = `Render the final image in this style: [${CORE_STYLE_PROMPT}]. Combine the character from the provided image with a new background. The background should be: "${cellContext}". The character is now ${prompt}. IMPORTANT: Maintain the character's specific features, clothing, and pose, but integrate them seamlessly into the new scene with the specified art style.`;

    // We need to strip the "data:image/png;base64," prefix for the API
    const base64Data = selectedAvatar.imageData.split(',')[1];

    try {
      const result = await editImage(base64Data, 'image/png', fullPrompt);
      setGeneratedScene(`data:image/png;base64,${result}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scene Illustrator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!canGenerate && (
          <div className="text-center p-4 bg-slate-800 rounded-lg text-slate-400">
            <p>Please generate avatars and a grid map first, then select a cell on the map.</p>
          </div>
        )}

        <div className="space-y-4">
          <h4 className="font-semibold">Step 1: Select an Avatar</h4>
          <div className="grid grid-cols-3 gap-4">
            {finalAvatarImages ? (
              <>
                <ImageDisplay
                  disabled={!canGenerate}
                  src={finalAvatarImages.portrait.imageData}
                  alt="Portrait"
                  isSelected={selectedAvatar?.imageData === finalAvatarImages.portrait.imageData}
                  onClick={() => setSelectedAvatar(finalAvatarImages.portrait)}
                />
                <ImageDisplay
                  disabled={!canGenerate}
                  src={finalAvatarImages.upperBody.imageData}
                  alt="Upper Body"
                  isSelected={selectedAvatar?.imageData === finalAvatarImages.upperBody.imageData}
                  onClick={() => setSelectedAvatar(finalAvatarImages.upperBody)}
                />
                <ImageDisplay
                  disabled={!canGenerate}
                  src={finalAvatarImages.fullBody.imageData}
                  alt="Full Body"
                  isSelected={selectedAvatar?.imageData === finalAvatarImages.fullBody.imageData}
                  onClick={() => setSelectedAvatar(finalAvatarImages.fullBody)}
                />
              </>
            ) : (
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-slate-800 rounded-lg flex items-center justify-center text-slate-500"
                >
                  No Avatar
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scene-prompt">Step 2: Describe the Action</Label>
          <Input
            id="scene-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., casting a spell, hiding in the shadows"
            disabled={!canGenerate}
          />
          {selectedCell && gridData && (
            <p className="text-sm text-slate-400">Location: {gridData[selectedCell.y][selectedCell.x].description}</p>
          )}
        </div>

        <Button onClick={handleGenerateScene} disabled={!canGenerate || !selectedAvatar || isLoading}>
          {isLoading && <Loader className="mr-2 h-4 w-4" />}
          Generate Scene
        </Button>

        {error && <p className="text-red-500">{error}</p>}

        {isLoading && <div className="text-center p-8">Generating scene... this can take a moment.</div>}

        {generatedScene && (
          <div className="space-y-4">
            <h4 className="font-semibold">Generated Scene</h4>
            <img
              src={generatedScene}
              alt="Generated scene"
              className="rounded-lg w-full max-w-lg mx-auto ring-2 ring-slate-700"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

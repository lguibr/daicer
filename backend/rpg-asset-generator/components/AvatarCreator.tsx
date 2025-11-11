import React, { useState } from 'react';
import type { CharacterSheet, AvatarImage, FinalAvatarImages } from '../types';
import { generateImage, editImage } from '../services/geminiService';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Loader } from './ui/Loader';

interface AvatarCreatorProps {
  onAvatarsGenerated: (images: FinalAvatarImages) => void;
}

const CORE_STYLE_PROMPT =
  'dark fantasy art, atmospheric lighting, style of classic D&D illustrations mixed with Magic: The Gathering card art, high detail, moody, cohesive with a dark theme';

const ImageDisplay: React.FC<{ src: string; alt: string; onClick?: () => void; isSelected?: boolean }> = ({
  src,
  alt,
  onClick,
  isSelected,
}) => (
  <img
    src={src}
    alt={alt}
    onClick={onClick}
    className={`rounded-lg object-cover aspect-square transition-all ${onClick ? 'cursor-pointer hover:scale-105 hover:ring-4 ring-slate-400' : ''} ${isSelected ? 'ring-4 ring-green-500 scale-105' : 'ring-2 ring-slate-700'}`}
  />
);

export const AvatarCreator: React.FC<AvatarCreatorProps> = ({ onAvatarsGenerated }) => {
  const [description, setDescription] = useState<CharacterSheet>({
    race: 'Human',
    class: 'Fighter',
    gender: 'Female',
    hair: 'long brown hair',
    eyes: 'green eyes',
    clothes: 'leather armor',
    height: 'average height',
    weight: 'athletic build',
    features: 'a small scar over her left eye',
  });
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [initialOptions, setInitialOptions] = useState<AvatarImage[]>([]);
  const [selectedOption, setSelectedOption] = useState<AvatarImage | null>(null);
  const [isLoadingFinal, setIsLoadingFinal] = useState(false);
  const [finalImages, setFinalImages] = useState<FinalAvatarImages | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDescription((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateInitial = async () => {
    setIsLoadingInitial(true);
    setError(null);
    setInitialOptions([]);
    setSelectedOption(null);
    setFinalImages(null);

    const basePrompt = `RPG character, ${description.gender} ${description.race} ${description.class}, with ${description.hair}, ${description.eyes}, wearing ${description.clothes}, featuring ${description.features}`;
    const fullPrompt = `${basePrompt}. ${CORE_STYLE_PROMPT}. An extreme close-up portrait, hyper-focused on the face with a fisheye lens perspective, as if zoomed to the maximum. Capturing only the facial features with intense detail. Almost no neck or background visible. Centered, dramatic lighting. No borders, no frames, no text.`;

    try {
      // Generate 3 variations sequentially to avoid hitting API rate limits.
      const generatedOptions: AvatarImage[] = [];
      for (let i = 0; i < 3; i++) {
        const imageData = await generateImage(fullPrompt, 1.0);
        const newOption = {
          prompt: basePrompt,
          imageData: `data:image/png;base64,${imageData}`,
        };
        generatedOptions.push(newOption);
        setInitialOptions([...generatedOptions]); // Update UI progressively to show progress
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const handleSelectOption = async (option: AvatarImage) => {
    if (isLoadingFinal) return;
    setSelectedOption(option);
    setIsLoadingFinal(true);
    setError(null);
    setFinalImages(null);
    setLoadingMessage('');

    try {
      const base64Data = option.imageData.split(',')[1];

      const fullBodyPrompt = `Using the provided character image as a reference, create a full body portrait showing the character from feet to head. The character, a ${description.race} ${description.class}, should be performing a dynamic action that is culturally relevant to their background. Integrate them into a scene that fits this style: [${CORE_STYLE_PROMPT}]. Ensure the final image is high resolution, with no borders, frames or text.`;
      const upperBodyPrompt = `Using the provided character image as a reference, create a detailed upper body portrait (from the waist up). The character should be in a natural pose. Integrate them into a scene that fits this style: [${CORE_STYLE_PROMPT}]. Ensure the final image is high resolution, with no borders, frames or text.`;

      // Generate final images sequentially to avoid rate limits
      setLoadingMessage('Generating full body portrait...');
      const fullBody = await editImage(base64Data, 'image/png', fullBodyPrompt, 0.4);

      setLoadingMessage('Generating upper body portrait...');
      const upperBody = await editImage(base64Data, 'image/png', upperBodyPrompt, 0.4);

      const final: FinalAvatarImages = {
        fullBody: { prompt: fullBodyPrompt, imageData: `data:image/png;base64,${fullBody}` },
        portrait: option, // The selected face is the final portrait
        upperBody: { prompt: upperBodyPrompt, imageData: `data:image/png;base64,${upperBody}` },
      };

      setFinalImages(final);
      onAvatarsGenerated(final);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoadingFinal(false);
      setLoadingMessage('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(description).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="capitalize">
                {key}
              </Label>
              <Input id={key} name={key} value={value} onChange={handleInputChange} />
            </div>
          ))}
        </div>

        <Button onClick={handleGenerateInitial} disabled={isLoadingInitial}>
          {isLoadingInitial && <Loader className="mr-2 h-4 w-4" />}
          Generate Initial Avatars
        </Button>

        {error && <p className="text-red-500">{error}</p>}

        {(isLoadingInitial || initialOptions.length > 0) && (
          <div className="space-y-4">
            <h4 className="font-semibold">
              {isLoadingInitial ? `Generating Faces (${initialOptions.length}/3)...` : 'Step 1: Select a Face'}
            </h4>
            <div className={`grid grid-cols-3 gap-4 ${isLoadingInitial ? 'cursor-not-allowed' : ''}`}>
              {initialOptions.map((option, index) => (
                <ImageDisplay
                  key={index}
                  src={option.imageData}
                  alt={`Option ${index + 1}`}
                  onClick={() => !isLoadingInitial && handleSelectOption(option)}
                  isSelected={selectedOption?.imageData === option.imageData}
                />
              ))}
              {isLoadingInitial &&
                [...Array(3 - initialOptions.length)].map((_, i) => (
                  <div key={i} className="aspect-square bg-slate-800 rounded-lg flex items-center justify-center">
                    <Loader />
                  </div>
                ))}
            </div>
          </div>
        )}

        {isLoadingFinal && <div className="text-center p-4">{loadingMessage || 'Generating final portraits...'}</div>}

        {finalImages && (
          <div className="space-y-4">
            <h4 className="font-semibold">Step 2: Your Final Avatars</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <ImageDisplay src={finalImages.portrait.imageData} alt="Portrait" />
                <p className="text-sm mt-2 text-slate-400">Portrait</p>
              </div>
              <div className="text-center">
                <ImageDisplay src={finalImages.upperBody.imageData} alt="Upper Body" />
                <p className="text-sm mt-2 text-slate-400">Upper Body</p>
              </div>
              <div className="text-center">
                <ImageDisplay src={finalImages.fullBody.imageData} alt="Full Body" />
                <p className="text-sm mt-2 text-slate-400">Full Body</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

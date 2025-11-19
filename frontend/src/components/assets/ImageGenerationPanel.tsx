/**
 * ImageGenerationPanel Component
 * Panel for generating 2D images with different modes
 */

import { useState } from 'react';
import { Sparkles, Upload } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import Textarea from '../ui/textarea';
import Label from '../ui/label';
import { generateImage, updateAsset } from '../../services/assetService';

interface ImageGenerationPanelProps {
  assetId: string;
  collectionMode?: string;
  onSuccess?: (imageUrl: string) => void;
}

type GenerationMode = 'text-to-image' | 'variations' | 'batch-transform';

export function ImageGenerationPanel({ assetId, collectionMode, onSuccess }: ImageGenerationPanelProps) {
  const [mode, setMode] = useState<GenerationMode>((collectionMode as GenerationMode) || 'text-to-image');
  const [prompt, setPrompt] = useState('');
  const [masterDescription, setMasterDescription] = useState('');
  const [variationDescription, setVariationDescription] = useState('');
  const [transformPrompt, setTransformPrompt] = useState('');
  const [baseImage, setBaseImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBaseImage(file);
    }
  };

  const handleGenerate = async () => {
    setError('');
    setLoading(true);

    try {
      let result;

      if (mode === 'text-to-image') {
        if (!prompt.trim()) {
          throw new Error('Prompt is required');
        }
        result = await generateImage(assetId, prompt);
      } else if (mode === 'variations') {
        if (!baseImage || !masterDescription.trim() || !variationDescription.trim()) {
          throw new Error('Base image, master description, and variation description are required');
        }
        // TODO: Implement variation generation with file upload
        throw new Error('Variation mode not yet implemented');
      } else if (mode === 'batch-transform') {
        if (!baseImage || !transformPrompt.trim()) {
          throw new Error('Base image and transform prompt are required');
        }
        // TODO: Implement transform with file upload
        throw new Error('Transform mode not yet implemented');
      }

      if (result) {
        await updateAsset(assetId, { status: 'done', storageUrl: result.imageUrl });
        onSuccess?.(result.imageUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      await updateAsset(assetId, { status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
      <CardContent className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Generate Image</h3>

        {/* Mode Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('text-to-image')}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm transition-all ${
              mode === 'text-to-image'
                ? 'border-accent bg-accent/20 text-accent'
                : 'border-midnight-500 bg-midnight-800/50 text-shadow-300 hover:border-accent/50'
            }`}
          >
            Text-to-Image
          </button>
          <button
            type="button"
            onClick={() => setMode('variations')}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm transition-all ${
              mode === 'variations'
                ? 'border-accent bg-accent/20 text-accent'
                : 'border-midnight-500 bg-midnight-800/50 text-shadow-300 hover:border-accent/50'
            }`}
          >
            Variations
          </button>
          <button
            type="button"
            onClick={() => setMode('batch-transform')}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm transition-all ${
              mode === 'batch-transform'
                ? 'border-accent bg-accent/20 text-accent'
                : 'border-midnight-500 bg-midnight-800/50 text-shadow-300 hover:border-accent/50'
            }`}
          >
            Transform
          </button>
        </div>

        {/* Text-to-Image Mode */}
        {mode === 'text-to-image' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="prompt" className="text-shadow-200">
                Image Prompt *
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A magical forest with glowing mushrooms and fireflies..."
                className="mt-1 border-midnight-500 bg-midnight-800/50 text-white placeholder:text-shadow-500"
                rows={4}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-shadow-500">Be specific and descriptive for best results</p>
            </div>
          </div>
        )}

        {/* Variations Mode */}
        {mode === 'variations' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="baseImage" className="text-shadow-200">
                Base Image *
              </Label>
              <div className="mt-1">
                <label
                  htmlFor="baseImage"
                  className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-midnight-500 bg-midnight-800/50 p-6 transition-colors hover:border-accent/50"
                >
                  <div className="text-center">
                    <Upload className="mx-auto mb-2 h-8 w-8 text-shadow-600" />
                    <p className="text-sm text-white">{baseImage ? baseImage.name : 'Click to upload image'}</p>
                    <p className="mt-1 text-xs text-shadow-500">PNG, JPG up to 10MB</p>
                  </div>
                  <input
                    id="baseImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="masterDesc" className="text-shadow-200">
                Master Description *
              </Label>
              <Textarea
                id="masterDesc"
                value={masterDescription}
                onChange={(e) => setMasterDescription(e.target.value)}
                placeholder="A medieval knight character..."
                className="mt-1 border-midnight-500 bg-midnight-800/50 text-white placeholder:text-shadow-500"
                rows={2}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="varDesc" className="text-shadow-200">
                Variation Description *
              </Label>
              <Textarea
                id="varDesc"
                value={variationDescription}
                onChange={(e) => setVariationDescription(e.target.value)}
                placeholder="Now wearing red armor instead of silver..."
                className="mt-1 border-midnight-500 bg-midnight-800/50 text-white placeholder:text-shadow-500"
                rows={2}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Transform Mode */}
        {mode === 'batch-transform' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="transformImage" className="text-shadow-200">
                Image to Transform *
              </Label>
              <div className="mt-1">
                <label
                  htmlFor="transformImage"
                  className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-midnight-500 bg-midnight-800/50 p-6 transition-colors hover:border-accent/50"
                >
                  <div className="text-center">
                    <Upload className="mx-auto mb-2 h-8 w-8 text-shadow-600" />
                    <p className="text-sm text-white">{baseImage ? baseImage.name : 'Click to upload image'}</p>
                    <p className="mt-1 text-xs text-shadow-500">PNG, JPG up to 10MB</p>
                  </div>
                  <input
                    id="transformImage"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="transformPrompt" className="text-shadow-200">
                Transformation *
              </Label>
              <Textarea
                id="transformPrompt"
                value={transformPrompt}
                onChange={(e) => setTransformPrompt(e.target.value)}
                placeholder="Make it look like a watercolor painting..."
                className="mt-1 border-midnight-500 bg-midnight-800/50 text-white placeholder:text-shadow-500"
                rows={3}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          className="mt-6 w-full bg-accent text-white hover:bg-accent/90"
          disabled={loading}
        >
          {loading ? (
            <>Generating...</>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Image
            </>
          )}
        </Button>

        {/* Info Box */}
        <div className="mt-4 rounded-lg border border-aurora-500/30 bg-aurora-500/10 p-3 text-xs text-aurora-200">
          💡 Generation uses Gemini AI. Make sure GEMINI_API_KEY is configured on the server.
        </div>
      </CardContent>
    </Card>
  );
}

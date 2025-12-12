/* eslint-disable no-param-reassign, react/button-has-type */
import { useState } from 'react';
import { Upload, Camera, Wand2, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import type { AvatarPreviewResponse } from '../../../types/assets';
import { Button } from '../../ui/button';
import { DiceLoader } from '../../ui/dice-loader';
import { useI18n } from '../../../i18n';
import { previewPlaceholders } from './constants';
import { WebcamCapture } from '../../ui/WebcamCapture';

export type AvatarSlot = keyof AvatarPreviewResponse;

interface AvatarSectionProps {
  // The images to display (merged generated + uploaded in parent)
  images: Record<AvatarSlot, string | null>;

  // Loading states
  loading: Record<AvatarSlot, boolean>;

  // Actions
  onUpload: (slot: AvatarSlot, file: File) => void;
  onCapture: (slot: AvatarSlot, base64: string) => void;
  onGenerateAll: () => void; // Changed to single action for all avatars

  // Dimensions for placeholders
  placeholderDimensions: Partial<Record<AvatarSlot, { width: number; height: number }>>;
}

export function AvatarSection({
  images,
  loading,
  onUpload,
  onCapture,
  onGenerateAll,
  placeholderDimensions,
}: AvatarSectionProps) {
  const { t } = useI18n();
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [activeWebcamSlot, setActiveWebcamSlot] = useState<AvatarSlot | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, slot: AvatarSlot) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(slot, file);
    }
    // Reset input
    event.target.value = '';
  };

  const openWebcam = (slot: AvatarSlot) => {
    setActiveWebcamSlot(slot);
    setWebcamOpen(true);
  };

  const handleWebcamCapture = (imageSrc: string) => {
    if (activeWebcamSlot) {
      onCapture(activeWebcamSlot, imageSrc);
    }
  };

  const renderSlot = (slot: AvatarSlot, labelKey: string, placeholderSrc: string) => {
    const image = images[slot];
    const isLoading = loading[slot];
    const translatedLabel = t(labelKey);
    const isFullBody = slot === 'fullBody';
    const placeholderDims = placeholderDimensions[slot];

    return (
      <div key={slot} className="flex flex-col gap-3">
        <div className="relative group rounded-xl border border-midnight-600 bg-midnight-800/70 overflow-hidden">
          {/* Image Area */}
          <div
            className={clsx(
              'relative flex items-center justify-center min-h-[320px] w-full',
              isFullBody ? 'bg-midnight-900' : 'bg-midnight-800/40'
            )}
            style={
              !image && placeholderDims
                ? { aspectRatio: `${placeholderDims.width} / ${placeholderDims.height}` }
                : undefined
            }
          >
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-midnight-900/50 backdrop-blur-sm z-10">
                <DiceLoader size="medium" diceCount={slot === 'portrait' ? 1 : slot === 'upperBody' ? 2 : 3} />
              </div>
            ) : null}

            {/* Show either generated image or placeholder */}
            {image ? (
              <img src={image} alt={translatedLabel} className="w-full h-auto object-contain max-h-[500px]" />
            ) : (
              <img
                src={placeholderSrc}
                alt={`${translatedLabel} Placeholder`}
                className="w-full h-full object-cover opacity-30"
              />
            )}

            {/* Small Upload/Camera buttons in top-right corner */}
            <div className="absolute top-2 right-2 flex gap-2 opacity-50 hover:opacity-100 transition-opacity">
              {/* Upload Button (icon only) */}
              <div className="relative">
                <input
                  type="file"
                  id={`upload-${slot}`}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, slot)}
                  disabled={isLoading}
                />
                <label
                  htmlFor={`upload-${slot}`}
                  className="flex items-center justify-center w-8 h-8 bg-midnight-700/80 hover:bg-midnight-600 text-aurora-300 rounded-lg cursor-pointer transition-colors border border-midnight-500 backdrop-blur-sm"
                  title="Upload Image"
                >
                  <Upload className="w-4 h-4" />
                </label>
              </div>

              {/* Camera Button (icon only) */}
              <button
                onClick={() => openWebcam(slot)}
                disabled={isLoading}
                className="flex items-center justify-center w-8 h-8 bg-midnight-700/80 hover:bg-midnight-600 text-aurora-300 rounded-lg transition-colors border border-midnight-500 backdrop-blur-sm disabled:opacity-50"
                title="Take Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-sm font-semibold text-aurora-200 uppercase tracking-wider">{translatedLabel}</h3>
        </div>
      </div>
    );
  };

  const anyImage = images.portrait || images.upperBody || images.fullBody;
  const anyLoading = loading.portrait || loading.upperBody || loading.fullBody;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {previewPlaceholders.map(({ key, labelKey, src }) => renderSlot(key as AvatarSlot, labelKey, src))}
      </div>

      {/* Single Generate All Button */}
      <div className="flex justify-center mt-8">
        <Button
          variant="default"
          size="lg"
          onClick={onGenerateAll}
          disabled={anyLoading}
          className="min-w-[260px] px-8 py-6 h-14 bg-aurora-600 hover:bg-aurora-700 text-white font-semibold shadow-[0_8px_24px_rgba(29,143,242,0.25)] hover:shadow-[0_12px_32px_rgba(29,143,242,0.35)] border-2 border-aurora-400/40"
        >
          {anyLoading ? (
            <>
              <DiceLoader size="small" diceCount={3} />
              <span className="ml-3">Generating...</span>
            </>
          ) : anyImage ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2" />
              Regenerate All Avatars
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-2" />
              Generate All Avatars
            </>
          )}
        </Button>
      </div>

      <WebcamCapture open={webcamOpen} onOpenChange={setWebcamOpen} onCapture={handleWebcamCapture} />
    </>
  );
}

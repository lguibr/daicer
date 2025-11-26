import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Check, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { Modal } from './modal';

interface WebcamCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (imageSrc: string) => void;
}

export function WebcamCapture({ open, onOpenChange, onCapture }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please check permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
    }
    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  const capture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageSrc);
      }
    }
  }, []);

  const retake = () => {
    setCapturedImage(null);
  };

  const confirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onOpenChange(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={() => onOpenChange(false)} title="Take Photo" maxWidth="md">
      <div className="flex flex-col items-center gap-4 py-4">
        {error ? (
          <div className="text-red-400 text-center p-4 bg-red-900/20 rounded-lg">{error}</div>
        ) : (
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-midnight-600">
            {!capturedImage ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
              />
            ) : (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect for consistency
              />
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        <div className="flex justify-center gap-4 w-full">
          {!capturedImage ? (
            <Button onClick={capture} disabled={!!error} className="w-full">
              <Camera className="mr-2 h-4 w-4" />
              Capture
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={retake} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retake
              </Button>
              <Button onClick={confirm} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <Check className="mr-2 h-4 w-4" />
                Confirm
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

import sharp from 'sharp';

interface OptimizeImageOptions {
  maxDimension?: number;
  maxBytes?: number;
  format?: 'webp';
  qualityRange?: {
    start: number;
    end: number;
    step: number;
  };
  target?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain';
  };
}

const DEFAULT_OPTIONS: Required<Omit<OptimizeImageOptions, 'format' | 'qualityRange' | 'target'>> & {
  format: 'webp';
  qualityRange: { start: number; end: number; step: number };
  target: undefined;
} = {
  maxDimension: 512,
  maxBytes: 200 * 1024,
  format: 'webp',
  qualityRange: {
    start: 90,
    end: 50,
    step: 10,
  },
  target: undefined,
};

const needsResizeOrCompression = async (
  buffer: Buffer,
  maxDimension: number,
  maxBytes: number,
  target?: OptimizeImageOptions['target']
): Promise<boolean> => {
  if (buffer.length > maxBytes) {
    return true;
  }

  const metadata = await sharp(buffer, { failOnError: false }).metadata();
  const width = metadata.width ?? maxDimension;
  const height = metadata.height ?? maxDimension;

  if (target) {
    if (target.width && width > target.width) {
      return true;
    }
    if (target.height && height > target.height) {
      return true;
    }
    return buffer.length > maxBytes;
  }

  return width > maxDimension || height > maxDimension;
};

export const optimizeImage = async (
  buffer: Buffer,
  mimeType: string,
  options?: OptimizeImageOptions
): Promise<{ buffer: Buffer; mimeType: string; width: number; height: number }> => {
  const { maxDimension, maxBytes, format, qualityRange, target } = {
    ...DEFAULT_OPTIONS,
    ...options,
    qualityRange: {
      ...DEFAULT_OPTIONS.qualityRange,
      ...(options?.qualityRange ?? {}),
    },
    target: options?.target ?? DEFAULT_OPTIONS.target,
  };

  if (!(await needsResizeOrCompression(buffer, maxDimension, maxBytes, target))) {
    const metadata = await sharp(buffer, { failOnError: false }).metadata();
    return {
      buffer,
      mimeType,
      width: metadata.width ?? maxDimension,
      height: metadata.height ?? maxDimension,
    };
  }

  const qualities: number[] = [];
  for (let q = qualityRange.start; q >= qualityRange.end; q -= qualityRange.step) {
    qualities.push(q);
  }
  if (qualities[qualities.length - 1] !== qualityRange.end) {
    qualities.push(qualityRange.end);
  }

  let optimized: Buffer | null = null;

  for (const quality of qualities) {
    let pipeline = sharp(buffer, { failOnError: false });

    if (target) {
      pipeline = pipeline.resize({
        width: target.width ?? undefined,
        height: target.height ?? undefined,
        fit: target.fit ?? 'cover',
        position: 'centre',
        withoutEnlargement: target.fit === 'contain',
      });
    } else {
      pipeline = pipeline.resize({
        width: maxDimension,
        height: maxDimension,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    const output = await pipeline
      .webp({
        quality,
        effort: 5,
      })
      .toBuffer();

    optimized = output;

    if (output.length <= maxBytes) {
      break;
    }
  }

  if (!optimized) {
    optimized = buffer;
  }

  const optimizedMetadata = await sharp(optimized, { failOnError: false }).metadata();

  return {
    buffer: optimized,
    mimeType: format === 'webp' ? 'image/webp' : mimeType,
    width: optimizedMetadata.width ?? maxDimension,
    height: optimizedMetadata.height ?? maxDimension,
  };
};

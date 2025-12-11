import { randomUUID } from 'crypto';

import { Router } from 'express';
import { z } from 'zod';
import mime from 'mime';

import { ApiError } from '@/middleware/error';
import { authenticate, type AuthRequest } from '@/middleware/auth';
import { buildActionFramePrompt, buildAvatarPrompt, buildGridPrompt, type AvatarView } from '@/services/asset-prompts';
import { generateImage } from '@/services/llm';
import { saveAsset } from '@/services/asset-storage';
import type { AvatarAssetResponse, ReferenceImagePayload } from '@/types/assets';
import { optimizeImage } from '@/utils/image';

const router = Router();

const referenceImageSchema = z.object({
  mimeType: z.string().min(1).default('image/png'),
  data: z.string().min(1),
  description: z.string().optional(),
});

const narrativeSchema = z
  .object({
    worldSummary: z.string().optional(),
    currentScene: z.string().optional(),
    playerIntent: z.string().optional(),
  })
  .optional();

const appearanceSchema = z
  .object({
    race: z.string().optional(),
    lineage: z.string().optional(),
    classRole: z.string().optional(),
    genderPresentation: z.string().optional(),
    hair: z.string().optional(),
    eyes: z.string().optional(),
    attire: z.string().optional(),
    accessories: z.string().optional(),
    notableFeatures: z.string().optional(),
  })
  .optional();

const avatarPayloadSchema = z.object({
  name: z.string().optional(),
  basePrompt: z.string().min(10),
  narrative: narrativeSchema,
  appearance: appearanceSchema,
  artStyle: z.string().optional(),
  tone: z.string().optional(),
  referenceImages: z.array(referenceImageSchema).max(4).optional(),
});

const previewImageSchema = z.object({
  mimeType: z.string().min(1),
  data: z.string().min(1),
  prompt: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const portraitPreviewRequestSchema = avatarPayloadSchema;

const upperBodyPreviewRequestSchema = z.object({
  payload: avatarPayloadSchema,
  portrait: previewImageSchema,
});

const fullBodyPreviewRequestSchema = z.object({
  payload: avatarPayloadSchema,
  portrait: previewImageSchema,
  upperBody: previewImageSchema,
});

const gridPayloadSchema = z.object({
  themePrompt: z.string().min(10),
  gridSize: z.object({
    columns: z.number().int().min(3).max(50),
    rows: z.number().int().min(3).max(50),
  }),
  biome: z.string().optional(),
  lighting: z.string().optional(),
  mood: z.string().optional(),
  referenceImages: z.array(referenceImageSchema).max(4).optional(),
});

const actionFramePayloadSchema = z.object({
  basePrompt: z.string().min(10),
  stakes: z.string().optional(),
  cameraAngle: z.string().optional(),
  motionStyle: z.string().optional(),
  narrative: narrativeSchema,
  referenceImages: z.array(referenceImageSchema).max(4).optional(),
});

const parseBody = <T>(schema: z.ZodType<T>, body: unknown): T => {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'Validation failed');
  }
  return parsed.data;
};

const stripDataUri = (input: string): { mimeType?: string; data: string } => {
  const match = input.match(/^data:(?<mime>[^;]+);base64,(?<data>[\s\S]+)$/);
  if (!match?.groups || !match.groups.mime || !match.groups.data) {
    return { data: input };
  }

  return {
    mimeType: match.groups.mime,
    data: match.groups.data,
  };
};

const normalizeReferences = (references?: ReferenceImagePayload[]): ReferenceImagePayload[] => {
  if (!references) {
    return [];
  }

  return references.map((ref) => {
    let { data } = ref;
    if (data.startsWith('data:')) {
      const parsed = stripDataUri(data);
      data = parsed.data;
      const resolvedMimeType = ref.mimeType ?? parsed.mimeType ?? 'image/png';
      return {
        ...ref,
        data,
        mimeType: resolvedMimeType,
      };
    }

    return {
      ...ref,
      data,
      mimeType: ref.mimeType ?? 'image/png',
    };
  });
};

const buildFilename = (variant: string): string => variant.replace(/[^a-zA-Z0-9_-]/g, '-');

const TARGET_SPECS = {
  portrait: { width: 512, height: 512, fit: 'cover' as const },
  upperBody: { width: 576, height: 768, fit: 'cover' as const },
  fullBody: { width: 640, fit: 'contain' as const },
} as const;

const TARGET_SPEC_MAP: Record<keyof AvatarAssetResponse, (typeof TARGET_SPECS)[keyof AvatarAssetResponse]> = {
  portrait: TARGET_SPECS.portrait,
  upperBody: TARGET_SPECS.upperBody,
  fullBody: TARGET_SPECS.fullBody,
};

const resolveVariantSlug = (variant: keyof AvatarAssetResponse): string => {
  if (variant === 'upperBody') {
    return 'upper-body';
  }
  if (variant === 'fullBody') {
    return 'full-body';
  }
  return variant;
};

type NormalizedPreview = {
  mimeType: string;
  data: string;
  prompt?: string;
  width?: number;
  height?: number;
};

const normalizePreviewImage = (preview: z.infer<typeof previewImageSchema>): NormalizedPreview => {
  if (preview.data.startsWith('data:')) {
    const parsed = stripDataUri(preview.data);
    return {
      mimeType: preview.mimeType || parsed.mimeType || 'image/png',
      data: parsed.data,
      prompt: preview.prompt,
      width: preview.width,
      height: preview.height,
    };
  }

  return {
    mimeType: preview.mimeType,
    data: preview.data,
    prompt: preview.prompt,
    width: preview.width,
    height: preview.height,
  };
};

const toReferenceFromPreview = async (
  preview: z.infer<typeof previewImageSchema>,
  description: string,
  target: { width?: number; height?: number; fit?: 'cover' | 'contain' }
): Promise<ReferenceImagePayload> => {
  const normalized = normalizePreviewImage(preview);
  const buffer = Buffer.from(normalized.data, 'base64');
  const optimized = await optimizeImage(buffer, normalized.mimeType, { target });
  return {
    mimeType: optimized.mimeType,
    data: optimized.buffer.toString('base64'),
    description,
  };
};

const toAssetResponse = async (
  params: {
    buffer: Buffer;
    mimeType: string;
    prompt: string;
    folder: string;
    filename: string;
  },
  variant: string
) => {
  const extension = mime.getExtension(params.mimeType) ?? 'png';
  const stored = await saveAsset({
    buffer: params.buffer,
    contentType: params.mimeType,
    folder: params.folder,
    filename: `${params.filename}.${extension}`,
    metadata: {
      prompt: params.prompt,
      variant,
    },
  });

  return {
    id: randomUUID(),
    mimeType: params.mimeType,
    storagePath: stored.path,
    publicUrl: stored.url,
    prompt: params.prompt,
    createdAt: new Date().toISOString(),
  };
};

router.post('/avatar', async (req, res, next) => {
  try {
    const payload = parseBody(avatarPayloadSchema, req.body);
    const references = normalizeReferences(payload.referenceImages as any);
    const requestId = randomUUID();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const folder = `avatars/${timestamp}-${requestId}`;

    const variants: Record<AvatarView, keyof AvatarAssetResponse> = {
      portrait: 'portrait',
      'upper-body': 'upperBody',
      'full-body': 'fullBody',
    };

    const responses: Partial<AvatarAssetResponse> = {};

    for (const [view, key] of Object.entries(variants) as Array<[AvatarView, keyof AvatarAssetResponse]>) {
      const prompt = buildAvatarPrompt({ ...payload, referenceImages: references }, view);
      const result = await generateImage({
        prompt,
        references,
        config: {
          size: '768',
        },
      });

      const optimized = await optimizeImage(result.buffer, result.mimeType, {
        target: TARGET_SPEC_MAP[key],
      });
      const filename = buildFilename(resolveVariantSlug(key));

      responses[key] = await toAssetResponse(
        {
          buffer: optimized.buffer,
          mimeType: optimized.mimeType,
          prompt,
          folder,
          filename,
        },
        key
      );
    }

    return res.status(201).json({ success: true, data: responses });
  } catch (error) {
    return next(error);
  }
});

router.post('/avatar/preview/portrait', async (req, res, next) => {
  try {
    const payload = parseBody(portraitPreviewRequestSchema, req.body);
    const references = normalizeReferences(payload.referenceImages as any);
    const portraitPrompt = buildAvatarPrompt({ ...payload, referenceImages: references }, 'portrait');
    const portraitResult = await generateImage({
      prompt: portraitPrompt,
      references,
      config: {
        size: '768',
      },
    });

    const optimizedPortrait = await optimizeImage(portraitResult.buffer, portraitResult.mimeType, {
      target: TARGET_SPECS.portrait,
    });

    const portraitPreview = {
      mimeType: optimizedPortrait.mimeType,
      data: optimizedPortrait.buffer.toString('base64'),
      prompt: portraitPrompt,
      width: optimizedPortrait.width,
      height: optimizedPortrait.height,
    };

    return res.status(200).json({ success: true, data: portraitPreview });
  } catch (error) {
    return next(error);
  }
});

router.post('/avatar/preview/upper', async (req, res, next) => {
  try {
    const { payload, portrait } = parseBody(upperBodyPreviewRequestSchema, req.body);
    const references = normalizeReferences(payload.referenceImages as any);
    const portraitReference = await toReferenceFromPreview(
      portrait,
      'Frontal face portrait reference',
      TARGET_SPECS.portrait
    );

    const upperBodyPrompt = buildAvatarPrompt({ ...payload, referenceImages: references }, 'upper-body');
    const upperBodyResult = await generateImage({
      prompt: upperBodyPrompt,
      references: [...references, portraitReference],
      config: {
        size: '768',
      },
    });

    const optimizedUpperBody = await optimizeImage(upperBodyResult.buffer, upperBodyResult.mimeType, {
      target: TARGET_SPECS.upperBody,
    });

    const upperBodyPreview = {
      mimeType: optimizedUpperBody.mimeType,
      data: optimizedUpperBody.buffer.toString('base64'),
      prompt: upperBodyPrompt,
      width: optimizedUpperBody.width,
      height: optimizedUpperBody.height,
    };

    return res.status(200).json({ success: true, data: upperBodyPreview });
  } catch (error) {
    return next(error);
  }
});

router.post('/avatar/preview/full', async (req, res, next) => {
  try {
    const { payload, portrait, upperBody } = parseBody(fullBodyPreviewRequestSchema, req.body);
    const references = normalizeReferences(payload.referenceImages as any);
    const [portraitReference, upperBodyReference] = await Promise.all([
      toReferenceFromPreview(portrait, 'Frontal face portrait reference', TARGET_SPECS.portrait),
      toReferenceFromPreview(upperBody, 'Upper-body reference', TARGET_SPECS.upperBody),
    ]);

    const fullBodyPrompt = buildAvatarPrompt({ ...payload, referenceImages: references }, 'full-body');
    const fullBodyResult = await generateImage({
      prompt: fullBodyPrompt,
      references: [...references, portraitReference, upperBodyReference],
      config: {
        size: '768',
      },
    });

    const optimizedFullBody = await optimizeImage(fullBodyResult.buffer, fullBodyResult.mimeType, {
      target: TARGET_SPECS.fullBody,
    });

    const fullBodyPreview = {
      mimeType: optimizedFullBody.mimeType,
      data: optimizedFullBody.buffer.toString('base64'),
      prompt: fullBodyPrompt,
      width: optimizedFullBody.width,
      height: optimizedFullBody.height,
    };

    return res.status(200).json({ success: true, data: fullBodyPreview });
  } catch (error) {
    return next(error);
  }
});

router.post('/grid-background', async (req, res, next) => {
  try {
    const payload = parseBody(gridPayloadSchema, req.body);
    const references = normalizeReferences(payload.referenceImages as any);
    const prompt = buildGridPrompt({ ...payload, referenceImages: references });

    const result = await generateImage({
      prompt,
      references,
      config: {
        size: '768',
      },
    });

    const filename = buildFilename(`grid-${randomUUID()}`);
    const asset = await toAssetResponse(
      {
        buffer: result.buffer,
        mimeType: result.mimeType,
        prompt,
        folder: `grid-backgrounds/${new Date().toISOString().slice(0, 10)}`,
        filename,
      },
      'grid'
    );

    return res.status(201).json({ success: true, data: asset });
  } catch (error) {
    return next(error);
  }
});

router.post('/action-frame', async (req, res, next) => {
  try {
    const payload = parseBody(actionFramePayloadSchema, req.body);
    const references = normalizeReferences(payload.referenceImages as any);
    const prompt = buildActionFramePrompt({ ...payload, referenceImages: references });

    const result = await generateImage({
      prompt,
      references,
      config: {
        size: '768',
        temperature: 0.7,
      },
    });

    const filename = buildFilename(`action-${randomUUID()}`);
    const asset = await toAssetResponse(
      {
        buffer: result.buffer,
        mimeType: result.mimeType,
        prompt,
        folder: `action-frames/${new Date().toISOString().slice(0, 10)}`,
        filename,
      },
      'action'
    );

    return res.status(201).json({ success: true, data: asset });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /:roomId/:playerId/avatar
 * Retrieve player avatar assets
 * Requires authentication
 */
router.get('/:roomId/:playerId/avatar', authenticate, async (req: AuthRequest, _res, next) => {
  try {
    const { roomId, playerId } = req.params;

    // Check if room exists (stub - would query Firestore in real implementation)
    if (!roomId || !playerId) {
      throw new ApiError(400, 'Room ID and Player ID are required');
    }

    // Return 404 for now since asset retrieval is not fully implemented
    throw new ApiError(404, 'Avatar asset not found');
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /:roomId/background
 * Retrieve room background asset
 * Requires authentication
 */
router.get('/:roomId/background', authenticate, async (req: AuthRequest, _res, next) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      throw new ApiError(400, 'Room ID is required');
    }

    // Return 404 for now since asset retrieval is not fully implemented
    throw new ApiError(404, 'Background asset not found');
  } catch (error) {
    return next(error);
  }
});

export default router;

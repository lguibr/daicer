import { randomUUID } from 'crypto';

import { Router } from 'express';
import { z } from 'zod';
import getExtension from 'mime';

import { ApiError } from '@/middleware/error';
import { buildActionFramePrompt, buildAvatarPrompt, buildGridPrompt, type AvatarView } from '@/services/asset-prompts';
import { generateImage } from '@/services/gemini-image';
import { saveAsset } from '@/services/asset-storage';
import type {
  ActionFramePayload,
  AvatarAssetResponse,
  AvatarGenerationPayload,
  GridBackgroundPayload,
  ReferenceImagePayload,
} from '@/types/assets';

const router = Router();

const referenceImageSchema = z.object({
  mimeType: z.string().optional(),
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
  if (match?.groups) {
    return {
      mimeType: match.groups.mime,
      data: match.groups.data,
    };
  }
  return {
    data: input,
  };
};

const normalizeReferences = (references?: ReferenceImagePayload[]): ReferenceImagePayload[] => {
  if (!references) {
    return [];
  }

  return references.map((ref) => {
    let { data, mimeType } = ref;
    if (data.startsWith('data:')) {
      const parsed = stripDataUri(data);
      data = parsed.data;
      mimeType = mimeType ?? parsed.mimeType;
    }

    return {
      ...ref,
      data,
      mimeType: mimeType ?? 'image/png',
    };
  });
};

const buildFilename = (variant: string): string => variant.replace(/[^a-zA-Z0-9_-]/g, '-');

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
  const extension = getExtension(params.mimeType) ?? 'png';
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
    const references = normalizeReferences(payload.referenceImages);
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
      const prompt = buildAvatarPrompt(payload, view);
      const result = await generateImage({
        prompt,
        references,
        config: {
          size: '1K',
        },
      });

      const filename = buildFilename(key === 'upperBody' ? 'upper-body' : key === 'fullBody' ? 'full-body' : key);

      responses[key] = await toAssetResponse(
        {
          buffer: result.buffer,
          mimeType: result.mimeType,
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

router.post('/grid-background', async (req, res, next) => {
  try {
    const payload = parseBody(gridPayloadSchema, req.body);
    const references = normalizeReferences(payload.referenceImages);
    const prompt = buildGridPrompt(payload);

    const result = await generateImage({
      prompt,
      references,
      config: {
        size: '1K',
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
    const references = normalizeReferences(payload.referenceImages);
    const prompt = buildActionFramePrompt(payload);

    const result = await generateImage({
      prompt,
      references,
      config: {
        size: '1K',
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

export default router;

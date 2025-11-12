import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

import { app } from '@/server';

jest.mock('@/services/gemini-image', () => ({
  generateImage: jest.fn(),
}));

jest.mock('@/services/asset-storage', () => ({
  saveAsset: jest.fn(),
}));

// eslint-disable-next-line import/first
import { generateImage } from '@/services/gemini-image';
// eslint-disable-next-line import/first
import { saveAsset } from '@/services/asset-storage';

const mockedGenerateImage = generateImage as jest.MockedFunction<typeof generateImage>;
const mockedSaveAsset = saveAsset as jest.MockedFunction<typeof saveAsset>;

describe('Asset API', () => {
  beforeEach(() => {
    mockedGenerateImage.mockReset();
    mockedSaveAsset.mockReset();

    mockedGenerateImage.mockResolvedValue({
      buffer: Buffer.from('fake-image'),
      mimeType: 'image/png',
      prompt: 'prompt',
    });

    mockedSaveAsset.mockImplementation(async (params) => ({
      path: `test/${params.filename}`,
      url: `http://localhost/test/${params.filename}`,
      bucket: 'test-bucket',
    }));
  });

  it('generates avatar variants', async () => {
    const response = await request(app)
      .post('/api/assets/avatar')
      .send({
        basePrompt: 'Stoic elven ranger wielding twin blades in enchanted forest.',
        appearance: {
          race: 'Elf',
          classRole: 'Ranger',
        },
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(Object.keys(response.body.data)).toEqual(['portrait', 'upperBody', 'fullBody']);
    expect(mockedGenerateImage).toHaveBeenCalledTimes(3);
    expect(mockedSaveAsset).toHaveBeenCalledTimes(3);
  });

  it('validates avatar payload', async () => {
    const response = await request(app).post('/api/assets/avatar').send({ basePrompt: 'short' }).expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  it('generates grid background', async () => {
    const response = await request(app)
      .post('/api/assets/grid-background')
      .send({
        themePrompt: 'Ancient ruins reclaimed by nature with luminous crystals.',
        gridSize: { columns: 10, rows: 8 },
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('publicUrl');
    expect(mockedGenerateImage).toHaveBeenCalledTimes(1);
    expect(mockedSaveAsset).toHaveBeenCalledTimes(1);
  });

  it('generates action frame', async () => {
    const response = await request(app)
      .post('/api/assets/action-frame')
      .send({
        basePrompt: 'Mage unleashes arcane nova to shatter a demon portal.',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('publicUrl');
    expect(mockedGenerateImage).toHaveBeenCalledTimes(1);
    expect(mockedSaveAsset).toHaveBeenCalledTimes(1);
  });
});

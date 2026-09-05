import { describe, it, expect, vi, beforeEach } from 'vitest';
import entityLifecycleFactory from '@/api/game/services/entity-lifecycle';

// Mock External Utils
const mockGenerateText = vi.fn();
const mockGetPrompt = vi.fn();
const mockFormatPrompt = vi.fn();
const mockUploadBase64Image = vi.fn();

// Relative paths for mocks to ensure resolution matches source (mapped via alias or relative)
// entity-lifecycle uses '@/utils/llm'. resolving from this test file:
// ../../../../utils/llm
vi.mock('../../../../utils/llm', () => ({
  generateText: (...args: any[]) => mockGenerateText(...args),
}));

vi.mock('../../../../utils/prompt', () => ({
  getPrompt: (...args: any[]) => mockGetPrompt(...args),
  formatPrompt: (...args: any[]) => mockFormatPrompt(...args),
}));

vi.mock('../../../../utils/upload', () => ({
  uploadBase64Image: (...args: any[]) => mockUploadBase64Image(...args),
}));

// Mock Engine Utils
const mockCreateCharacterSnapshot = vi.fn();
const mockFormatDmInstruction = vi.fn();
const mockDerive = vi.fn();

vi.mock('@/api/game/src/engine', () => ({
  createCharacterSnapshot: (...args: any[]) => mockCreateCharacterSnapshot(...args),
  formatDmInstruction: (...args: any[]) => mockFormatDmInstruction(...args),
  EntityDeriver: {
    derive: (...args: any[]) => mockDerive(...args),
  },
}));

// Mock Strapi
const mockFindMany = vi.fn();
const mockFindOne = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockLogInfo = vi.fn();
const mockLogWarn = vi.fn();
const mockLogError = vi.fn();

const mockStrapi: any = {
  documents: vi.fn(() => ({
    findMany: mockFindMany,
    findOne: mockFindOne,
    create: mockCreate,
    update: mockUpdate,
  })),
  log: {
    info: mockLogInfo,
    warn: mockLogWarn,
    error: mockLogError,
  },
};

describe('Entity Lifecycle Service', () => {
  let service: any;

  beforeEach(() => {
    vi.resetAllMocks(); // Changed from clearAllMocks to ensure clean slate
    service = entityLifecycleFactory({ strapi: mockStrapi });

    // Default Mocks
    mockGenerateText.mockResolvedValue('Generated Text');
    // Return valid prompt template defaults
    mockGetPrompt.mockImplementation((key) => {
      if (key.includes('system')) return 'System {{worldContext}}';
      if (key.includes('user')) return 'User {{val}}';
      return 'Prompt';
    });
    mockFormatPrompt.mockImplementation((t) => `Formatted: ${t}`);
    mockUploadBase64Image.mockResolvedValue({ id: 'img1', url: 'url1' });
    mockCreateCharacterSnapshot.mockImplementation((s) => ({ id: s.documentId, name: s.name }));
    mockDerive.mockReturnValue({
      level: 1,
      hp: 10,
      maxHp: 10,
      ac: 10,
      speed: { walk: 30 },
      structuredActions: [],
    });
  });

  describe('createSnapshot', () => {
    it('should map entities and handle invalid inputs', () => {
      const sheets = [
        { documentId: 's1', name: 'Sheet 1' },
        { documentId: 's2', name: 'Sheet 2' },
        null,
        undefined,
        'invalid-string',
      ];
      const result = service.createSnapshot(sheets);
      expect(result).toHaveProperty('s1');
      expect(result).toHaveProperty('s2');
      expect(Object.keys(result)).toHaveLength(2);
      expect(mockCreateCharacterSnapshot).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateEntityOpening', () => {
    it('should format prompt and generate text', async () => {
      await service.generateEntityOpening('World', { name: 'Hero' }, 'Ctx', 'en');
      expect(mockFormatPrompt).toHaveBeenCalled();
      expect(mockGenerateText).toHaveBeenCalled();
    });

    it('should handle complex nested race/class objects', async () => {
      const sheet = {
        name: 'Complex Hero',
        race: { name: 'High Elf' },
        classes: [{ class: { name: 'Wizard' }, level: 1 }],
        personality: { traits: 'Brave' },
        attributes: { Strength: 18 },
      };
      await service.generateEntityOpening('World', sheet, 'Ctx', 'en');
      expect(mockGenerateText).toHaveBeenCalled();
    });

    it('should fallback for missing race/class', async () => {
      const sheet = { name: 'Mystery Hero' };
      await service.generateEntityOpening('World', sheet, 'Ctx', 'en');
      expect(mockGenerateText).toHaveBeenCalled();
    });
  });

  describe('generateMainOpening', () => {
    it('should format prompt and generate text for party', async () => {
      await service.generateMainOpening('World', []);
      expect(mockFormatPrompt).toHaveBeenCalled();
      expect(mockGenerateText).toHaveBeenCalled();
    });

    it('should handle party with complex sheets', async () => {
      const players = [
        {
          name: 'P1',
          characterSheet: {
            name: 'Hero',
            race: { name: 'Dwarf' },
            classes: [{ class: { name: 'Cleric' } }],
            description: 'A stout dwarf.',
          },
        },
        {
          name: 'P2',
          characterSheet: {
            name: 'Ranger',
            race: 'Elf',
            class: 'Ranger',
          },
        },
        { name: 'P3', characterSheet: null }, // No sheet
      ];
      await service.generateMainOpening('World', players);
      expect(mockGenerateText).toHaveBeenCalled();
    });
  });

  describe('onboardPlayer', () => {
    const user = { documentId: 'u1', id: '1', username: 'Player' };
    const room = { documentId: 'r1', phase: 'lobby', players: [{ user: { documentId: 'u1' }, name: 'Player' }] };

    it('rejects nonmembers before uploads or creates', async () => {
      mockFindOne.mockResolvedValue({ ...room, players: [] });
      await expect(service.onboardPlayer('r1', { name: 'Hero', avatarPreview: { portrait: { data: 'abc' } } }, user))
        .rejects.toMatchObject({ extensions: { code: 'ROOM_UNAVAILABLE' } });
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockUploadBase64Image).not.toHaveBeenCalled();
    });

    it('rejects a missing linked blueprint rather than creating a substitute', async () => {
      mockFindOne.mockResolvedValueOnce(room).mockResolvedValueOnce(null);
      await expect(service.onboardPlayer('r1', { documentId: 'missing' }, user))
        .rejects.toMatchObject({ extensions: { code: 'INVALID_INPUT' } });
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('hydrates a blueprint and copies components without their primary keys', async () => {
      mockFindOne.mockResolvedValueOnce(room).mockResolvedValueOnce({
        documentId: 'blueprint', type: 'Player', name: 'Ranger', stats: { id: 99, strength: 0 },
        race: { documentId: 'race', speed: 25 }, classes: [],
        inventory: [{ id: 88, item: { documentId: 'item', id: 77, name: 'Bow' }, quantity: 1, isEquipped: true }],
      });
      mockCreate.mockResolvedValue({ documentId: 'sheet' });
      const result = await service.onboardPlayer('r1', { documentId: 'blueprint' }, user);
      const sheet = mockCreate.mock.calls[0][0].data;
      expect(sheet.entity).toBe('blueprint');
      expect(sheet.owner).toBe('u1');
      expect(sheet.room).toBe('r1');
      expect(sheet.stats).toMatchObject({ strength: 0 });
      expect(sheet.stats).not.toHaveProperty('id');
      expect(sheet.inventory).toEqual([{ item: 'item', quantity: 1, isEquipped: true, slot: undefined }]);
      expect(sheet).not.toHaveProperty('structuredActions');
      expect(result.player.characterSheet).toBe('sheet');
      expect(result.player.character).toBe('blueprint');
      expect(result.player.isReady).toBe(false);
    });

    it('uses equipped armor data with the real derivation implementation', async () => {
      const { EntityDeriver } = await import('@daicer/engine/derivation');
      mockDerive.mockImplementation((input) => EntityDeriver.derive(input));
      mockFindOne.mockResolvedValueOnce(room).mockResolvedValueOnce({
        documentId: 'blueprint', type: 'Player', name: 'Guard', stats: { dexterity: 10 },
        inventory: [{ isEquipped: true, item: { documentId: 'armor', name: 'Armor', type: 'armor', equipment_data: { armor_class_base: 16, armor_class_dex_bonus: false } } }],
      });
      mockCreate.mockResolvedValue({ documentId: 'sheet' });
      await service.onboardPlayer('r1', { documentId: 'blueprint' }, user);
      expect(mockCreate.mock.calls[0][0].data.ac).toBe(16);
      expect(mockDerive.mock.calls[0][0].equipment[0].isEquipped).toBe(true);
    });

    it('does not instantiate again when the selected blueprint is unchanged', async () => {
      const prior = { documentId: 'sheet', owner: { documentId: 'u1' }, room: { documentId: 'r1' }, entity: { documentId: 'blueprint' } };
      mockFindOne.mockResolvedValueOnce({ ...room, players: [{ ...room.players[0], characterSheet: prior }] })
        .mockResolvedValueOnce({ documentId: 'blueprint', type: 'Player', name: 'Ranger' });
      const result = await service.onboardPlayer('r1', { documentId: 'blueprint' }, user);
      expect(result.entitySheet.documentId).toBe('sheet');
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('rejects selecting a nonplayer entity', async () => {
      mockFindOne.mockResolvedValueOnce(room).mockResolvedValueOnce({ documentId: 'monster', type: 'Monster' });
      await expect(service.onboardPlayer('r1', { documentId: 'monster' }, user))
        .rejects.toMatchObject({ extensions: { code: 'INVALID_INPUT' } });
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('preserves downstream sheet lifecycle failures', async () => {
      mockFindOne.mockResolvedValueOnce(room).mockResolvedValueOnce({ documentId: 'blueprint', type: 'Player', name: 'Ranger', stats: {} });
      mockCreate.mockRejectedValue(new Error('sheet lifecycle failed'));
      await expect(service.onboardPlayer('r1', { documentId: 'blueprint' }, user)).rejects.toThrow('sheet lifecycle failed');
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});

import React, { useState, useMemo, useCallback } from 'react';
import type { GridData, GridCell, CellSelection, FinalAvatarImages } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Label } from './ui/Label';
import { Textarea } from './ui/Textarea';
import { generateImage, editImage } from '../services/geminiService';
import { Loader } from './ui/Loader';

interface GridGeneratorProps {
  onGridGenerated: (grid: GridData) => void;
  onCellSelected: (selection: CellSelection) => void;
  selectedCell: CellSelection | null;
  finalAvatarImages: FinalAvatarImages | null;
  avatarPosition: CellSelection | null;
  onPlaceAvatar: (selection: CellSelection) => void;
}

// --- MAP DATA & TEMPLATES ---
const W: GridCell = { type: 'wall', description: 'A cold, damp stone wall.' };
const F: GridCell = { type: 'floor', description: 'A dusty flagstone floor.' };
const S: GridCell = { type: 'spawn', description: 'An ethereal glow marks this as a starting point.' };
const D: GridCell = { type: 'death', description: 'A pit of despair, emanating a deadly aura.' };
const M: GridCell = {
  type: 'face',
  description: 'A mysterious face carved into the stone, humming with faint energy.',
};

const initialMap = {
  name: 'Initial Dungeon',
  layout: [
    [W, W, W, W, W, W, W, W],
    [W, S, F, F, W, F, F, W],
    [W, F, W, F, W, F, W, W],
    [W, F, W, F, F, F, F, W],
    [W, F, F, F, W, W, F, W],
    [W, W, W, W, W, W, W, W],
  ],
};
const corridorsMap = {
  name: 'Corridors',
  layout: [
    [W, W, W, W, W, W, W, W, W, W],
    [W, S, F, W, F, F, F, W, M, W],
    [W, W, F, W, F, W, F, W, F, W],
    [W, F, F, F, F, W, F, F, F, W],
    [W, F, W, W, W, W, W, W, F, W],
    [W, F, F, F, F, F, F, D, F, W],
    [W, W, W, W, W, W, W, W, W, W],
  ],
};
const deathTrapMap = {
  name: 'Death Trap',
  layout: [
    [W, W, W, W, W, W, W],
    [W, S, F, D, F, D, W],
    [W, W, W, F, W, W, W],
    [W, D, F, M, F, F, W],
    [W, W, W, F, W, W, W],
    [W, D, F, D, F, D, W],
    [W, W, W, W, W, W, W],
  ],
};

const largeDungeonMap = {
  name: 'Large Dungeon',
  layout: [
    [W, W, W, W, W, W, W, W, W, W, W, W],
    [W, S, F, F, F, W, F, F, F, F, M, W],
    [W, F, W, W, F, W, F, W, W, W, F, W],
    [W, F, F, W, F, F, F, F, F, W, F, W],
    [W, W, F, W, D, W, W, W, F, W, D, W],
    [W, F, F, F, F, W, F, F, F, F, F, W],
    [W, F, W, W, W, W, F, W, W, W, W, W],
    [W, F, F, D, F, F, F, F, F, F, F, W],
    [W, W, W, W, W, W, W, W, W, W, W, W],
  ],
};

const wizardsTowerMap = {
  name: "Wizard's Tower",
  layout: [
    [W, W, W, W, W, W, W],
    [W, F, F, D, F, F, W],
    [W, F, W, M, W, F, W],
    [W, D, W, S, W, D, W],
    [W, F, W, F, W, F, W],
    [W, F, F, F, F, F, W],
    [W, W, W, W, W, W, W],
  ],
};

const mapTemplates = [initialMap, corridorsMap, deathTrapMap, largeDungeonMap, wizardsTowerMap];
const initialJson = JSON.stringify(initialMap.layout, null, 2);

// --- STYLING & CONFIG ---
const CELL_SIZE = 40; // Corresponds to w-10, h-10 tailwind classes

const cellStyles: { [key in GridCell['type']]: string } = {
  floor: 'rgba(71, 85, 105, 0.6)', // slate-700/60
  wall: 'rgba(15, 23, 42, 1)', // slate-950 (for blueprint)
  death: 'rgba(127, 29, 29, 0.7)', // red-900/70
  face: 'rgba(91, 33, 182, 0.7)', // purple-900/70
  spawn: 'rgba(30, 58, 138, 0.7)', // blue-900/70
};

const cellIcons: { [key in GridCell['type']]: string } = { floor: '', wall: '', death: '💀', face: '🗿', spawn: '✨' };

// --- HELPER FUNCTIONS ---
const generateMapPrompt = (): string => {
  const CORE_STYLE_PROMPT =
    'dark fantasy art, atmospheric lighting, style of classic D&D illustrations, high detail, moody, top-down perspective battle map, dungeon environment, no borders or overlays on the final image.';
  return `Using the provided grid layout image as a precise visual blueprint for the map's structure, create a thematic, top-down battle map background. The final image should have no padding or margin; the content must extend to the very edges. DO NOT draw your own grid lines or cells. Instead, fill the colored areas with appropriate textures based on their context (e.g., grey for stone floors, red for lava pits or traps). ${CORE_STYLE_PROMPT}`;
};

const generateGridPreviewCanvas = (gridData: GridData): Promise<string> => {
  return new Promise((resolve) => {
    const width = gridData[0].length * CELL_SIZE;
    const height = gridData.length * CELL_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve('');

    gridData.forEach((row, y) => {
      row.forEach((cell, x) => {
        ctx.fillStyle = cellStyles[cell.type] || cellStyles.floor;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        const icon = cellIcons[cell.type];
        if (icon) {
          ctx.font = `${CELL_SIZE * 0.6}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'white';
          ctx.fillText(icon, x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2);
        }
      });
    });
    resolve(canvas.toDataURL('image/png'));
  });
};

export const GridGenerator: React.FC<GridGeneratorProps> = ({
  onGridGenerated,
  onCellSelected,
  selectedCell,
  finalAvatarImages,
  avatarPosition,
  onPlaceAvatar,
}) => {
  const [jsonInput, setJsonInput] = useState<string>(initialJson);
  const [grid, setGrid] = useState<GridData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<'config' | 'preview' | 'generating' | 'done'>('config');
  const [gridPreviewImage, setGridPreviewImage] = useState<string | null>(null);
  const [generatedBackground, setGeneratedBackground] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [hoveredCell, setHoveredCell] = useState<CellSelection | null>(null);

  const handleTemplateSelect = (template: { name: string; layout: GridData }) => {
    setJsonInput(JSON.stringify(template.layout, null, 2));
    setStep('config');
    setGrid(null);
    setGridPreviewImage(null);
    setGeneratedBackground(null);
  };

  const handlePreviewLayout = async () => {
    try {
      setError(null);
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed) || !Array.isArray(parsed[0])) {
        throw new Error('Invalid JSON format. Must be a 2D array.');
      }
      setGrid(parsed);
      onGridGenerated(parsed);

      const previewUrl = await generateGridPreviewCanvas(parsed);
      setGridPreviewImage(previewUrl);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse JSON.');
      setGrid(null);
    }
  };

  const handleGenerateBackground = async () => {
    if (!gridPreviewImage) return;
    try {
      setIsLoading(true);
      setLoadingMessage('Generating thematic background...');
      setStep('generating');

      const mapPrompt = generateMapPrompt();
      const base64Data = gridPreviewImage.split(',')[1];
      const bgResult = await editImage(base64Data, 'image/png', mapPrompt);

      setGeneratedBackground(`data:image/png;base64,${bgResult}`);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate assets.');
      setStep('preview'); // Go back to preview step on error
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const wallLines = useMemo(() => {
    if (!grid) return [];
    const lines = [];
    const height = grid.length;
    const width = grid[0].length;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const currentIsWall = grid[y][x].type === 'wall';
        if (x < width - 1) {
          const rightIsWall = grid[y][x + 1].type === 'wall';
          if (currentIsWall !== rightIsWall)
            lines.push({
              key: `v-${x}-${y}`,
              x1: (x + 1) * CELL_SIZE,
              y1: y * CELL_SIZE,
              x2: (x + 1) * CELL_SIZE,
              y2: (y + 1) * CELL_SIZE,
            });
        }
        if (y < height - 1) {
          const downIsWall = grid[y + 1][x].type === 'wall';
          if (currentIsWall !== downIsWall)
            lines.push({
              key: `h-${x}-${y}`,
              x1: x * CELL_SIZE,
              y1: (y + 1) * CELL_SIZE,
              x2: (x + 1) * CELL_SIZE,
              y2: (y + 1) * CELL_SIZE,
            });
        }
      }
    }
    return lines;
  }, [grid]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grid Map Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-8">
          {/* --- LEFT COLUMN: CONFIGURATION --- */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="json-input" className="text-lg font-semibold">
                Step 1: Configure Map Layout
              </Label>
              <div className="flex flex-wrap gap-2 my-2">
                {mapTemplates.map((template) => (
                  <Button
                    key={template.name}
                    variant="secondary"
                    onClick={() => handleTemplateSelect(template)}
                    className="text-xs px-2 py-1"
                  >
                    Load: {template.name}
                  </Button>
                ))}
              </div>
              <Textarea
                id="json-input"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="font-mono h-48 md:h-64"
              />
              <Button onClick={handlePreviewLayout} disabled={isLoading} className="mt-2">
                Preview Layout
              </Button>
            </div>
            {error && <p className="text-red-500 mt-2">{error}</p>}

            {step === 'preview' && gridPreviewImage && (
              <div className="p-4 bg-slate-800/50 rounded-lg space-y-2">
                <h5 className="text-lg font-semibold">Step 2: Generate Background</h5>
                <p className="text-sm text-slate-400">This blueprint will be sent to the AI.</p>
                <img src={gridPreviewImage} alt="Map Layout Blueprint" className="rounded-lg ring-2 ring-slate-700" />
                <Button onClick={handleGenerateBackground} disabled={isLoading}>
                  Generate Thematic Background
                </Button>
              </div>
            )}

            {step === 'done' && generatedBackground && (
              <div className="p-4 bg-slate-800/50 rounded-lg space-y-2">
                <h5 className="font-semibold mb-2">Generated Background Art</h5>
                <img
                  src={generatedBackground}
                  alt="AI Generated Map Background"
                  className="rounded-lg w-full ring-2 ring-slate-700"
                />
              </div>
            )}
          </div>

          {/* --- RIGHT COLUMN: MAP DISPLAY & CONTROLS --- */}
          <div className="space-y-4 flex flex-col items-center">
            <h4 className="font-semibold mb-2 text-lg">Map Preview & Controls</h4>
            <div
              className="relative inline-block border border-slate-700 bg-slate-950"
              onMouseLeave={() => setHoveredCell(null)}
            >
              {(isLoading || step === 'config') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-40">
                  {isLoading ? <Loader /> : <p>Configure layout on the left</p>}
                  {loadingMessage && <p className="mt-2 text-sm text-slate-400">{loadingMessage}</p>}
                </div>
              )}
              {step === 'done' && generatedBackground && (
                <img
                  src={generatedBackground}
                  alt="AI Generated Map Background"
                  className="absolute inset-0 w-full h-full object-fill z-0"
                />
              )}
              {grid && (
                <div
                  className="relative z-10 grid"
                  style={{
                    gridTemplateColumns: `repeat(${grid[0].length}, ${CELL_SIZE}px)`,
                    backgroundImage: step === 'preview' && gridPreviewImage ? `url(${gridPreviewImage})` : 'none',
                    backgroundSize: 'cover',
                  }}
                >
                  {grid.map((row, y) =>
                    row.map((cell, x) => {
                      const isSelected = selectedCell?.x === x && selectedCell?.y === y;
                      const hasAvatar = avatarPosition?.x === x && avatarPosition?.y === y;
                      const isWall = cell.type === 'wall';

                      const bgStyle =
                        step === 'done' || step === 'generating'
                          ? `bg-transparent ${!isWall ? 'hover:bg-slate-500/30' : ''}`
                          : cellStyles[cell.type];

                      const cursorStyle = isWall ? 'cursor-default' : 'cursor-pointer';

                      return (
                        <div
                          key={`${x}-${y}`}
                          className={`relative w-10 h-10 flex items-center justify-center text-xl font-mono transition-all ${bgStyle} ${cursorStyle}`}
                          onClick={() => !isWall && onCellSelected({ x, y })}
                          onMouseEnter={() => setHoveredCell({ x, y })}
                        >
                          {step !== 'preview' && !isWall && (
                            <span className="z-10 text-shadow-lg drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
                              {cellIcons[cell.type]}
                            </span>
                          )}
                          {hasAvatar && finalAvatarImages?.portrait && (
                            <img
                              src={finalAvatarImages.portrait.imageData}
                              alt="Avatar Token"
                              className="absolute inset-0 w-full h-full object-cover rounded-full p-1 z-20 drop-shadow-lg"
                            />
                          )}
                          {isSelected && !isWall && (
                            <div className="absolute inset-0 ring-2 ring-green-500 ring-inset z-30" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              {grid && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-20"
                  width={grid[0].length * CELL_SIZE}
                  height={grid.length * CELL_SIZE}
                >
                  <g stroke="rgba(203, 213, 225, 0.7)" strokeWidth="1.5" strokeLinecap="round">
                    {wallLines.map((line) => (
                      <line {...line} />
                    ))}
                  </g>
                </svg>
              )}
              {hoveredCell && grid && grid[hoveredCell.y]?.[hoveredCell.x] && (
                <div
                  className="absolute p-2 text-sm bg-slate-950/90 text-white rounded-md shadow-lg z-50 pointer-events-none transition-opacity duration-200"
                  style={{
                    left: `${hoveredCell.x * CELL_SIZE + CELL_SIZE / 2}px`,
                    top: `${hoveredCell.y * CELL_SIZE}px`,
                    transform: 'translate(-50%, -110%)',
                    ...(hoveredCell.y === 0 && { transform: 'translate(-50%, 20%)' }),
                  }}
                >
                  {grid[hoveredCell.y][hoveredCell.x].description}
                </div>
              )}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-black/20 via-transparent to-black/40 ring-1 ring-inset ring-white/10"></div>
            </div>
            {grid && (
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h5 className="font-semibold">Controls</h5>
                {selectedCell && grid[selectedCell.y]?.[selectedCell.x] && (
                  <p className="mt-2 text-slate-400">
                    Selected: ({selectedCell.x}, {selectedCell.y}) - {grid[selectedCell.y][selectedCell.x].description}
                  </p>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => selectedCell && onPlaceAvatar(selectedCell)}
                    disabled={!selectedCell || !finalAvatarImages}
                    className="mt-2"
                    title={
                      !finalAvatarImages
                        ? 'Generate an avatar first!'
                        : !selectedCell
                          ? 'Select a cell to place the avatar.'
                          : ''
                    }
                  >
                    Place Avatar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

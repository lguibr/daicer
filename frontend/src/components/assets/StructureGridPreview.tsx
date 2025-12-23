/**
 * Structure Grid Preview
 * Shows structure assets rendered on grid (for assets page)
 */

import { Card, CardContent, CardHeader } from '../ui/card';

interface StructureGridPreviewProps {
  structureId: string;
  structureName: string;
  structureData?: unknown; // JSON structure data
}

/**
 * Preview a structure asset on grid
 * Useful for visualizing procedurally generated buildings
 */
export function StructureGridPreview({ structureId, structureName, structureData }: StructureGridPreviewProps) {
  // const [currentLayer, setCurrentLayer] = useState(0);

  console.log('[StructureGridPreview] Rendering structure:', {
    structureId,
    structureName,
    hasData: !!structureData,
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>{structureName} - Grid Preview</CardHeader>
        <CardContent>
          {/* Z-Layer Control */}

          <div className="h-96 flex items-center justify-center bg-muted text-muted-foreground p-4 text-center">
            <p>Grid preview unavailable (Map system disabled)</p>
          </div>

          {/* Structure Data JSON */}
          {!!structureData && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold">Structure Data (JSON)</summary>
              <pre className="mt-2 overflow-auto rounded bg-muted p-4 text-xs">
                {JSON.stringify(structureData, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

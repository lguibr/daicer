import React, { useMemo, useEffect } from 'react';
import { Modal, Typography, Button, Box, Flex, Loader } from '@strapi/design-system';
import ExplorerCanvas from '../ExplorerCanvas';
import { useMapGenerator } from '../../hooks/useMapGenerator';

interface MapModalProps {
  onClose: () => void;
  roomData: any;
}

const MapModal = ({ onClose, roomData }: MapModalProps) => {
  const { isGenerating, generateChunk, chunks, structures, floor, setFloor, CHUNK_SIZE } =
    useMapGenerator();

  // Extract seed and params
  const seed = roomData?.settings?.seed || 'default';
  const generationParams = roomData?.settings?.generationParams;

  // Initial Seed
  useEffect(() => {
    // Generate center chunk if empty
    if (Object.keys(chunks).length === 0) {
      // Pass documentId as the identifier (backend handles lookup)
      generateChunk(roomData.documentId, 0, 0, generationParams);
    }
  }, [chunks, roomData.documentId, generateChunk, generationParams]);

  const handleRequestChunk = async (x: number, y: number) => {
    await generateChunk(roomData.documentId, x, y, generationParams);
  };

  const displayStructures = roomData?.structures?.length > 0 ? roomData.structures : structures;

  // Convert players
  const players = useMemo(() => {
    if (Array.isArray(roomData?.character_sheets)) {
      return roomData.character_sheets.map((sheet: any) => ({
        name: sheet.character?.name || 'Unknown',
        position: { x: 0, y: 0 },
      }));
    }
    return [];
  }, [roomData]);

  return (
    <Modal.Root defaultOpen onClose={onClose} labelledBy="title">
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>Terrain Explorer - {roomData.name || 'Room'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Flex direction="column" gap={2} width="100%" height="100%">
            {/* Toolbar */}
            <Flex gap={4} justifyContent="center" paddingBottom={2}>
              <Typography variant="sigma" textColor="neutral600">
                Level: {floor - 3}
              </Typography>
              <Flex gap={2}>
                <Button
                  size="S"
                  variant="tertiary"
                  onClick={() => setFloor(Math.max(0, floor - 1))}
                  disabled={floor <= 0}
                >
                  Descend
                </Button>
                <Button
                  size="S"
                  variant="tertiary"
                  onClick={() => setFloor(Math.min(6, floor + 1))}
                  disabled={floor >= 6}
                >
                  Ascend
                </Button>
              </Flex>
              {isGenerating && <Loader small>Loading...</Loader>}
            </Flex>

            <ExplorerCanvas
              chunks={chunks}
              players={players}
              structures={displayStructures}
              onRequestChunk={handleRequestChunk}
              currentFloor={floor}
              CHUNK_SIZE={CHUNK_SIZE}
            />
          </Flex>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close>
            <Button variant="tertiary">Close</Button>
          </Modal.Close>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

export default MapModal;

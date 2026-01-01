import React, { createContext, useContext, useState, useEffect } from 'react';
import { TimeFrame, Room } from '@daicer/engine';

interface TimeFrameContextType {
  currentTimeFrame: TimeFrame | null;
  history: TimeFrame[];
  isLive: boolean;
  jumpToFrame: (frameId: string) => void;
  goLive: () => void;
  isLoading: boolean;
}

const TimeFrameContext = createContext<TimeFrameContextType | undefined>(undefined);

export const TimeFrameProvider: React.FC<{
  room: Room | null;
  children: React.ReactNode;
}> = ({ room, children }) => {
  const [localFrameId, setLocalFrameId] = useState<string | null>(null);
  const [history, setHistory] = useState<TimeFrame[]>([]);

  useEffect(() => {
    // If room has timeFrames populated from GraphQL, use them as history
    if (room && room.timeFrames && Array.isArray(room.timeFrames)) {
      const backendHistory = room.timeFrames;
      // Sort by turn number
      const sorted = [...backendHistory].sort((a: TimeFrame, b: TimeFrame) => a.turnNumber - b.turnNumber);
      setHistory(sorted);
    }
  }, [room]);

  const currentTimeFrame = localFrameId
    ? history.find((f) => f.id === localFrameId || f.documentId === localFrameId) || null
    : history[history.length - 1] || null;

  const isLive = !localFrameId;

  const jumpToFrame = (frameId: string) => {
    setLocalFrameId(frameId);
  };

  const goLive = () => {
    setLocalFrameId(null);
  };

  return (
    <TimeFrameContext.Provider
      value={{
        currentTimeFrame,
        history,
        isLive,
        jumpToFrame,
        goLive,
        isLoading: false,
      }}
    >
      {children}
    </TimeFrameContext.Provider>
  );
};

export const useTimeFrame = () => {
  const context = useContext(TimeFrameContext);
  if (!context) {
    throw new Error('useTimeFrame must be used within a TimeFrameProvider');
  }
  return context;
};

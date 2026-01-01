import { ChatActionToolbar } from '@/components/chat/ChatActionToolbar';

interface AgentToolPaletteProps {
  onCommand: (command: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeEntity?: any;
  activeLocation?: { x: number; y: number; z: number; label: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  roomEntities?: any[];
}

export function AgentToolPalette({ onCommand, activeEntity, activeLocation, roomEntities }: AgentToolPaletteProps) {
  return (
    <div className="h-full bg-midnight-950 p-2">
      <ChatActionToolbar
        orientation="vertical"
        activeEntity={activeEntity}
        activeLocation={activeLocation}
        roomEntities={roomEntities}
        onCommandSelect={(cmd) => {
          // If the tool returns a prefix (e.g. "summon_monster(...)"), send it.
          // Note: ChatActionToolbar's cmd.prefix is the FULL command string for most tools now.
          // e.g. "summon_monster(id=...)"
          // e.g. "move_entity @Target"

          // We can just execute this directly or populate chat.
          // The user wanted "on spawn entity... capability to dropdown select".
          // So execute seems right for the "Tools" panel.
          onCommand(cmd.prefix);
        }}
      />
    </div>
  );
}

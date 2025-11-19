/**
 * RoomTabs Component
 * Tab navigation for room content (Chat/Map/Players/Settings)
 * Persists active tab in localStorage
 */

import { type ReactNode, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface RoomTabsProps {
  roomId: string;
  chatContent: ReactNode;
  mapContent: ReactNode;
  playersContent: ReactNode;
  settingsContent: ReactNode;
}

export function RoomTabs({ roomId, chatContent, mapContent, playersContent, settingsContent }: RoomTabsProps) {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem(`room-${roomId}-active-tab`) || 'chat');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem(`room-${roomId}-active-tab`, tab);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="flex h-full flex-col">
      <TabsList className="w-full border-b border-midnight-600 bg-midnight-900/90 sm:w-auto">
        <TabsTrigger value="chat" data-testid="room-tab-chat">
          💬 Chat
        </TabsTrigger>
        <TabsTrigger value="map" data-testid="room-tab-map">
          🗺️ Map
        </TabsTrigger>
        <TabsTrigger value="players" data-testid="room-tab-players">
          👥 Players
        </TabsTrigger>
        <TabsTrigger value="settings" data-testid="room-tab-settings">
          ⚙️ Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="chat" className="flex-1 overflow-hidden">
        {chatContent}
      </TabsContent>
      <TabsContent value="map" className="flex-1 overflow-hidden">
        {mapContent}
      </TabsContent>
      <TabsContent value="players" className="flex-1 overflow-hidden">
        {playersContent}
      </TabsContent>
      <TabsContent value="settings" className="flex-1 overflow-hidden">
        {settingsContent}
      </TabsContent>
    </Tabs>
  );
}

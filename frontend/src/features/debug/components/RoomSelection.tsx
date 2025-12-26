import { useQuery } from '@apollo/client';
import { LIST_ROOMS_QUERY } from '@/graphql/queries';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, ScrollText, Calendar, Loader2 } from 'lucide-react';

interface RoomSelectionProps {
  onSelect: (roomId: string) => void;
  onCreate: () => void;
}

export function RoomSelection({ onSelect, onCreate }: RoomSelectionProps) {
  const { data, loading, error } = useQuery(LIST_ROOMS_QUERY);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-aurora-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">Error loading rooms: {error.message}</div>
    );
  }

  const rooms = data?.rooms || [];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center border-b border-midnight-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-aurora-500 tracking-tighter">GAME LOBBY</h1>
          <p className="text-muted-foreground">Select an existing campaign or start a new adventure</p>
        </div>
        <Button onClick={onCreate} className="bg-aurora-600 hover:bg-aurora-500 text-midnight-950 font-bold">
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* New Room Card (Alternative) */}
        <div
          onClick={onCreate}
          className="border-2 border-dashed border-midnight-700 rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-aurora-500/50 hover:bg-midnight-800/50 transition-all group min-h-[200px]"
        >
          <div className="w-16 h-16 rounded-full bg-midnight-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="w-8 h-8 text-aurora-500" />
          </div>
          <h3 className="text-lg font-bold text-shadow-200">Create New Room</h3>
          <p className="text-sm text-muted-foreground text-center mt-2">Start a fresh campaign with custom settings</p>
        </div>

        {rooms.map((room: any) => (
          <Card
            key={room.documentId}
            className="group hover:border-aurora-500/50 transition-all cursor-pointer bg-midnight-900 border-midnight-800 overflow-hidden"
            onClick={() => onSelect(room.documentId)}
          >
            <div className="h-2 bg-gradient-to-r from-aurora-600 to-aurora-900" />
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl text-shadow-100 group-hover:text-aurora-300 transition-colors">
                  {room.roomId || 'Untitled Room'}
                </CardTitle>
                <span className="text-xs font-mono bg-midnight-950 px-2 py-1 rounded text-shadow-500">
                  {room.code || 'NO-CODE'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Setting Tags */}
              {room.dmSetting && (
                <div className="flex flex-wrap gap-2">
                  {room.dmSetting.theme && (
                    <span className="text-[10px] uppercase tracking-wider bg-midnight-950 px-2 py-0.5 rounded text-aurora-400 border border-aurora-900/30">
                      {room.dmSetting.theme}
                    </span>
                  )}
                  {room.dmSetting.difficulty && (
                    <span className="text-[10px] uppercase tracking-wider bg-red-950/30 px-2 py-0.5 rounded text-red-400 border border-red-900/30">
                      {room.dmSetting.difficulty}
                    </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{room.players?.length || 0} Players</span>
                </div>
                <div className="flex items-center gap-2">
                  <ScrollText className="w-4 h-4" />
                  <span>{room.character_sheets?.length || 0} Sheets</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <Calendar className="w-4 h-4" />
                  <span>{room.createdAt ? new Date(room.createdAt).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-midnight-950/50 border-t border-midnight-800 py-3">
              <span className="text-xs text-shadow-500 w-full text-center group-hover:text-aurora-500 transition-colors">
                Click to Join
              </span>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * RoomSettingsTab Component
 * Displays read-only room settings and leave room action
 */

import { Settings } from 'lucide-react';
import type { Room } from '@daicer/engine';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

interface RoomSettingsTabProps {
  room: Room;
  onLeave: () => void;
  asModal?: boolean;
}

export function RoomSettingsTab({ room, onLeave, asModal = false }: RoomSettingsTabProps) {
  const content = (
    <div className={asModal ? 'space-y-6' : 'mx-auto max-w-2xl space-y-6'}>
      {/* Room Info */}
      <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
        <CardHeader>
          <CardTitle className="text-xl text-white">Room Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Room Code</dt>
              <dd className="mt-1 font-mono text-lg font-bold text-accent">{room.code}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Phase</dt>
              <dd className="mt-1 text-sm text-white">{room.phase}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* DM Settings */}
      {room.dmSettings && (
        <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
          <CardHeader>
            <CardTitle className="text-xl text-white">Campaign Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Theme</dt>
                <dd className="mt-1 text-sm text-white">{room.dmSettings.theme}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Setting</dt>
                <dd className="mt-1 text-sm text-white">{room.dmSettings.setting}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Tone</dt>
                <dd className="mt-1 text-sm text-white">{room.dmSettings.tone}</dd>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Difficulty</dt>
                  <dd className="mt-1 text-sm capitalize text-white">{room.dmSettings.difficulty}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Party Size</dt>
                  <dd className="mt-1 text-sm text-white">{room.dmSettings.playerCount}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Starting Level</dt>
                  <dd className="mt-1 text-sm text-white">{room.dmSettings.startingLevel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Adv Length</dt>
                  <dd className="mt-1 text-sm capitalize text-white">{room.dmSettings.adventureLength}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Attr Budget</dt>
                  <dd className="mt-1 text-sm text-white">{room.dmSettings.attributePointBudget}</dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* World Configuration */}
      {room.world && (
        <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
          <CardHeader>
            <CardTitle className="text-xl text-white">World Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">World Size</dt>
                <dd className="mt-1 text-sm capitalize text-white">{room.world.worldSize}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* DM Style */}
      {room.dmSettings?.dmStyle && (
        <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
          <CardHeader>
            <CardTitle className="text-xl text-white">DM Personality</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Verbosity</dt>
                <dd className="mt-1 text-sm text-white">{room.dmSettings.dmStyle.verbosity + 1}/7</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Detail</dt>
                <dd className="mt-1 text-sm text-white">{room.dmSettings.dmStyle.detail + 1}/7</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Engagement</dt>
                <dd className="mt-1 text-sm text-white">{room.dmSettings.dmStyle.engagement + 1}/7</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Narrative</dt>
                <dd className="mt-1 text-sm text-white">{room.dmSettings.dmStyle.narrative + 1}/7</dd>
              </div>
              {room.dmSettings.dmStyle.specialMode && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Special Mode</dt>
                  <dd className="mt-1 text-sm capitalize text-accent">{room.dmSettings.dmStyle.specialMode}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* World Context */}
      {(room.world?.description ||
        room.world?.worldBackground ||
        room.world?.history ||
        room.dmSettings?.dmSystemPrompt) && (
        <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
          <CardHeader>
            <CardTitle className="text-xl text-white">World Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {room.world?.description && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-white/90">{room.world.description}</dd>
              </div>
            )}
            {room.world?.history && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">History</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-white/90">{room.world.history}</dd>
              </div>
            )}
            {room.world?.worldBackground && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Background Lore</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-white/90">{room.world.worldBackground}</dd>
              </div>
            )}
            {room.dmSettings?.dmSystemPrompt && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">DM System Prompt</dt>
                <dd className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-black/20 p-2 text-xs font-mono text-white/70">
                  {room.dmSettings.dmSystemPrompt}
                </dd>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Map Config */}
      {room.world && (
        <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
          <CardHeader>
            <CardTitle className="text-xl text-white">Map Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Seed</dt>
                <dd className="mt-1 font-mono text-sm text-accent">{room.world.seed}</dd>
              </div>

              {room.world.seaLevel !== undefined && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Sea Level</dt>
                  <dd className="mt-1 text-sm text-white">{room.world.seaLevel.toFixed(2)}</dd>
                </div>
              )}
              {room.world.temperatureOffset !== undefined && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Temp Offset</dt>
                  <dd className="mt-1 text-sm text-white">{room.world.temperatureOffset.toFixed(2)}</dd>
                </div>
              )}
              {room.world.fogRadius !== undefined && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Fog Radius</dt>
                  <dd className="mt-1 text-sm text-white">{room.world.fogRadius}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Detailed World Settings */}
      {room.world && (
        <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
          <CardHeader>
            <CardTitle className="text-xl text-white">Advanced Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {room.world.chunkSize !== undefined && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Chunk Size</dt>
                  <dd className="mt-1 text-sm text-white">{room.world.chunkSize}</dd>
                </div>
              )}
              {room.world.structureChance !== undefined && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Struct Chance</dt>
                  <dd className="mt-1 text-sm text-white">{room.world.structureChance}</dd>
                </div>
              )}
              {room.world.roadDensity !== undefined && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Road Density</dt>
                  <dd className="mt-1 text-sm text-white">{room.world.roadDensity}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="border-red-500/30 bg-gradient-to-br from-red-900/20 via-midnight-800/60 to-midnight-700/60">
        <CardContent className="p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-shadow-200">Danger Zone</h3>
          <Button onClick={onLeave} variant="destructive" className="w-full bg-red-500 hover:bg-red-600">
            Leave Room
          </Button>
          <p className="mt-2 text-xs text-shadow-500">You can rejoin later using the room code {room.code}</p>
        </CardContent>
      </Card>
    </div>
  );

  if (asModal) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-midnight-600 bg-midnight-900/80 backdrop-blur hover:bg-midnight-800"
          >
            <Settings className="h-5 w-5 text-shadow-300" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-midnight-700 bg-midnight-950/95 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Room Settings</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return <div className="h-full overflow-y-auto p-6">{content}</div>;
}

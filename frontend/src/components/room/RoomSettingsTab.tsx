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
      {room.settings && (
        <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
          <CardHeader>
            <CardTitle className="text-xl text-white">Campaign Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Theme</dt>
                <dd className="mt-1 text-sm text-white">{room.settings.theme}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Setting</dt>
                <dd className="mt-1 text-sm text-white">{room.settings.setting}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Tone</dt>
                <dd className="mt-1 text-sm text-white">{room.settings.tone}</dd>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Difficulty</dt>
                  <dd className="mt-1 text-sm capitalize text-white">{room.settings.difficulty}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Party Size</dt>
                  <dd className="mt-1 text-sm text-white">{room.settings.playerCount}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Starting Level</dt>
                  <dd className="mt-1 text-sm text-white">{room.settings.startingLevel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Adv Length</dt>
                  <dd className="mt-1 text-sm capitalize text-white">{room.settings.adventureLength}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Attr Budget</dt>
                  <dd className="mt-1 text-sm text-white">{room.settings.attributePointBudget}</dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* World Configuration */}
      {room.settings && (
        <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
          <CardHeader>
            <CardTitle className="text-xl text-white">World Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">World Size</dt>
                <dd className="mt-1 text-sm capitalize text-white">{room.settings.worldSize}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* DM Style */}
      {room.settings?.dmStyle && (
        <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
          <CardHeader>
            <CardTitle className="text-xl text-white">DM Personality</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Verbosity</dt>
                <dd className="mt-1 text-sm text-white">{room.settings.dmStyle.verbosity + 1}/7</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Detail</dt>
                <dd className="mt-1 text-sm text-white">{room.settings.dmStyle.detail + 1}/7</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Engagement</dt>
                <dd className="mt-1 text-sm text-white">{room.settings.dmStyle.engagement + 1}/7</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Narrative</dt>
                <dd className="mt-1 text-sm text-white">{room.settings.dmStyle.narrative + 1}/7</dd>
              </div>
              {room.settings.dmStyle.specialMode && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Special Mode</dt>
                  <dd className="mt-1 text-sm capitalize text-accent">{room.settings.dmStyle.specialMode}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* World Context */}
      {(room.worldDescription ||
        room.worldHistory ||
        room.settings?.worldBackground ||
        room.settings?.dmSystemPrompt) && (
        <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
          <CardHeader>
            <CardTitle className="text-xl text-white">World Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {room.worldDescription && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-white/90">{room.worldDescription}</dd>
              </div>
            )}
            {room.worldHistory && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">History</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-white/90">
                  {typeof room.worldHistory === 'string' ? room.worldHistory : JSON.stringify(room.worldHistory)}
                </dd>
              </div>
            )}
            {room.settings?.worldBackground && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Background Lore</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-white/90">{room.settings.worldBackground}</dd>
              </div>
            )}
            {room.settings?.dmSystemPrompt && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">DM System Prompt</dt>
                <dd className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-black/20 p-2 text-xs font-mono text-white/70">
                  {room.settings.dmSystemPrompt}
                </dd>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Map Config */}
      {room.settings && (
        <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
          <CardHeader>
            <CardTitle className="text-xl text-white">Map Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Seed</dt>
                <dd className="mt-1 font-mono text-sm text-accent">{room.settings.seed}</dd>
              </div>

              {room.settings.generationParams?.seaLevel !== undefined && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Sea Level</dt>
                  <dd className="mt-1 text-sm text-white">{room.settings.generationParams.seaLevel.toFixed(2)}</dd>
                </div>
              )}
              {room.settings.generationParams?.temperatureOffset !== undefined && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Temp Offset</dt>
                  <dd className="mt-1 text-sm text-white">
                    {room.settings.generationParams.temperatureOffset.toFixed(2)}
                  </dd>
                </div>
              )}
              {room.settings.generationParams?.fogRadius !== undefined && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Fog Radius</dt>
                  <dd className="mt-1 text-sm text-white">{room.settings.generationParams.fogRadius}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Detailed World Settings */}
      {room.settings && (
        <Card className="border-accent/30 bg-gradient-to-br from-midnight-900/70 via-midnight-800/60 to-midnight-700/60">
          <CardHeader>
            <CardTitle className="text-xl text-white">Advanced Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {room.settings.generationParams?.chunkSize !== undefined && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Chunk Size</dt>
                  <dd className="mt-1 text-sm text-white">{room.settings.generationParams.chunkSize}</dd>
                </div>
              )}
              {room.settings.generationParams?.structureChance !== undefined && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Struct Chance</dt>
                  <dd className="mt-1 text-sm text-white">{room.settings.generationParams.structureChance}</dd>
                </div>
              )}
              {room.settings.generationParams?.roadDensity !== undefined && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-shadow-400">Road Density</dt>
                  <dd className="mt-1 text-sm text-white">{room.settings.generationParams.roadDensity}</dd>
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

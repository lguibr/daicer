/**
 * Debug panel for development and troubleshooting
 */

import { useState, useEffect } from 'react';
import { isConnected, getSocket } from '../services/socket';

interface DebugEvent {
  timestamp: number;
  type: string;
  data: unknown;
}

/**
 * Debug panel component
 * @returns Debug UI
 */
export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [selectedTab, setSelectedTab] = useState<'events' | 'state'>('events');

  useEffect(() => {
    // Update socket status
    const interval = setInterval(() => {
      setSocketConnected(isConnected());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Listen for all socket events
    const socket = getSocket();
    if (!socket) return;

    const logEvent = (type: string) => (data: unknown) => {
      setEvents((prev) => [...prev.slice(-99), { timestamp: Date.now(), type, data }]);
    };

    socket.onAny(logEvent('*'));

    // No need for an explicit return here
  }, [socketConnected]);

  // Keyboard shortcut (Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 px-3 py-2 bg-slate-700 text-slate-300 text-xs rounded shadow-lg hover:bg-slate-600 transition-colors"
      >
        Debug (Ctrl+D)
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-96 h-96 bg-slate-900 border-l border-t border-slate-700 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700">
        <h3 className="font-bold text-sm text-cyan-400">Debug Panel</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-slate-400">{socketConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-800 border-b border-slate-700">
        <button
          type="button"
          onClick={() => setSelectedTab('events')}
          className={`flex-1 px-4 py-2 text-xs font-medium ${
            selectedTab === 'events' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Events ({events.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedTab('state')}
          className={`flex-1 px-4 py-2 text-xs font-medium ${
            selectedTab === 'state' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          State
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 text-xs font-mono">
        {selectedTab === 'events' && (
          <div className="space-y-1">
            {events.length === 0 && <p className="text-slate-500">No events yet...</p>}
            {events
              .slice()
              .reverse()
              .map((event) => (
                <div key={`${event.timestamp}-${event.type}`} className="p-2 bg-slate-800 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-cyan-400">{event.type}</span>
                    <span className="text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <pre className="text-slate-300 text-xs overflow-x-auto">{JSON.stringify(event.data, null, 2)}</pre>
                </div>
              ))}
          </div>
        )}

        {selectedTab === 'state' && (
          <div className="p-2">
            <div className="mb-2">
              <p className="text-slate-400">Socket Connected:</p>
              <p className="text-white">{socketConnected ? 'Yes' : 'No'}</p>
            </div>
            <div className="mb-2">
              <p className="text-slate-400">Environment:</p>
              <p className="text-white">{import.meta.env.MODE}</p>
            </div>
            <div className="mb-2">
              <p className="text-slate-400">API URL:</p>
              <p className="text-white break-all">{import.meta.env.VITE_API_URL || 'http://localhost:3001'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-2 bg-slate-800 border-t border-slate-700">
        <button
          type="button"
          onClick={() => setEvents([])}
          className="w-full px-3 py-1 bg-slate-700 text-slate-300 text-xs rounded hover:bg-slate-600 transition-colors"
        >
          Clear Events
        </button>
      </div>
    </div>
  );
}

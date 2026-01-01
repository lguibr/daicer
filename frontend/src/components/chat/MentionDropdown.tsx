import React from 'react';
import { createPortal } from 'react-dom';

interface MentionDropdownProps {
  suggestions: { id: string; name: string; type: 'monster' | 'character' }[];
  onSelect: (entity: { id: string; name: string; type: 'monster' | 'character' }) => void;
  isLoading?: boolean;
  position: { top: number; left: number };
  onClose: () => void;
}

export function MentionDropdown({ suggestions, onSelect, isLoading, position, onClose }: MentionDropdownProps) {
  if (!suggestions.length && !isLoading) return null;

  const style: React.CSSProperties = {
    position: 'absolute',
    top: position.top,
    left: position.left,
    zIndex: 9999, // Floating
  };

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={onClose} />
      <div
        className="w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-64"
        style={style}
      >
        {isLoading && <div className="p-2 text-gray-400 text-sm">Searching...</div>}
        {!isLoading && suggestions.length === 0 && (
          <div className="p-2 text-gray-500 text-sm italic">No matching entities</div>
        )}
        {!isLoading &&
          suggestions.map((s) => (
            <button
              type="button"
              key={s.id}
              className="flex items-center gap-2 p-2 hover:bg-gray-800 w-full text-left transition-colors cursor-pointer text-gray-200"
              onClick={() => onSelect(s)}
            >
              <span className={`w-2 h-2 rounded-full ${s.type === 'monster' ? 'bg-red-500' : 'bg-blue-500'}`} />
              <span className="truncate">{s.name}</span>
              <span className="text-xs text-gray-500 ml-auto uppercase">{s.type}</span>
            </button>
          ))}
      </div>
    </>,
    document.body
  );
}

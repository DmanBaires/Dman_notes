import React from 'react';
import { Note } from '../types/note';
import { FileText, Calendar, Tag, ArrowRight } from 'lucide-react';

interface HoverPreviewCardProps {
  note: Note | null;
  position: { x: number; y: number } | null;
  targetTitle: string;
}

export const HoverPreviewCard: React.FC<HoverPreviewCardProps> = ({
  note,
  position,
  targetTitle,
}) => {
  if (!position) return null;

  // Position nicely relative to mouse cursor
  const style: React.CSSProperties = {
    position: 'fixed',
    left: `${Math.min(window.innerWidth - 320, Math.max(16, position.x - 100))}px`,
    top: `${Math.min(window.innerHeight - 200, position.y + 24)}px`,
    zIndex: 9999,
  };

  return (
    <div
      style={style}
      className="w-80 rounded-lg bg-neutral-900/95 border border-neutral-700/80 shadow-2xl backdrop-blur-md p-4 text-xs pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
    >
      {note ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-1.5 font-semibold text-neutral-100 text-sm truncate">
              <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{note.title}</span>
            </div>
            <span className="text-[10px] text-neutral-400 shrink-0 bg-neutral-800 px-1.5 py-0.5 rounded">
              {note.folder}
            </span>
          </div>

          <p className="text-neutral-300 line-clamp-3 leading-relaxed">
            {note.content
              .replace(/#+\s+/g, '')
              .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1')
              .replace(/!\[.*?\]\(.*?\)/g, '[Image]')
              .slice(0, 180)}
            ...
          </p>

          <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/60">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-neutral-500" />
              <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1 text-sky-400 font-medium">
              <span>Open Note</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 py-1">
          <div className="flex items-center gap-1.5 font-medium text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Uncreated Note: "{targetTitle}"</span>
          </div>
          <p className="text-neutral-400 leading-snug">
            This note does not exist yet. Click to create a new page for <span className="text-neutral-200">"{targetTitle}"</span>.
          </p>
        </div>
      )}
    </div>
  );
};

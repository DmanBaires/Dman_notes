import React, { useState, useEffect, useRef } from 'react';
import { Note } from '../types/note';
import { Search, FileText, Plus, ArrowRight, CornerDownLeft, Sparkles } from 'lucide-react';

interface QuickSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onSelectNote: (noteId: string) => void;
  onCreateNote: (title: string) => void;
}

export const QuickSwitcherModal: React.FC<QuickSwitcherModalProps> = ({
  isOpen,
  onClose,
  notes,
  onSelectNote,
  onCreateNote,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredNotes = React.useMemo(() => {
    if (!query.trim()) return notes.slice(0, 8);
    const q = query.toLowerCase().trim();
    return notes
      .filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.folder.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)) ||
          n.content.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [notes, query]);

  const canCreate = query.trim().length > 0 && !notes.some((n) => n.title.toLowerCase() === query.trim().toLowerCase());

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = filteredNotes.length + (canCreate ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + Math.max(1, totalItems)) % Math.max(1, totalItems));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < filteredNotes.length) {
        onSelectNote(filteredNotes[selectedIndex].id);
        onClose();
      } else if (canCreate) {
        onCreateNote(query.trim());
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl bg-neutral-900 border border-neutral-700 shadow-2xl overflow-hidden flex flex-col text-neutral-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-800 bg-neutral-900">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type to find or create a note (e.g. Vincent van Gogh)..."
            className="flex-1 bg-transparent text-sm text-neutral-100 placeholder-neutral-500 outline-hidden font-display"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-400 font-mono border border-neutral-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredNotes.map((note, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={note.id}
                onClick={() => {
                  onSelectNote(note.id);
                  onClose();
                }}
                className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-rose-950/70 border border-rose-800/60 text-white'
                    : 'hover:bg-neutral-800/70 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-3 truncate min-w-0">
                  <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-rose-400' : 'text-neutral-500'}`} />
                  <div className="truncate">
                    <div className="text-sm font-medium truncate flex items-center gap-2">
                      <span className="truncate">{note.title}</span>
                      <span className="text-[10px] text-neutral-400 bg-neutral-800/80 px-1.5 py-0.2 rounded shrink-0">
                        {note.folder}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400 truncate font-mono">
                      {note.content.slice(0, 90).replace(/[#*`[\]]/g, '')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-400 shrink-0 ml-3">
                  {isSelected && (
                    <span className="flex items-center gap-1 text-rose-300 font-mono text-[11px]">
                      <span>Open</span>
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Option to create a new note if query doesn't match */}
          {canCreate && (
            <div
              onClick={() => {
                onCreateNote(query.trim());
                onClose();
              }}
              className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                selectedIndex === filteredNotes.length
                  ? 'bg-rose-950/70 border border-rose-800/60 text-white'
                  : 'hover:bg-neutral-800/70 text-sky-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Plus className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <div className="text-sm font-medium">Create note "{query.trim()}"</div>
                  <div className="text-xs text-neutral-400">
                    Instantly create and link this note across your wiki
                  </div>
                </div>
              </div>
              <CornerDownLeft className="w-4 h-4 opacity-70" />
            </div>
          )}

          {filteredNotes.length === 0 && !canCreate && (
            <div className="py-8 text-center text-xs text-neutral-500">
              No matching notes found
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-neutral-800 px-1 py-0.5 rounded border border-neutral-700">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono bg-neutral-800 px-1 py-0.5 rounded border border-neutral-700">↵</kbd> Select</span>
            <span><kbd className="font-mono bg-neutral-800 px-1 py-0.5 rounded border border-neutral-700">ESC</kbd> Close</span>
          </div>
          <span className="text-neutral-400">Debian WikiNote Quick Switcher</span>
        </div>
      </div>
    </div>
  );
};

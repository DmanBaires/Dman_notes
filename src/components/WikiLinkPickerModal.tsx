import React, { useState } from 'react';
import { Note } from '../types/note';
import { Link2, Search, Plus, X, FileText } from 'lucide-react';

interface WikiLinkPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  currentNoteId: string;
  onInsertLink: (targetTitle: string, customLabel?: string) => void;
}

export const WikiLinkPickerModal: React.FC<WikiLinkPickerModalProps> = ({
  isOpen,
  onClose,
  notes,
  currentNoteId,
  onInsertLink,
}) => {
  const [query, setQuery] = useState('');
  const [customLabel, setCustomLabel] = useState('');

  if (!isOpen) return null;

  const candidateNotes = notes
    .filter((n) => n.id !== currentNoteId)
    .filter((n) => !query.trim() || n.title.toLowerCase().includes(query.toLowerCase().trim()));

  const handlePick = (title: string) => {
    onInsertLink(title, customLabel.trim() || undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-neutral-900 border border-neutral-700 shadow-2xl p-5 text-neutral-100 flex flex-col space-y-4 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white font-display">
              Insert Wiki Link [[...]]
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-neutral-400 mb-1">Search note to link</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find note (e.g. Frida Kahlo)..."
                autoFocus
                className="w-full bg-neutral-950 border border-neutral-800 rounded pl-8 pr-3 py-1.5 text-neutral-200 outline-hidden focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">
              Custom display label (optional, e.g. "Mexican surrealist")
            </label>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="Leave blank to use note title"
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-neutral-200 outline-hidden focus:border-sky-500"
            />
          </div>

          {/* Notes list */}
          <div className="max-h-52 overflow-y-auto rounded border border-neutral-800 bg-neutral-950 divide-y divide-neutral-800/60">
            {candidateNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => handlePick(note.title)}
                className="w-full text-left p-2.5 hover:bg-neutral-800/80 transition-colors flex items-center justify-between text-neutral-300 hover:text-white"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="font-medium truncate">{note.title}</span>
                </div>
                <span className="text-[10px] text-neutral-400 shrink-0">{note.folder}</span>
              </button>
            ))}

            {candidateNotes.length === 0 && query.trim() && (
              <button
                onClick={() => handlePick(query.trim())}
                className="w-full text-left p-3 hover:bg-neutral-800 text-sky-400 flex items-center gap-2 font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Link to new page: "{query.trim()}"</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800 text-xs">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded hover:bg-neutral-800 text-neutral-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Note } from '../types/note';
import { DEBIAN_SVG_ICON } from '../utils/debBuilder';
import {
  Search,
  Pin,
  Trash2,
  Folder,
  Tag,
  Plus,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface SidebarProps {
  notes: Note[];
  currentNoteId: string;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (noteId: string) => void;
  onTogglePin: (noteId: string) => void;
  onOpenDebianExport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  currentNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onTogglePin,
  onOpenDebianExport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');

  // Extract unique folders
  const folders = React.useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      if (n.folder) set.add(n.folder);
    });
    return Array.from(set).sort();
  }, [notes]);

  // Filter notes
  const filteredNotes = React.useMemo(() => {
    return notes
      .filter((note) => {
        if (selectedFolder !== 'all' && note.folder !== selectedFolder) {
          return false;
        }
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          note.title.toLowerCase().includes(q) ||
          note.folder.toLowerCase().includes(q) ||
          note.tags.some((t) => t.toLowerCase().includes(q)) ||
          note.content.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // Pinned notes first, then by updatedAt desc
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.updatedAt - a.updatedAt;
      });
  }, [notes, searchQuery, selectedFolder]);

  // Format relative time
  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <aside className="w-64 md:w-72 h-full bg-neutral-900 border-r border-neutral-800 flex flex-col select-none shrink-0 z-20">
      {/* Search & Filter Bar */}
      <div className="p-3 border-b border-neutral-800 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, artists, tags..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-md pl-8 pr-2.5 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 outline-hidden focus:border-rose-500/80 font-sans"
          />
        </div>

        {/* Folder filter chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
          <button
            onClick={() => setSelectedFolder('all')}
            className={`px-2 py-0.5 rounded transition-colors shrink-0 ${
              selectedFolder === 'all'
                ? 'bg-neutral-800 text-white font-medium'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All ({notes.length})
          </button>
          {folders.map((folder) => {
            const count = notes.filter((n) => n.folder === folder).length;
            return (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`px-2 py-0.5 rounded transition-colors shrink-0 ${
                  selectedFolder === folder
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {folder} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/40">
        {filteredNotes.map((note) => {
          const isSelected = note.id === currentNoteId;
          const snippet = note.content
            .replace(/#+\s+/g, '')
            .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1')
            .replace(/!\[.*?\]\(.*?\)/g, '')
            .trim()
            .slice(0, 80);

          return (
            <div
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className={`group p-3 cursor-pointer transition-colors relative ${
                isSelected
                  ? 'bg-rose-950/40 border-l-2 border-rose-500 text-white'
                  : 'hover:bg-neutral-800/60 text-neutral-300'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {note.pinned && (
                    <Pin className="w-3 h-3 text-rose-400 fill-rose-400/30 shrink-0" />
                  )}
                  <h3 className="text-xs font-semibold font-display truncate">
                    {note.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(note.id);
                    }}
                    title={note.pinned ? 'Unpin' : 'Pin to top'}
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                  {notes.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete note "${note.title}"?`)) {
                          onDeleteNote(note.id);
                        }
                      }}
                      title="Delete note"
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {snippet && (
                <p className="text-[11px] text-neutral-400 line-clamp-2 leading-snug mb-1.5 font-sans">
                  {snippet}
                </p>
              )}

              <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-0.5">
                <span className="truncate max-w-[120px] bg-neutral-950/70 px-1.5 py-0.2 rounded">
                  {note.folder}
                </span>
                <span>{formatTime(note.updatedAt)}</span>
              </div>
            </div>
          );
        })}

        {filteredNotes.length === 0 && (
          <div className="p-8 text-center text-xs text-neutral-500 space-y-2">
            <p>No notes found matching your search</p>
            <button
              onClick={onCreateNote}
              className="text-rose-400 hover:text-rose-300 font-medium"
            >
              + Create note now
            </button>
          </div>
        )}
      </div>

      {/* Debian Package Quick Trigger Footer */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs">
        <div
          onClick={onOpenDebianExport}
          className="flex items-center gap-2 cursor-pointer group"
          title="Open Debian .deb packaging suite"
        >
          <div
            className="w-5 h-5 rounded overflow-hidden shrink-0 group-hover:scale-105 transition-transform"
            dangerouslySetInnerHTML={{ __html: DEBIAN_SVG_ICON }}
          />
          <div className="text-[11px]">
            <div className="font-semibold text-neutral-200 group-hover:text-rose-400 transition-colors">
              Debian Package Ready
            </div>
            <div className="text-neutral-400 text-[10px]">
              amd64 · dpkg-deb compliant
            </div>
          </div>
        </div>

        <button
          onClick={onCreateNote}
          className="p-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white transition-colors"
          title="New Note"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};

import React, { useState } from 'react';
import { ViewMode, Note } from '../types/note';
import { DEBIAN_SVG_ICON } from '../utils/debBuilder';
import {
  Sidebar,
  Plus,
  Search,
  Download,
  Share2,
  FileDown,
  Minimize2,
  Square,
  X,
  Edit3,
  Columns,
  Eye,
  Network,
  Package,
  Check,
} from 'lucide-react';

interface GnomeHeaderBarProps {
  currentNote: Note | null;
  onUpdateTitle: (newTitle: string) => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onCreateNewNote: () => void;
  onOpenQuickSwitcher: () => void;
  onOpenDebianExport: () => void;
  onExportMarkdown: () => void;
  onExportAllZip: () => void;
}

export const GnomeHeaderBar: React.FC<GnomeHeaderBarProps> = ({
  currentNote,
  onUpdateTitle,
  viewMode,
  onChangeViewMode,
  onToggleSidebar,
  isSidebarOpen,
  onCreateNewNote,
  onOpenQuickSwitcher,
  onOpenDebianExport,
  onExportMarkdown,
  onExportAllZip,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleBuffer, setTitleBuffer] = useState('');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [windowState, setWindowState] = useState<'normal' | 'maximized'>('normal');

  const startEditTitle = () => {
    if (!currentNote) return;
    setTitleBuffer(currentNote.title);
    setIsEditingTitle(true);
  };

  const saveTitle = () => {
    if (titleBuffer.trim() && currentNote) {
      onUpdateTitle(titleBuffer.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="h-12 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-3 select-none text-neutral-200 z-30 shrink-0">
      {/* Left zone: Debian brand, sidebar toggle, new note */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Hide Sidebar (Ctrl+\\)' : 'Show Sidebar'}
          className={`p-1.5 rounded hover:bg-neutral-800 transition-colors ${
            isSidebarOpen ? 'text-neutral-200' : 'text-neutral-400'
          }`}
        >
          <Sidebar className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 pl-1 border-l border-neutral-800">
          <div
            className="w-5 h-5 rounded overflow-hidden shrink-0 cursor-pointer"
            onClick={onOpenDebianExport}
            title="Debian GNU/Linux Desktop Integration"
            dangerouslySetInnerHTML={{ __html: DEBIAN_SVG_ICON }}
          />
          <span className="font-display font-bold text-sm tracking-tight text-white hidden sm:inline">
            WikiNote
          </span>
        </div>

        <button
          onClick={onCreateNewNote}
          title="New Note (Ctrl+N)"
          className="ml-2 flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden md:inline">New Note</span>
        </button>
      </div>

      {/* Center zone: Active note title and view switcher */}
      <div className="flex items-center gap-3 max-w-md truncate">
        {currentNote && viewMode !== 'graph' && (
          <div className="flex items-center gap-1.5 truncate">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleBuffer}
                onChange={(e) => setTitleBuffer(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                autoFocus
                className="bg-neutral-950 border border-rose-500 rounded px-2 py-0.5 text-xs text-white font-display outline-hidden font-semibold"
              />
            ) : (
              <span
                onClick={startEditTitle}
                title="Click to rename note"
                className="font-display font-semibold text-xs text-neutral-100 hover:text-rose-400 cursor-pointer truncate max-w-[180px] md:max-w-[240px] px-1 py-0.5 rounded hover:bg-neutral-800/60 transition-colors"
              >
                {currentNote.title}
              </span>
            )}
          </div>
        )}

        {/* View mode segmented buttons */}
        <div className="flex items-center p-0.5 bg-neutral-950/80 rounded-lg border border-neutral-800 text-xs">
          <button
            onClick={() => onChangeViewMode('edit')}
            title="Edit Mode (Ctrl+E)"
            className={`p-1 px-2 rounded flex items-center gap-1 transition-colors ${
              viewMode === 'edit'
                ? 'bg-neutral-800 text-white shadow-xs font-medium'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Edit</span>
          </button>
          <button
            onClick={() => onChangeViewMode('split')}
            title="Split Mode (Editor & Preview)"
            className={`p-1 px-2 rounded flex items-center gap-1 transition-colors ${
              viewMode === 'split'
                ? 'bg-neutral-800 text-white shadow-xs font-medium'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Split</span>
          </button>
          <button
            onClick={() => onChangeViewMode('preview')}
            title="Reading & Preview Mode"
            className={`p-1 px-2 rounded flex items-center gap-1 transition-colors ${
              viewMode === 'preview'
                ? 'bg-neutral-800 text-white shadow-xs font-medium'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Preview</span>
          </button>
          <button
            onClick={() => onChangeViewMode('graph')}
            title="Knowledge Graph View"
            className={`p-1 px-2 rounded flex items-center gap-1 transition-colors ${
              viewMode === 'graph'
                ? 'bg-neutral-800 text-white shadow-xs font-medium'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden lg:inline text-[11px]">Graph</span>
          </button>
        </div>
      </div>

      {/* Right zone: Omnibar, export, debian builder, window buttons */}
      <div className="flex items-center gap-2">
        {/* Quick Switcher Button */}
        <button
          onClick={onOpenQuickSwitcher}
          title="Quick Switcher / Search (Ctrl+P or Ctrl+K)"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs border border-neutral-700/60 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden xl:inline text-[11px]">Quick Open</span>
          <kbd className="hidden sm:inline-block font-mono text-[10px] text-neutral-400 bg-neutral-900 px-1 rounded">
            Ctrl+P
          </kbd>
        </button>

        {/* Export dropdown */}
        <div className="relative">
          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            title="Export Markdown / ZIP"
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          {exportMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-52 rounded-lg bg-neutral-900 border border-neutral-700 shadow-xl py-1 z-50 text-xs animate-in fade-in zoom-in-95"
              onMouseLeave={() => setExportMenuOpen(false)}
            >
              <button
                onClick={() => {
                  onExportMarkdown();
                  setExportMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 text-neutral-200 flex items-center gap-2"
              >
                <FileDown className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="font-medium">Export Current Note (.md)</div>
                  <div className="text-[10px] text-neutral-400">Download formatted Markdown</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onExportAllZip();
                  setExportMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 text-neutral-200 flex items-center gap-2 border-t border-neutral-800"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="font-medium">Export Library (.zip)</div>
                  <div className="text-[10px] text-neutral-400">All notes as Markdown files</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Debian Package Builder Button */}
        <button
          onClick={onOpenDebianExport}
          title="Build Debian .deb Package for Linux Desktop"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs border border-neutral-700 transition-colors"
        >
          <Package className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-medium hidden md:inline text-[11px]">.deb Package</span>
        </button>

        {/* GNOME Native Desktop Window Controls */}
        <div className="flex items-center gap-1 pl-2 border-l border-neutral-800">
          <button
            title="Minimize"
            className="w-4 h-4 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors group"
          >
            <span className="w-2 h-0.5 bg-neutral-400 group-hover:bg-neutral-200" />
          </button>
          <button
            title={windowState === 'maximized' ? 'Restore' : 'Maximize'}
            onClick={() => setWindowState(windowState === 'maximized' ? 'normal' : 'maximized')}
            className="w-4 h-4 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors group"
          >
            <Square className="w-2 h-2 text-neutral-400 group-hover:text-neutral-200" />
          </button>
          <button
            title="Close"
            className="w-4 h-4 rounded-full bg-neutral-800 hover:bg-rose-700 flex items-center justify-center transition-colors group"
          >
            <X className="w-2.5 h-2.5 text-neutral-400 group-hover:text-white" />
          </button>
        </div>
      </div>
    </header>
  );
};

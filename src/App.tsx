import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Note, ViewMode } from './types/note';
import { loadNotes, saveNotes, exportSingleNoteAsMarkdown, exportAllNotesAsZip } from './utils/storage';
import { GnomeHeaderBar } from './components/GnomeHeaderBar';
import { Sidebar } from './components/Sidebar';
import { EditorToolbar } from './components/EditorToolbar';
import { MarkdownEditor } from './components/MarkdownEditor';
import { MarkdownPreview } from './components/MarkdownPreview';
import { BacklinksPanel } from './components/BacklinksPanel';
import { GraphView } from './components/GraphView';
import { HoverPreviewCard } from './components/HoverPreviewCard';
import { QuickSwitcherModal } from './components/QuickSwitcherModal';
import { DebianExportModal } from './components/DebianExportModal';
import { WikiLinkPickerModal } from './components/WikiLinkPickerModal';

export default function App() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());
  const [currentNoteId, setCurrentNoteId] = useState<string>(() => {
    const loaded = loadNotes();
    return loaded[0]?.id || 'note-favorite-artists';
  });
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modals state
  const [isQuickSwitcherOpen, setIsQuickSwitcherOpen] = useState(false);
  const [isDebianExportOpen, setIsDebianExportOpen] = useState(false);
  const [isWikiPickerOpen, setIsWikiPickerOpen] = useState(false);

  // Wiki Link hover state
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoverTargetTitle, setHoverTargetTitle] = useState<string>('');

  // Undo / Redo history state
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Current note object
  const currentNote = notes.find((n) => n.id === currentNoteId) || notes[0] || null;

  // Persist notes on changes
  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  // Sync undo history when changing notes
  useEffect(() => {
    if (currentNote) {
      setHistory([currentNote.content]);
      setHistoryIndex(0);
    }
  }, [currentNoteId]);

  /**
   * Handle note content changes with history snapshot
   */
  const handleContentChange = useCallback(
    (newContent: string) => {
      if (!currentNote) return;

      // Update current note in notes array
      setNotes((prevNotes) =>
        prevNotes.map((n) =>
          n.id === currentNoteId
            ? { ...n, content: newContent, updatedAt: Date.now() }
            : n
        )
      );

      // Add to undo history
      setHistory((prevHistory) => {
        const nextSlice = prevHistory.slice(0, historyIndex + 1);
        return [...nextSlice, newContent];
      });
      setHistoryIndex((prevIdx) => prevIdx + 1);
    },
    [currentNote, currentNoteId, historyIndex]
  );

  /**
   * Undo handler
   */
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetContent = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setNotes((prevNotes) =>
        prevNotes.map((n) =>
          n.id === currentNoteId
            ? { ...n, content: targetContent, updatedAt: Date.now() }
            : n
        )
      );
    }
  }, [history, historyIndex, currentNoteId]);

  /**
   * Redo handler
   */
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetContent = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setNotes((prevNotes) =>
        prevNotes.map((n) =>
          n.id === currentNoteId
            ? { ...n, content: targetContent, updatedAt: Date.now() }
            : n
        )
      );
    }
  }, [history, historyIndex, currentNoteId]);

  /**
   * Update note title
   */
  const handleUpdateTitle = (newTitle: string) => {
    if (!currentNote || !newTitle.trim()) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === currentNoteId ? { ...n, title: newTitle.trim(), updatedAt: Date.now() } : n))
    );
  };

  /**
   * Create a new note
   */
  const handleCreateNote = (suggestedTitle?: string) => {
    const title = suggestedTitle?.trim() || `Untitled Note ${notes.length + 1}`;
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      folder: 'General',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
      content: `# ${title}\n\nStart writing here... Use [[WikiLinks]] or mention other note titles to automatically connect your notes.\n`,
    };

    setNotes((prev) => [newNote, ...prev]);
    setCurrentNoteId(newNote.id);
    setViewMode('split');
  };

  /**
   * Delete a note
   */
  const handleDeleteNote = (noteId: string) => {
    const remaining = notes.filter((n) => n.id !== noteId);
    setNotes(remaining);
    if (currentNoteId === noteId) {
      setCurrentNoteId(remaining[0]?.id || '');
    }
  };

  /**
   * Toggle pin state of note
   */
  const handleTogglePin = (noteId: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, pinned: !n.pinned } : n))
    );
  };

  /**
   * Navigate to note by title (or create if not found)
   */
  const handleNavigateToTitle = (targetTitle: string) => {
    const found = notes.find(
      (n) => n.title.trim().toLowerCase() === targetTitle.trim().toLowerCase()
    );

    if (found) {
      setCurrentNoteId(found.id);
    } else {
      handleCreateNote(targetTitle);
    }
  };

  /**
   * Insert text with toolbar styling (bold, italic, strikethrough, etc.)
   */
  const handleInsertText = (prefix: string, suffix = '', defaultText = '') => {
    const textarea = editorRef.current;
    if (!textarea || !currentNote) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end) || defaultText;
    const replacement = prefix + selected + suffix;

    const newContent =
      textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    handleContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      const cursorEnd = start + prefix.length + selected.length;
      textarea.setSelectionRange(cursorEnd, cursorEnd);
    }, 10);
  };

  /**
   * Apply Heading to current line
   */
  const handleApplyHeading = (level: number | 'body' | 'small') => {
    const textarea = editorRef.current;
    if (!textarea || !currentNote) return;

    const cursor = textarea.selectionStart;
    const content = textarea.value;
    const lineStart = content.lastIndexOf('\n', cursor - 1) + 1;
    const lineEnd = content.indexOf('\n', cursor);
    const endIdx = lineEnd === -1 ? content.length : lineEnd;
    const currentLine = content.slice(lineStart, endIdx);

    // Strip existing markdown heading hashes
    const cleanLine = currentLine.replace(/^#+\s+/, '');

    let newLine = cleanLine;
    if (typeof level === 'number') {
      const hashes = '#'.repeat(level);
      newLine = `${hashes} ${cleanLine}`;
    } else if (level === 'small') {
      newLine = `<small>${cleanLine}</small>`;
    }

    const newContent = content.slice(0, lineStart) + newLine + content.slice(endIdx);
    handleContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      const newPos = lineStart + newLine.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  /**
   * Insert Image markdown
   */
  const handleInsertImage = (src: string, alt: string) => {
    const imgMarkdown = `\n![${alt || 'Image'}](${src})\n`;
    handleInsertText(imgMarkdown, '');
  };

  /**
   * Insert explicit Wiki Link [[Title]]
   */
  const handleInsertWikiLink = (targetTitle: string, customLabel?: string) => {
    const linkSyntax = customLabel ? `[[${targetTitle}|${customLabel}]]` : `[[${targetTitle}]]`;
    handleInsertText(linkSyntax, ' ');
  };

  /**
   * Convert an unlinked mention in a source note into an explicit [[targetTitle]] wiki link
   */
  const handleConvertMentionToLink = (sourceNoteId: string, targetTitle: string) => {
    setNotes((prevNotes) =>
      prevNotes.map((n) => {
        if (n.id !== sourceNoteId) return n;
        // Replace first word-boundary occurrence of targetTitle with [[targetTitle]]
        const escaped = targetTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b(${escaped})\\b`, 'i');
        const updated = n.content.replace(regex, `[[$1]]`);
        return {
          ...n,
          content: updated,
          updatedAt: Date.now(),
        };
      })
    );
  };

  /**
   * Toggle interactive checkbox in preview
   */
  const handleToggleCheckbox = (lineIndex: number, currentChecked: boolean) => {
    if (!currentNote) return;
    const lines = currentNote.content.split('\n');
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const targetLine = lines[lineIndex];
      const newChar = currentChecked ? ' ' : 'x';
      lines[lineIndex] = targetLine.replace(/^([-*]\s+\[)[ xX](\])/, `$1${newChar}$2`);
      handleContentChange(lines.join('\n'));
    }
  };

  /**
   * Global Keyboard Shortcuts
   */
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      // Ctrl+P or Ctrl+K -> Quick Switcher
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'k')) {
        e.preventDefault();
        setIsQuickSwitcherOpen((prev) => !prev);
      }
      // Ctrl+N -> New Note
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleCreateNote();
      }
      // Ctrl+\ -> Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
      // Ctrl+E -> Cycle View Modes
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setViewMode((current) => {
          if (current === 'split') return 'edit';
          if (current === 'edit') return 'preview';
          if (current === 'preview') return 'graph';
          return 'split';
        });
      }
      // Ctrl+Shift+E -> Debian Package Suite
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setIsDebianExportOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [notes]);

  // Find hover note for hover card
  const hoverNote = React.useMemo(() => {
    if (!hoverTargetTitle) return null;
    return (
      notes.find((n) => n.title.trim().toLowerCase() === hoverTargetTitle.trim().toLowerCase()) || null
    );
  }, [hoverTargetTitle, notes]);

  return (
    <div className="w-screen h-screen flex flex-col bg-neutral-900 text-neutral-100 overflow-hidden select-none">
      {/* GNOME HeaderBar */}
      <GnomeHeaderBar
        currentNote={currentNote}
        onUpdateTitle={handleUpdateTitle}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onCreateNewNote={() => handleCreateNote()}
        onOpenQuickSwitcher={() => setIsQuickSwitcherOpen(true)}
        onOpenDebianExport={() => setIsDebianExportOpen(true)}
        onExportMarkdown={() => currentNote && exportSingleNoteAsMarkdown(currentNote)}
        onExportAllZip={() => exportAllNotesAsZip(notes)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        {isSidebarOpen && (
          <Sidebar
            notes={notes}
            currentNoteId={currentNoteId}
            onSelectNote={(id) => {
              setCurrentNoteId(id);
              if (viewMode === 'graph') setViewMode('split');
            }}
            onCreateNote={() => handleCreateNote()}
            onDeleteNote={handleDeleteNote}
            onTogglePin={handleTogglePin}
            onOpenDebianExport={() => setIsDebianExportOpen(true)}
          />
        )}

        {/* Workspace Canvas */}
        <main className="flex-1 flex flex-col h-full bg-neutral-900 overflow-hidden relative">
          {viewMode === 'graph' ? (
            <GraphView
              notes={notes}
              currentNoteId={currentNoteId}
              onSelectNote={(id) => {
                setCurrentNoteId(id);
                setViewMode('split');
              }}
            />
          ) : currentNote ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Rich Formatting Toolbar (Available in edit & split modes) */}
              {(viewMode === 'edit' || viewMode === 'split') && (
                <EditorToolbar
                  onInsertText={handleInsertText}
                  onApplyHeading={handleApplyHeading}
                  onInsertImage={handleInsertImage}
                  onOpenWikiLinkPicker={() => setIsWikiPickerOpen(true)}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  canUndo={historyIndex > 0}
                  canRedo={historyIndex < history.length - 1}
                />
              )}

              {/* Editor / Preview Work Area */}
              <div className="flex-1 flex overflow-hidden">
                {/* Markdown Editor Pane */}
                {(viewMode === 'edit' || viewMode === 'split') && (
                  <div
                    className={`h-full overflow-hidden flex flex-col ${
                      viewMode === 'split' ? 'w-1/2 border-r border-neutral-800' : 'w-full'
                    }`}
                  >
                    <MarkdownEditor
                      value={currentNote.content}
                      onChange={handleContentChange}
                      allNotes={notes}
                      currentNoteId={currentNoteId}
                      onNavigateToTitle={handleNavigateToTitle}
                      editorRef={editorRef}
                      canUndo={historyIndex > 0}
                      canRedo={historyIndex < history.length - 1}
                      onUndo={handleUndo}
                      onRedo={handleRedo}
                    />
                  </div>
                )}

                {/* Markdown Preview Pane (Wiki-hyperlinking & images) */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                  <div
                    className={`h-full overflow-y-auto bg-neutral-950/50 flex flex-col justify-between ${
                      viewMode === 'split' ? 'w-1/2' : 'w-full'
                    }`}
                  >
                    <div className="flex-1">
                      <MarkdownPreview
                        content={currentNote.content}
                        allNotes={notes}
                        currentNoteId={currentNoteId}
                        onNavigateToTitle={handleNavigateToTitle}
                        onHoverLink={(title, pos) => {
                          setHoverTargetTitle(title);
                          setHoverPosition(pos);
                        }}
                        onToggleCheckbox={handleToggleCheckbox}
                      />
                    </div>

                    {/* Backlinks & Mentions Panel */}
                    <BacklinksPanel
                      currentNote={currentNote}
                      allNotes={notes}
                      onNavigateToNote={(id) => setCurrentNoteId(id)}
                      onConvertMentionToLink={handleConvertMentionToLink}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-400 space-y-3">
              <p className="text-sm">No note selected</p>
              <button
                onClick={() => handleCreateNote()}
                className="px-4 py-2 bg-rose-600 text-white rounded text-xs font-medium"
              >
                Create your first note
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Hover preview popup card */}
      <HoverPreviewCard
        note={hoverNote}
        position={hoverPosition}
        targetTitle={hoverTargetTitle}
      />

      {/* Quick Switcher Modal (Ctrl+P / Ctrl+K) */}
      <QuickSwitcherModal
        isOpen={isQuickSwitcherOpen}
        onClose={() => setIsQuickSwitcherOpen(false)}
        notes={notes}
        onSelectNote={(id) => {
          setCurrentNoteId(id);
          if (viewMode === 'graph') setViewMode('split');
        }}
        onCreateNote={handleCreateNote}
      />

      {/* Debian Package Builder Modal */}
      <DebianExportModal
        isOpen={isDebianExportOpen}
        onClose={() => setIsDebianExportOpen(false)}
        notes={notes}
      />

      {/* Wiki Link Picker Modal */}
      <WikiLinkPickerModal
        isOpen={isWikiPickerOpen}
        onClose={() => setIsWikiPickerOpen(false)}
        notes={notes}
        currentNoteId={currentNoteId}
        onInsertLink={handleInsertWikiLink}
      />
    </div>
  );
}

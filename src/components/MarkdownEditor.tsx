import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Note } from '../types/note';
import { FileText, Plus } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  allNotes: Note[];
  currentNoteId: string;
  onNavigateToTitle: (title: string) => void;
  editorRef: React.RefObject<HTMLTextAreaElement | null>;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  allNotes,
  currentNoteId,
  onNavigateToTitle,
  editorRef,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [wikiSuggestOpen, setWikiSuggestOpen] = useState(false);
  const [wikiSuggestQuery, setWikiSuggestQuery] = useState('');
  const [wikiSuggestIndex, setWikiSuggestIndex] = useState(0);
  const [suggestPosition, setSuggestPosition] = useState<{ x: number; y: number }>({ x: 20, y: 50 });

  // Filter notes for [[ suggestion
  const suggestions = React.useMemo(() => {
    if (!wikiSuggestOpen) return [];
    const q = wikiSuggestQuery.toLowerCase().trim();
    return allNotes
      .filter((n) => n.id !== currentNoteId)
      .filter((n) => !q || n.title.toLowerCase().includes(q))
      .slice(0, 6);
  }, [allNotes, currentNoteId, wikiSuggestOpen, wikiSuggestQuery]);

  /**
   * Handle clipboard paste event for images
   */
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                const imgMarkdown = `\n![Pasted Image](${reader.result})\n`;
                insertAtCursor(imgMarkdown);
              }
            };
            reader.readAsDataURL(file);
          }
          return;
        }
      }
    },
    [editorRef]
  );

  /**
   * Handle drag & drop for images
   */
  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const name = file.name.replace(/\.[^/.]+$/, '');
            const imgMarkdown = `\n![${name}](${reader.result})\n`;
            insertAtCursor(imgMarkdown);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  /**
   * Helper to insert text at current cursor
   */
  const insertAtCursor = (textToInsert: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const prevVal = textarea.value;

    const newVal = prevVal.substring(0, start) + textToInsert + prevVal.substring(end);
    onChange(newVal);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + textToInsert.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  /**
   * Complete the [[ wiki link from suggestion
   */
  const completeWikiLink = (title: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBefore = value.slice(0, cursorPos);
    const doubleBracketIdx = textBefore.lastIndexOf('[[');

    if (doubleBracketIdx !== -1) {
      const beforeBracket = value.slice(0, doubleBracketIdx);
      const afterCursor = value.slice(cursorPos);
      const replacement = `[[${title}]] `;
      const updated = beforeBracket + replacement + afterCursor;
      onChange(updated);

      setWikiSuggestOpen(false);
      setWikiSuggestQuery('');

      setTimeout(() => {
        textarea.focus();
        const nextPos = doubleBracketIdx + replacement.length;
        textarea.setSelectionRange(nextPos, nextPos);
      }, 10);
    }
  };

  /**
   * Handle keyboard events (autocomplete navigation, tab indentation, shortcuts)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If wiki suggestions open
    if (wikiSuggestOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setWikiSuggestIndex((prev) => (prev + 1) % Math.max(1, suggestions.length));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setWikiSuggestIndex((prev) => (prev - 1 + Math.max(1, suggestions.length)) % Math.max(1, suggestions.length));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (suggestions.length > 0) {
          e.preventDefault();
          completeWikiLink(suggestions[wikiSuggestIndex].title);
          return;
        } else if (wikiSuggestQuery.trim()) {
          e.preventDefault();
          completeWikiLink(wikiSuggestQuery.trim());
          return;
        }
      }
      if (e.key === 'Escape') {
        setWikiSuggestOpen(false);
        return;
      }
    }

    // Tab key: indent 2 spaces
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      insertAtCursor('  ');
      return;
    }

    // Ctrl+Z / Ctrl+Y
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      if (e.shiftKey) {
        e.preventDefault();
        onRedo();
      } else {
        e.preventDefault();
        onUndo();
      }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      onRedo();
      return;
    }
  };

  /**
   * Track cursor and check if typing `[[`
   */
  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBefore = value.slice(0, cursorPos);
    const lastOpen = textBefore.lastIndexOf('[[');
    const lastClose = textBefore.lastIndexOf(']]');

    if (lastOpen !== -1 && lastOpen > lastClose && cursorPos - lastOpen <= 40) {
      const query = textBefore.slice(lastOpen + 2);
      setWikiSuggestQuery(query);
      setWikiSuggestOpen(true);
      setWikiSuggestIndex(0);

      // Estimate position from cursor
      const lines = textBefore.split('\n');
      const currentLineIdx = lines.length;
      const col = lines[lines.length - 1].length;
      setSuggestPosition({
        x: Math.min(window.innerWidth - 300, Math.max(20, col * 8 + 40)),
        y: Math.min(window.innerHeight - 250, currentLineIdx * 22 + 40),
      });
    } else {
      setWikiSuggestOpen(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-900">
      {/* Editor Textarea */}
      <div className="relative flex-1 w-full h-full">
        <textarea
          ref={editorRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          placeholder="Start typing your note with Markdown formatting...
Use [[Note Title]] to link notes together, or paste any image directly from your clipboard (Ctrl+V)!"
          className="w-full h-full p-6 bg-transparent text-neutral-100 font-mono text-sm leading-relaxed resize-none outline-hidden focus:ring-0 selection:bg-rose-500/30 overflow-y-auto"
          spellCheck="false"
        />

        {/* Drag over overlay */}
        {dragOver && (
          <div className="absolute inset-0 bg-rose-950/40 border-2 border-dashed border-rose-500 flex flex-col items-center justify-center pointer-events-none backdrop-blur-xs">
            <p className="text-sm font-semibold text-rose-300">Drop image here to insert into note</p>
            <p className="text-xs text-rose-400">Image will automatically adjust to fit note width</p>
          </div>
        )}

        {/* Autocomplete dropdown for [[ Note Links */}
        {wikiSuggestOpen && (
          <div
            style={{
              position: 'absolute',
              left: `${suggestPosition.x}px`,
              top: `${suggestPosition.y}px`,
            }}
            className="z-50 w-72 rounded-lg bg-neutral-900 border border-neutral-700 shadow-2xl py-1 animate-in fade-in zoom-in-95"
          >
            <div className="px-3 py-1.5 border-b border-neutral-800 text-[11px] font-medium text-neutral-400 flex items-center justify-between">
              <span>Link to Note ([[)</span>
              <span className="font-mono text-[10px] text-neutral-400">Enter to pick</span>
            </div>

            <div className="max-h-48 overflow-y-auto py-1">
              {suggestions.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => completeWikiLink(item.title)}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs transition-colors ${
                    idx === wikiSuggestIndex ? 'bg-rose-950/70 text-rose-200' : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="font-medium truncate">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 shrink-0">{item.folder}</span>
                </button>
              ))}

              {suggestions.length === 0 && wikiSuggestQuery.trim() && (
                <button
                  onClick={() => completeWikiLink(wikiSuggestQuery.trim())}
                  className="w-full text-left px-3 py-2 text-xs text-sky-400 hover:bg-neutral-800 flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create link to new note: "{wikiSuggestQuery.trim()}"</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Editor bottom status helper */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-neutral-950/60 border-t border-neutral-800 text-[11px] text-neutral-400 select-none">
        <div className="flex items-center gap-3">
          <span>Words: {value.trim().split(/\s+/).filter(Boolean).length}</span>
          <span aria-hidden="true">·</span>
          <span>Characters: {value.length}</span>
          <span aria-hidden="true">·</span>
          <span className="text-neutral-400">Ctrl+V paste image from clipboard</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Wiki link syntax: <code className="text-neutral-400 font-mono text-[10px]">[[Note Title]]</code></span>
        </div>
      </div>
    </div>
  );
};

import React, { useRef } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  CheckSquare,
  Undo2,
  Redo2,
  Link,
  Image as ImageIcon,
  Quote,
  Code,
  Minus,
  Type,
  ChevronDown,
} from 'lucide-react';

interface EditorToolbarProps {
  onInsertText: (prefix: string, suffix?: string, defaultText?: string) => void;
  onApplyHeading: (level: number | 'body' | 'small') => void;
  onInsertImage: (src: string, alt: string) => void;
  onOpenWikiLinkPicker: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onInsertText,
  onApplyHeading,
  onInsertImage,
  onOpenWikiLinkPicker,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHeadingMenu, setShowHeadingMenu] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onInsertImage(reader.result, file.name.replace(/\.[^/.]+$/, ''));
        }
      };
      reader.readAsDataURL(file);
    }
    // reset input
    e.target.value = '';
  };

  return (
    <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-neutral-300 select-none text-xs">
      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 border-r border-neutral-800 pr-1.5 mr-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`p-1.5 rounded transition-colors ${
            canUndo ? 'hover:bg-neutral-800 hover:text-neutral-100 text-neutral-300' : 'text-neutral-600 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
          className={`p-1.5 rounded transition-colors ${
            canRedo ? 'hover:bg-neutral-800 hover:text-neutral-100 text-neutral-300' : 'text-neutral-600 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Font Size & Headings Dropdown */}
      <div className="relative border-r border-neutral-800 pr-1.5 mr-1">
        <button
          type="button"
          onClick={() => setShowHeadingMenu(!showHeadingMenu)}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-800 hover:text-white transition-colors text-xs font-medium"
          title="Change Font Size / Heading"
        >
          <Type className="w-3.5 h-3.5 text-neutral-400" />
          <span>Size / Style</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {showHeadingMenu && (
          <div
            className="absolute left-0 top-full mt-1 w-44 rounded-md bg-neutral-900 border border-neutral-700 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95"
            onMouseLeave={() => setShowHeadingMenu(false)}
          >
            <button
              onClick={() => {
                onApplyHeading(1);
                setShowHeadingMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-sm font-bold text-neutral-100 flex items-center justify-between"
            >
              <span>Heading 1</span>
              <span className="font-mono text-[10px] text-neutral-500"># Title</span>
            </button>
            <button
              onClick={() => {
                onApplyHeading(2);
                setShowHeadingMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-sm font-semibold text-neutral-200 flex items-center justify-between"
            >
              <span>Heading 2</span>
              <span className="font-mono text-[10px] text-neutral-500">## Section</span>
            </button>
            <button
              onClick={() => {
                onApplyHeading(3);
                setShowHeadingMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-xs font-medium text-neutral-300 flex items-center justify-between"
            >
              <span>Heading 3</span>
              <span className="font-mono text-[10px] text-neutral-500">### Sub</span>
            </button>
            <button
              onClick={() => {
                onApplyHeading('body');
                setShowHeadingMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-xs text-neutral-300 flex items-center justify-between border-t border-neutral-800"
            >
              <span>Body Text</span>
              <span className="font-mono text-[10px] text-neutral-500">Normal</span>
            </button>
            <button
              onClick={() => {
                onApplyHeading('small');
                setShowHeadingMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between"
            >
              <span>Small Text</span>
              <span className="font-mono text-[10px] text-neutral-500">&lt;small&gt;</span>
            </button>
          </div>
        )}
      </div>

      {/* Style text: bold, italic, strikeout, highlight */}
      <div className="flex items-center gap-0.5 border-r border-neutral-800 pr-1.5 mr-1">
        <button
          type="button"
          onClick={() => onInsertText('**', '**', 'bold text')}
          className="p-1.5 rounded hover:bg-neutral-800 hover:text-white transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onInsertText('*', '*', 'italic text')}
          className="p-1.5 rounded hover:bg-neutral-800 hover:text-white transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onInsertText('~~', '~~', 'strikethrough text')}
          className="p-1.5 rounded hover:bg-neutral-800 hover:text-white transition-colors"
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onInsertText('==', '==', 'highlighted text')}
          className="p-1.5 rounded hover:bg-neutral-800 hover:text-amber-300 transition-colors"
          title="Highlight (==text==)"
        >
          <Highlighter className="w-4 h-4" />
        </button>
      </div>

      {/* Lists & Tasks */}
      <div className="flex items-center gap-0.5 border-r border-neutral-800 pr-1.5 mr-1">
        <button
          type="button"
          onClick={() => onInsertText('\n- ', '', 'List item')}
          className="p-1.5 rounded hover:bg-neutral-800 hover:text-white transition-colors"
          title="Bulleted List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onInsertText('\n1. ', '', 'Numbered item')}
          className="p-1.5 rounded hover:bg-neutral-800 hover:text-white transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onInsertText('\n- [ ] ', '', 'Task to complete')}
          className="p-1.5 rounded hover:bg-neutral-800 hover:text-rose-400 transition-colors"
          title="Checklist / Task List"
        >
          <CheckSquare className="w-4 h-4" />
        </button>
      </div>

      {/* Links & Wiki Link */}
      <div className="flex items-center gap-0.5 border-r border-neutral-800 pr-1.5 mr-1">
        <button
          type="button"
          onClick={onOpenWikiLinkPicker}
          className="px-2 py-1 rounded bg-sky-950/40 text-sky-400 hover:bg-sky-900/60 hover:text-sky-300 border border-sky-800/50 flex items-center gap-1 font-medium transition-colors"
          title="Link to Note ([[Wiki Link]])"
        >
          <Link className="w-3.5 h-3.5" />
          <span>Wiki Link</span>
        </button>
        <button
          type="button"
          onClick={() => onInsertText('[', '](https://)', 'Link description')}
          className="p-1.5 rounded hover:bg-neutral-800 hover:text-white transition-colors"
          title="Web Hyperlink"
        >
          <Link className="w-4 h-4 text-neutral-400" />
        </button>
      </div>

      {/* Integrated Image Support */}
      <div className="flex items-center gap-1 border-r border-neutral-800 pr-1.5 mr-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 hover:text-white flex items-center gap-1.5 text-xs transition-colors"
          title="Insert image from file (or paste directly from clipboard with Ctrl+V!)"
        >
          <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
          <span>Image</span>
        </button>
        <span className="text-[10px] text-neutral-400 hidden xl:inline">
          (or Ctrl+V clipboard)
        </span>
      </div>

      {/* Formatting extras: blockquote, code, divider */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onInsertText('\n> ', '', 'Quote text')}
          className="p-1.5 rounded hover:bg-neutral-800 hover:text-white transition-colors"
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onInsertText('`', '`', 'code')}
          className="p-1.5 rounded hover:bg-neutral-800 hover:text-white transition-colors font-mono"
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onInsertText('\n\n---\n\n', '')}
          className="p-1.5 rounded hover:bg-neutral-800 hover:text-white transition-colors"
          title="Horizontal Divider"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

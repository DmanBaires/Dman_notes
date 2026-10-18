import React, { useState } from 'react';
import { Note } from '../types/note';
import { ExternalLink, ZoomIn, CheckSquare, Square, Image as ImageIcon } from 'lucide-react';

interface MarkdownPreviewProps {
  content: string;
  allNotes: Note[];
  currentNoteId: string;
  onNavigateToTitle: (title: string) => void;
  onHoverLink: (title: string, pos: { x: number; y: number } | null) => void;
  onToggleCheckbox?: (lineIndex: number, currentChecked: boolean) => void;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  allNotes,
  currentNoteId,
  onNavigateToTitle,
  onHoverLink,
  onToggleCheckbox,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageSizes, setImageSizes] = useState<Record<string, string>>({});

  // Map of lowercase title to note
  const titleMap = React.useMemo(() => {
    const map = new Map<string, Note>();
    allNotes.forEach((n) => {
      map.set(n.title.trim().toLowerCase(), n);
    });
    return map;
  }, [allNotes]);

  // Titles for auto-linking, excluding current note's title to prevent self-looping
  const currentNote = allNotes.find((n) => n.id === currentNoteId);
  const candidateTitles = React.useMemo(() => {
    return allNotes
      .filter((n) => n.id !== currentNoteId && n.title.trim().length > 1)
      .map((n) => n.title.trim())
      .sort((a, b) => b.length - a.length); // longer matches first
  }, [allNotes, currentNoteId]);

  /**
   * Helper to parse a line of inline markdown and wiki links
   */
  const renderInlineFormatted = (text: string, keyPrefix: string): React.ReactNode[] => {
    // We parse in stages:
    // 1. Explicit [[Title|Label]] or [[Title]]
    // 2. Images ![alt](url)
    // 3. Markdown links [text](url)
    // 4. Automatic title matching (words matching candidateTitles)
    // 5. Bold, italic, strike, highlight, inline code

    // Tokenize wiki links [[...]] first
    const tokens: Array<{ type: 'text' | 'wikilink' | 'image' | 'link'; value: string; raw: string; meta?: any }> = [];
    
    // Combined regex for explicit items
    const combinedRegex = /(!\[(.*?)\]\((.*?)\))|(\[\[(.*?)\]\])|(\[(.*?)\]\((.*?)\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = combinedRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({
          type: 'text',
          value: text.slice(lastIndex, match.index),
          raw: text.slice(lastIndex, match.index),
        });
      }

      if (match[1]) {
        // Image ![alt](url)
        tokens.push({
          type: 'image',
          value: match[3],
          raw: match[1],
          meta: { alt: match[2], src: match[3] },
        });
      } else if (match[4]) {
        // WikiLink [[title|label]]
        const inner = match[5];
        const [targetTitle, customLabel] = inner.split('|');
        tokens.push({
          type: 'wikilink',
          value: targetTitle.trim(),
          raw: match[4],
          meta: { customLabel: customLabel ? customLabel.trim() : targetTitle.trim() },
        });
      } else if (match[6]) {
        // Standard link [text](url)
        tokens.push({
          type: 'link',
          value: match[8],
          raw: match[6],
          meta: { text: match[7], href: match[8] },
        });
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      tokens.push({
        type: 'text',
        value: text.slice(lastIndex),
        raw: text.slice(lastIndex),
      });
    }

    // Now process tokens: for text tokens, scan for automatic title matches!
    const outputElements: React.ReactNode[] = [];

    tokens.forEach((token, tIdx) => {
      const tokenKey = `${keyPrefix}-tok-${tIdx}`;

      if (token.type === 'wikilink') {
        const titleLower = token.value.toLowerCase();
        const exists = titleMap.has(titleLower);
        outputElements.push(
          <span
            key={tokenKey}
            className={`cursor-pointer inline-flex items-center gap-0.5 px-1 py-0.5 rounded font-medium transition-colors ${
              exists
                ? 'text-sky-400 bg-sky-950/30 hover:bg-sky-900/50 hover:text-sky-300 border-b border-sky-500/50'
                : 'text-rose-400 bg-rose-950/30 hover:bg-rose-900/50 hover:text-rose-300 border-b border-dashed border-rose-500/60'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onNavigateToTitle(token.value);
            }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onHoverLink(token.value, { x: rect.left, y: rect.bottom });
            }}
            onMouseLeave={() => onHoverLink('', null)}
            title={exists ? `Jump to note: ${token.value}` : `Create note: ${token.value}`}
          >
            <span>{token.meta.customLabel || token.value}</span>
            <span className="text-[10px] opacity-60">↗</span>
          </span>
        );
      } else if (token.type === 'image') {
        const imgSrc = token.meta.src;
        const imgAlt = token.meta.alt || 'Note Image';
        const currentSize = imageSizes[imgSrc] || 'auto';

        const sizeStyles: Record<string, string> = {
          auto: 'max-w-full max-h-[460px] object-contain',
          '100%': 'w-full object-cover max-h-[500px]',
          '75%': 'w-3/4 object-contain max-h-[440px]',
          '50%': 'w-1/2 object-contain max-h-[380px]',
          '25%': 'w-1/4 object-contain max-h-[300px]',
        };

        outputElements.push(
          <div key={tokenKey} className="group my-4 relative rounded-lg border border-neutral-800 bg-neutral-950/40 p-2 overflow-hidden">
            <div className="flex items-center justify-between mb-2 text-xs text-neutral-400 border-b border-neutral-800/80 pb-1.5 px-1">
              <span className="flex items-center gap-1 truncate text-[11px] font-mono text-neutral-300">
                <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                <span className="truncate">{imgAlt}</span>
              </span>
              <div className="flex items-center gap-1 bg-neutral-900 rounded p-0.5 border border-neutral-800">
                {(['auto', '100%', '75%', '50%', '25%'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setImageSizes((prev) => ({ ...prev, [imgSrc]: sz }))}
                    className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                      currentSize === sz
                        ? 'bg-rose-600 text-white font-medium'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {sz.toUpperCase()}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedImage(imgSrc)}
                  title="Expand Full View"
                  className="px-1.5 py-0.5 text-[10px] text-neutral-400 hover:text-white rounded"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex justify-center items-center overflow-hidden">
              <img
                src={imgSrc}
                alt={imgAlt}
                className={`${sizeStyles[currentSize]} rounded transition-all duration-200 cursor-pointer shadow-md`}
                onClick={() => setSelectedImage(imgSrc)}
                loading="lazy"
              />
            </div>
          </div>
        );
      } else if (token.type === 'link') {
        outputElements.push(
          <a
            key={tokenKey}
            href={token.meta.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 underline decoration-sky-500/50 hover:text-sky-300 inline-flex items-center gap-0.5"
          >
            {token.meta.text}
            <ExternalLink className="w-3 h-3 inline opacity-70" />
          </a>
        );
      } else {
        // Text token: scan for automatic title matches!
        const textVal = token.value;
        const autoElements = processAutoLinksAndFormatting(textVal, tokenKey);
        outputElements.push(...autoElements);
      }
    });

    return outputElements;
  };

  /**
   * Scans plain text for automatic note title matches and basic Markdown styles (bold, italic, strike, highlight, inline code)
   */
  const processAutoLinksAndFormatting = (text: string, baseKey: string): React.ReactNode[] => {
    if (!text) return [];

    // If there are candidate titles, build regex matching any of them with whole word boundaries
    if (candidateTitles.length === 0) {
      return [formatTextStyles(text, `${baseKey}-fmt`)];
    }

    // Build regex of candidate titles: \b(Title 1|Title 2)\b
    const escapedTitles = candidateTitles.map((t) => escapeRegex(t)).join('|');
    const autoRegex = new RegExp(`\\b(${escapedTitles})\\b`, 'gi');

    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = autoRegex.exec(text)) !== null) {
      const matchStart = match.index;
      const matchedString = match[1];

      if (matchStart > lastIdx) {
        const sub = text.slice(lastIdx, matchStart);
        parts.push(formatTextStyles(sub, `${baseKey}-txt-${lastIdx}`));
      }

      const titleLower = matchedString.toLowerCase();
      const targetNote = titleMap.get(titleLower);
      const titleKey = `${baseKey}-auto-${matchStart}`;

      parts.push(
        <span
          key={titleKey}
          className="cursor-pointer inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-sky-300 bg-sky-950/40 hover:bg-sky-900/60 hover:text-sky-200 border-b border-sky-400/60 font-medium transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onNavigateToTitle(targetNote ? targetNote.title : matchedString);
          }}
          onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            onHoverLink(targetNote ? targetNote.title : matchedString, {
              x: rect.left,
              y: rect.bottom,
            });
          }}
          onMouseLeave={() => onHoverLink('', null)}
          title={`Auto-linked to note: "${targetNote ? targetNote.title : matchedString}"`}
        >
          <span>{matchedString}</span>
          <span className="text-[9px] text-sky-400 opacity-75">↗</span>
        </span>
      );

      lastIdx = matchStart + matchedString.length;
    }

    if (lastIdx < text.length) {
      parts.push(formatTextStyles(text.slice(lastIdx), `${baseKey}-txt-${lastIdx}`));
    }

    return parts;
  };

  /**
   * Formats basic markdown typography: bold, italic, strikethrough, highlight, inline code
   */
  const formatTextStyles = (str: string, key: string): React.ReactNode => {
    // Regex for bold (**text**), italic (*text*), strike (~~text~~), highlight (==text==), code (`text`)
    // We can do a quick tokenization
    const styleRegex = /(\*\*(.*?)\*\*)|(\*(.*?)\*)|(~~(.*?)~~)|(==(.*?)==)|(`(.*?)`)|(<mark>(.*?)<\/mark>)|(<small>(.*?)<\/small>)/g;
    const pieces: React.ReactNode[] = [];
    let lastIdx = 0;
    let m: RegExpExecArray | null;

    while ((m = styleRegex.exec(str)) !== null) {
      if (m.index > lastIdx) {
        pieces.push(str.slice(lastIdx, m.index));
      }

      if (m[1]) {
        // Bold
        pieces.push(<strong key={`${key}-b-${m.index}`} className="font-semibold text-neutral-100">{m[2]}</strong>);
      } else if (m[3]) {
        // Italic
        pieces.push(<em key={`${key}-i-${m.index}`} className="italic text-neutral-200">{m[4]}</em>);
      } else if (m[5]) {
        // Strike
        pieces.push(<del key={`${key}-s-${m.index}`} className="line-through text-neutral-400">{m[6]}</del>);
      } else if (m[7]) {
        // Highlight ==text==
        pieces.push(
          <mark key={`${key}-h-${m.index}`} className="bg-amber-500/25 text-amber-200 px-1 rounded">
            {m[8]}
          </mark>
        );
      } else if (m[9]) {
        // Inline code
        pieces.push(
          <code key={`${key}-c-${m.index}`} className="px-1.5 py-0.5 rounded bg-neutral-800 text-rose-300 font-mono text-[13px]">
            {m[10]}
          </code>
        );
      } else if (m[11]) {
        // <mark> tag
        pieces.push(
          <mark key={`${key}-m-${m.index}`} className="bg-amber-500/25 text-amber-200 px-1 rounded">
            {m[12]}
          </mark>
        );
      } else if (m[13]) {
        // <small> tag
        pieces.push(<small key={`${key}-sm-${m.index}`} className="text-xs text-neutral-400">{m[14]}</small>);
      }

      lastIdx = m.index + m[0].length;
    }

    if (lastIdx < str.length) {
      pieces.push(str.slice(lastIdx));
    }

    return <React.Fragment key={key}>{pieces}</React.Fragment>;
  };

  /**
   * Render line by line block structures: Headings, checklists, bullet lists, numbered lists, blockquotes, code blocks, dividers
   */
  const lines = content.split('\n');
  const renderedBlocks: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockBuffer: string[] = [];
  let codeBlockLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineKey = `line-${i}`;

    // Code block toggle ```
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        renderedBlocks.push(
          <div key={`codeblock-${i}`} className="my-3 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950">
            {codeBlockLang && (
              <div className="bg-neutral-900/90 px-3 py-1 text-[11px] font-mono text-neutral-400 border-b border-neutral-800">
                {codeBlockLang}
              </div>
            )}
            <pre className="p-3 text-xs font-mono overflow-x-auto text-neutral-200">
              <code>{codeBlockBuffer.join('\n')}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockBuffer = [];
        codeBlockLang = '';
      } else {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      continue;
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      renderedBlocks.push(<hr key={lineKey} className="my-6 border-neutral-800" />);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      renderedBlocks.push(
        <h1 key={lineKey} className="text-2xl sm:text-3xl font-bold font-display text-neutral-50 mt-6 mb-3 tracking-tight border-b border-neutral-800/80 pb-2">
          {renderInlineFormatted(line.slice(2), lineKey)}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      renderedBlocks.push(
        <h2 key={lineKey} className="text-xl sm:text-2xl font-semibold font-display text-neutral-100 mt-5 mb-2 tracking-tight">
          {renderInlineFormatted(line.slice(3), lineKey)}
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      renderedBlocks.push(
        <h3 key={lineKey} className="text-lg font-semibold font-display text-neutral-200 mt-4 mb-2">
          {renderInlineFormatted(line.slice(4), lineKey)}
        </h3>
      );
      continue;
    }
    if (line.startsWith('#### ')) {
      renderedBlocks.push(
        <h4 key={lineKey} className="text-base font-medium font-display text-neutral-300 mt-3 mb-1">
          {renderInlineFormatted(line.slice(5), lineKey)}
        </h4>
      );
      continue;
    }

    // Checklists (- [ ] or - [x])
    const checklistMatch = /^[-*]\s+\[([ xX])\]\s+(.*)$/.exec(line.trim());
    if (checklistMatch) {
      const isChecked = checklistMatch[1].toLowerCase() === 'x';
      const taskText = checklistMatch[2];
      renderedBlocks.push(
        <div
          key={lineKey}
          className="flex items-start gap-2.5 my-1 text-sm text-neutral-300 group cursor-pointer"
          onClick={() => onToggleCheckbox?.(i, isChecked)}
        >
          <button
            type="button"
            className="mt-0.5 text-neutral-400 group-hover:text-rose-400 transition-colors shrink-0"
          >
            {isChecked ? (
              <CheckSquare className="w-4 h-4 text-rose-500 fill-rose-500/20" />
            ) : (
              <Square className="w-4 h-4 text-neutral-500" />
            )}
          </button>
          <span className={isChecked ? 'line-through text-neutral-500' : 'text-neutral-200'}>
            {renderInlineFormatted(taskText, lineKey)}
          </span>
        </div>
      );
      continue;
    }

    // Blockquotes (> )
    if (line.startsWith('> ')) {
      renderedBlocks.push(
        <blockquote key={lineKey} className="my-3 pl-4 border-l-2 border-rose-500/80 italic text-neutral-300 text-sm bg-neutral-900/30 py-1.5 rounded-r">
          {renderInlineFormatted(line.slice(2), lineKey)}
        </blockquote>
      );
      continue;
    }

    // Bullet Lists (- or *)
    const bulletMatch = /^[-*]\s+(.*)$/.exec(line.trim());
    if (bulletMatch) {
      renderedBlocks.push(
        <div key={lineKey} className="flex items-start gap-2 my-1 text-sm text-neutral-200 pl-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
          <span className="flex-1 leading-relaxed">{renderInlineFormatted(bulletMatch[1], lineKey)}</span>
        </div>
      );
      continue;
    }

    // Numbered lists (1. )
    const numMatch = /^(\d+)\.\s+(.*)$/.exec(line.trim());
    if (numMatch) {
      renderedBlocks.push(
        <div key={lineKey} className="flex items-start gap-2 my-1 text-sm text-neutral-200 pl-2">
          <span className="font-mono text-xs text-rose-400 font-semibold mt-0.5 shrink-0">
            {numMatch[1]}.
          </span>
          <span className="flex-1 leading-relaxed">{renderInlineFormatted(numMatch[2], lineKey)}</span>
        </div>
      );
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      renderedBlocks.push(<div key={lineKey} className="h-3" />);
      continue;
    }

    // Regular paragraph
    renderedBlocks.push(
      <p key={lineKey} className="my-1.5 text-sm leading-relaxed text-neutral-300">
        {renderInlineFormatted(line, lineKey)}
      </p>
    );
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto px-6 py-4 selection:bg-rose-500/30">
      {renderedBlocks}

      {/* Full-screen Image Zoom Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <img
              src={selectedImage}
              alt="Enlarged note asset"
              className="max-w-full max-h-[82vh] object-contain rounded-lg shadow-2xl border border-neutral-700"
            />
            <p className="mt-3 text-xs text-neutral-400 font-mono">
              Click anywhere to close full preview
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

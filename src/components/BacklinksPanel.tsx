import React, { useState } from 'react';
import { Note, BacklinkItem } from '../types/note';
import { extractBacklinks } from '../utils/wikiParser';
import { Link2, Sparkles, ChevronDown, ChevronRight, FileText, ArrowRight } from 'lucide-react';

interface BacklinksPanelProps {
  currentNote: Note;
  allNotes: Note[];
  onNavigateToNote: (noteId: string) => void;
  onConvertMentionToLink: (sourceNoteId: string, targetTitle: string) => void;
}

export const BacklinksPanel: React.FC<BacklinksPanelProps> = ({
  currentNote,
  allNotes,
  onNavigateToNote,
  onConvertMentionToLink,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'linked' | 'unlinked'>('all');

  const { linkedReferences, unlinkedMentions } = React.useMemo(() => {
    return extractBacklinks(currentNote, allNotes);
  }, [currentNote, allNotes]);

  const totalCount = linkedReferences.length + unlinkedMentions.length;

  if (totalCount === 0) {
    return (
      <div className="border-t border-neutral-800 bg-neutral-950/40 p-4 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-neutral-400" />
          <span>No backlinks or mentions for "{currentNote.title}" yet.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-neutral-800 bg-neutral-950/70 select-none">
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-6 py-2.5 cursor-pointer hover:bg-neutral-900/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          )}
          <span className="text-xs font-semibold text-neutral-200">
            Connections & Mentions ({totalCount})
          </span>
          <span className="text-[11px] text-neutral-400">
            {linkedReferences.length} linked · {unlinkedMentions.length} unlinked mentions
          </span>
        </div>

        {isExpanded && (
          <div
            className="flex items-center gap-1 p-0.5 bg-neutral-900 rounded border border-neutral-800 text-[11px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTab === 'all'
                  ? 'bg-neutral-800 text-neutral-100 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('linked')}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTab === 'linked'
                  ? 'bg-neutral-800 text-neutral-100 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Linked ({linkedReferences.length})
            </button>
            <button
              onClick={() => setActiveTab('unlinked')}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTab === 'unlinked'
                  ? 'bg-neutral-800 text-neutral-100 font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Unlinked ({unlinkedMentions.length})
            </button>
          </div>
        )}
      </div>

      {/* Content list */}
      {isExpanded && (
        <div className="px-6 pb-4 pt-1 space-y-3 max-h-72 overflow-y-auto">
          {/* Linked References Section */}
          {(activeTab === 'all' || activeTab === 'linked') && linkedReferences.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Linked References ({linkedReferences.length})</span>
              </div>
              <div className="space-y-1.5 pl-2">
                {linkedReferences.map((ref) => (
                  <div
                    key={`linked-${ref.sourceNoteId}`}
                    onClick={() => onNavigateToNote(ref.sourceNoteId)}
                    className="p-2 rounded bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800/60 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5 font-medium text-neutral-200 group-hover:text-sky-300">
                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                        <span>{ref.sourceNoteTitle}</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Open note</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 italic font-mono bg-neutral-950/40 p-1.5 rounded">
                      "...{ref.contextSnippet}..."
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unlinked Mentions Section */}
          {(activeTab === 'all' || activeTab === 'unlinked') && unlinkedMentions.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Unlinked Mentions ({unlinkedMentions.length})</span>
                <span className="text-[10px] text-neutral-400">
                  (Notes mentioning "{currentNote.title}" in body text)
                </span>
              </div>
              <div className="space-y-1.5 pl-2">
                {unlinkedMentions.map((mention) => (
                  <div
                    key={`unlinked-${mention.sourceNoteId}`}
                    className="p-2 rounded bg-neutral-900/60 border border-neutral-800/60 text-xs flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        onClick={() => onNavigateToNote(mention.sourceNoteId)}
                        className="flex items-center gap-1.5 font-medium text-neutral-200 hover:text-sky-300 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{mention.sourceNoteTitle}</span>
                      </div>

                      <button
                        onClick={() => onConvertMentionToLink(mention.sourceNoteId, currentNote.title)}
                        className="px-2 py-0.5 text-[10px] bg-rose-950/60 text-rose-300 hover:bg-rose-900/80 hover:text-rose-100 border border-rose-800/60 rounded flex items-center gap-1 font-medium transition-colors"
                        title={`Convert mentions of "${currentNote.title}" to formal [[${currentNote.title}]] wiki links in that note`}
                      >
                        <Link2 className="w-3 h-3" />
                        <span>Link [[{currentNote.title}]]</span>
                      </button>
                    </div>

                    <p
                      onClick={() => onNavigateToNote(mention.sourceNoteId)}
                      className="text-[11px] text-neutral-400 line-clamp-2 italic font-mono bg-neutral-950/40 p-1.5 rounded cursor-pointer hover:text-neutral-300"
                    >
                      "...{mention.contextSnippet}..."
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Star, 
  Copy, 
  Check, 
  Play, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Download, 
  Layers, 
  Clock, 
  Tag,
  Paperclip
} from 'lucide-react';
import { PromptItem, Project } from '../types';
import { getPromptStats } from '../utils/variableDetector';

interface PromptCardProps {
  prompt: PromptItem;
  project?: Project | null;
  onCopy: (prompt: PromptItem) => void;
  onOpenRunner: (prompt: PromptItem) => void;
  onEdit: (prompt: PromptItem) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onSelectTag?: (tag: string) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  project,
  onCopy,
  onOpenRunner,
  onEdit,
  onDelete,
  onToggleFavorite,
  onSelectTag,
}) => {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = (e: React.MouseEvent) => {
    e.stopPropagation();
    const element = document.createElement('a');
    const file = new Blob([prompt.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${prompt.title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.txt`;
    element.click();
    setMenuOpen(false);
  };

  const stats = getPromptStats(prompt.content);
  const hasVariables = prompt.variables && prompt.variables.length > 0;

  return (
    <div
      onClick={() => onOpenRunner(prompt)}
      className="group relative flex flex-col justify-between bg-white dark:bg-[#22211f] rounded-xl border border-[#e5e3da] dark:border-[#363430] hover:border-[#cc785c]/40 dark:hover:border-[#cc785c]/40 p-4 transition-all duration-200 cursor-pointer shadow-xs"
    >
      <div>
        {/* Top Metadata Row: Zero-Pill discipline */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs text-[#84817a] dark:text-[#78756e] truncate">
            {project && (
              <>
                <span className="font-medium text-[#cc785c] truncate max-w-[120px]">
                  {project.name}
                </span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span className="truncate">{prompt.category}</span>
            {prompt.targetModel && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[10px] text-[#57554f] dark:text-[#a8a49a]">
                  {prompt.targetModel}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Star Favorite */}
            <button
              onClick={() => onToggleFavorite(prompt.id)}
              className={`p-1.5 rounded-md transition-colors ${
                prompt.isFavorite
                  ? 'text-amber-500 fill-amber-500'
                  : 'text-[#84817a] hover:text-amber-500 hover:bg-[#faf9f5] dark:hover:bg-[#2a2926]'
              }`}
              title={prompt.isFavorite ? 'Hapus dari favorit' : 'Tandai favorit'}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  prompt.isFavorite ? 'fill-amber-500 text-amber-500' : ''
                }`}
              />
            </button>

            {/* Meatball Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-md text-[#84817a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6] hover:bg-[#faf9f5] dark:hover:bg-[#2a2926] transition-colors"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#22211f] border border-[#e5e3da] dark:border-[#363430] rounded-xl shadow-lg py-1 z-30 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(prompt);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[#57554f] dark:text-[#bab6ab] hover:bg-[#faf9f5] dark:hover:bg-[#2a2926]"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Prompt</span>
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[#57554f] dark:text-[#bab6ab] hover:bg-[#faf9f5] dark:hover:bg-[#2a2926]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh .txt</span>
                  </button>
                  {prompt.attachmentUrl && (
                    <a
                      href={prompt.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[#57554f] dark:text-[#bab6ab] hover:bg-[#faf9f5] dark:hover:bg-[#2a2926]"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-[#cc785c]" />
                      <span>Buka Lampiran</span>
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (window.confirm(`Hapus prompt "${prompt.title}"?`)) {
                        onDelete(prompt.id);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border-t border-[#e5e3da]/60 dark:border-[#363430]/60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-[#1f1e1d] dark:text-[#f0eee6] tracking-tight group-hover:text-[#cc785c] transition-colors mb-1">
          {prompt.title}
        </h3>

        {/* Optional Description */}
        {prompt.description && (
          <p className="text-xs text-[#57554f] dark:text-[#a8a49a] line-clamp-1 mb-2.5">
            {prompt.description}
          </p>
        )}

        {/* Prompt Content Preview Box */}
        <div className="bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da]/80 dark:border-[#33312c] rounded-lg p-2.5 my-2">
          <p className="font-mono text-[11px] leading-relaxed text-[#57554f] dark:text-[#a8a49a] line-clamp-3 whitespace-pre-wrap font-mono-code">
            {prompt.content}
          </p>
        </div>

        {/* Variable detection indicator & Tags & Attachments */}
        <div className="flex flex-wrap items-center gap-1.5 my-2 text-[11px]">
          {hasVariables && (
            <span className="text-[#cc785c] font-medium flex items-center gap-1">
              <span>{prompt.variables.length} variabel</span>
              <span className="text-[#84817a]">({prompt.variables.slice(0, 2).map(v => `{${v}}`).join(', ')}{prompt.variables.length > 2 ? '...' : ''})</span>
            </span>
          )}

          {prompt.attachmentName && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                if (prompt.attachmentUrl) {
                  window.open(prompt.attachmentUrl, '_blank');
                }
              }}
              className="flex items-center gap-1 text-[10px] text-[#cc785c] hover:underline cursor-pointer bg-[#faece7]/60 dark:bg-[#38251e]/50 px-1.5 py-0.5 rounded font-mono"
              title="Lampiran tersimpan di Supabase Storage (app-files)"
            >
              <Paperclip className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{prompt.attachmentName}</span>
            </div>
          )}

          {prompt.tags && prompt.tags.length > 0 && (
            <div className="flex items-center gap-1 text-[#84817a] dark:text-[#78756e]">
              {(hasVariables || prompt.attachmentName) && <span aria-hidden="true">·</span>}
              {prompt.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectTag) onSelectTag(tag);
                  }}
                  className="hover:text-[#cc785c] cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="pt-3 border-t border-[#e5e3da]/70 dark:border-[#33312c]/70 flex items-center justify-between gap-2 mt-2">
        <div className="text-[11px] text-[#84817a] dark:text-[#78756e] font-mono tabular-nums flex items-center gap-2">
          <span>~{stats.estimatedTokens} token</span>
          <span aria-hidden="true">·</span>
          <span>{prompt.copyCount}x dipakai</span>
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {hasVariables ? (
            <button
              onClick={() => onOpenRunner(prompt)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#cc785c] bg-[#faece7] dark:bg-[#38251e] hover:bg-[#f7ded5] dark:hover:bg-[#462d24] rounded-md transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Isi Variabel</span>
            </button>
          ) : null}

          <button
            onClick={handleCopyClick}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              copied
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-[#faf9f5] dark:bg-[#282622] hover:bg-[#eeebe3] dark:hover:bg-[#322f2b] text-[#1f1e1d] dark:text-[#f0eee6] border border-[#e5e3da] dark:border-[#363430]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-[#84817a]" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

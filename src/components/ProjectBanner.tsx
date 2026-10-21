import React, { useState } from 'react';
import { 
  Folder, 
  Pencil, 
  FileCode, 
  Copy, 
  Check, 
  Plus, 
  Upload, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Info,
  Trash2
} from 'lucide-react';
import { Project, PromptItem } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface ProjectBannerProps {
  project: Project;
  prompts: PromptItem[];
  onEditProject: () => void;
  onDeleteProject?: (projectId: string) => void;
  onNewPromptInProject: () => void;
  onUploadInProject: () => void;
  onCopyText: (text: string, label: string) => void;
}

export const ProjectBanner: React.FC<ProjectBannerProps> = ({
  project,
  prompts,
  onEditProject,
  onDeleteProject,
  onNewPromptInProject,
  onUploadInProject,
  onCopyText,
}) => {
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  const [copiedInstructions, setCopiedInstructions] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleCopyInstructions = () => {
    if (!project.customInstructions) return;
    onCopyText(project.customInstructions, 'Instruksi Proyek');
    setCopiedInstructions(true);
    setTimeout(() => setCopiedInstructions(false), 2000);
  };

  const totalCopies = prompts.reduce((sum, p) => sum + p.copyCount, 0);

  return (
    <div className="bg-[#f5f3ec]/60 dark:bg-[#1f1e1c]/60 border-b border-[#e5e3da] dark:border-[#33312c] px-6 py-5">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Project Cover Image (from private Supabase Storage via signed URL) */}
        {project.coverUrl && (
          <div className="w-full h-32 rounded-xl overflow-hidden border border-[#e5e3da] dark:border-[#363430] shadow-xs">
            <img
              src={project.coverUrl}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Project Header Title & Description */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: project.color || '#cc785c' }}
              />
              <h1 className="font-serif-claude text-2xl font-bold tracking-tight text-[#1f1e1d] dark:text-[#f0eee6]">
                {project.name}
              </h1>
            </div>
            <p className="text-sm text-[#57554f] dark:text-[#a8a49a] max-w-2xl leading-relaxed">
              {project.description || 'Tidak ada deskripsi untuk proyek ini.'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onEditProject}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-[#282622] hover:bg-[#faf9f5] dark:hover:bg-[#322f2b] border border-[#e5e3da] dark:border-[#363430] text-[#57554f] dark:text-[#bab6ab] rounded-lg transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Proyek</span>
            </button>
            <button
              onClick={onUploadInProject}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-[#282622] hover:bg-[#faf9f5] dark:hover:bg-[#322f2b] border border-[#e5e3da] dark:border-[#363430] text-[#57554f] dark:text-[#bab6ab] rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#cc785c]" />
              <span>Upload ke Proyek</span>
            </button>
            <button
              onClick={onNewPromptInProject}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#cc785c] hover:bg-[#b5674c] text-white rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Prompt</span>
            </button>
            {onDeleteProject && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-[#282622] hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-[#e5e3da] dark:border-[#363430] hover:border-rose-200 dark:hover:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg transition-colors cursor-pointer"
                title="Hapus Proyek Ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            )}
          </div>
        </div>

        {/* Project Metrics metadata: clean unboxed text */}
        <div className="flex items-center gap-3 text-xs text-[#84817a] dark:text-[#78756e]">
          <span>
            <strong className="font-semibold text-[#1f1e1d] dark:text-[#f0eee6] font-mono tabular-nums">
              {prompts.length}
            </strong>{' '}
            Prompt tersimpan
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong className="font-semibold text-[#1f1e1d] dark:text-[#f0eee6] font-mono tabular-nums">
              {totalCopies}
            </strong>{' '}
            Total penggunaan
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Dibuat{' '}
            {new Date(project.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Claude-style Project Custom Instructions (System Prompt Context) */}
        {project.customInstructions && (
          <div className="bg-white/80 dark:bg-[#22211f]/80 rounded-xl border border-[#e5e3da] dark:border-[#363430] overflow-hidden text-xs transition-all">
            <div
              onClick={() => setInstructionsExpanded(!instructionsExpanded)}
              className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition-colors"
            >
              <div className="flex items-center gap-2 text-[#57554f] dark:text-[#bab6ab] font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#cc785c]" />
                <span>Instruksi Khusus Proyek (Claude Project Instructions)</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyInstructions();
                  }}
                  className="flex items-center gap-1 text-[#84817a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6] transition-colors"
                  title="Salin instruksi proyek"
                >
                  {copiedInstructions ? (
                    <Check className="w-3.5 h-3.5 text-[#cc785c]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[11px]">{copiedInstructions ? 'Tersalin' : 'Salin Instruksi'}</span>
                </button>
                {instructionsExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                )}
              </div>
            </div>

            {instructionsExpanded && (
              <div className="px-4 py-3 border-t border-[#e5e3da]/70 dark:border-[#363430]/70 bg-[#faf9f5]/50 dark:bg-[#1a1917]/50">
                <pre className="font-mono text-[11px] leading-relaxed text-[#302f2c] dark:text-[#d4cfc5] whitespace-pre-wrap font-mono-code">
                  {project.customInstructions}
                </pre>
                <div className="mt-2 text-[10px] text-[#84817a] flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>Instruksi ini dapat disalin bersama prompt saat dijalankan di Claude AI.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Hapus Proyek"
        itemName={project.name}
        description="Prompt di dalam proyek ini tidak akan dihapus, melainkan dipindahkan ke kategori 'Tanpa Proyek'. Sampul proyek (jika ada) akan dihapus dari Supabase Storage."
        confirmLabel="Hapus Proyek"
        onConfirm={() => {
          if (onDeleteProject) {
            onDeleteProject(project.id);
          }
        }}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};

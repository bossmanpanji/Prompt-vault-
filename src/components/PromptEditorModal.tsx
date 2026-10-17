import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Plus, 
  Tag as TagIcon, 
  Layers, 
  Sliders, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { PromptItem, Project, PromptCategory } from '../types';
import { extractVariables, getPromptStats } from '../utils/variableDetector';

interface PromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (promptData: Partial<PromptItem>) => void;
  promptToEdit?: PromptItem | null;
  projects: Project[];
  defaultProjectId?: string | null;
}

const CATEGORIES: PromptCategory[] = [
  'Coding & Tech',
  'Copywriting & Konten',
  'Bisnis & Strategi',
  'Riset & Analisis',
  'Kreatif',
  'Produktivitas',
  'System Prompt',
];

const TARGET_MODELS = [
  'Claude 3.7 Sonnet',
  'Claude 3.5 Sonnet',
  'Claude 3.5 Haiku',
  'Claude 3 Opus',
  'GPT-4o',
  'Gemini 2.5 Pro',
  'General / Universal',
];

export const PromptEditorModal: React.FC<PromptEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  promptToEdit,
  projects,
  defaultProjectId,
}) => {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [category, setCategory] = useState<PromptCategory>('Coding & Tech');
  const [targetModel, setTargetModel] = useState('Claude 3.7 Sonnet');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [versionNote, setVersionNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (promptToEdit) {
      setTitle(promptToEdit.title);
      setProjectId(promptToEdit.projectId || null);
      setCategory(promptToEdit.category);
      setTargetModel(promptToEdit.targetModel || 'Claude 3.7 Sonnet');
      setDescription(promptToEdit.description || '');
      setContent(promptToEdit.content);
      setTags(promptToEdit.tags || []);
      setTagInput('');
      setVersionNote('');
    } else {
      setTitle('');
      setProjectId(defaultProjectId || null);
      setCategory('Coding & Tech');
      setTargetModel('Claude 3.7 Sonnet');
      setDescription('');
      setContent('');
      setTags([]);
      setTagInput('');
      setVersionNote('');
    }
    setError('');
  }, [promptToEdit, defaultProjectId, isOpen]);

  if (!isOpen) return null;

  // Auto-detect variables live
  const detectedVariables = extractVariables(content);
  const stats = getPromptStats(content);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase().replace(/^[#,\s]+|[#,\s]+$/g, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul prompt wajib diisi.');
      return;
    }
    if (!content.trim()) {
      setError('Isi prompt tidak boleh kosong.');
      return;
    }

    onSave({
      title: title.trim(),
      projectId: projectId || null,
      category,
      targetModel,
      description: description.trim(),
      content: content.trim(),
      variables: detectedVariables,
      tags,
      ...(versionNote && promptToEdit ? {
        versions: [
          ...(promptToEdit.versions || []),
          {
            timestamp: new Date().toISOString(),
            content: content.trim(),
            note: versionNote.trim(),
          }
        ]
      } : {})
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-[#22211f] border border-[#e5e3da] dark:border-[#363430] w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e3da] dark:border-[#33312c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#faece7] dark:bg-[#38251e] flex items-center justify-center text-[#cc785c]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif-claude text-lg font-bold text-[#1f1e1d] dark:text-[#f0eee6]">
                {promptToEdit ? 'Edit Prompt' : 'Buat Prompt Baru'}
              </h2>
              <p className="text-xs text-[#84817a] dark:text-[#78756e]">
                Simpan dan gunakan kembali prompt favoritmu dengan parameter fleksibel.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#84817a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6] p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#1f1e1d] dark:text-[#f0eee6]">
              Judul Prompt <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Senior Code Reviewer & Security Audit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#363430] rounded-xl text-[#1f1e1d] dark:text-[#f0eee6] placeholder-[#84817a] focus:outline-none focus:border-[#cc785c] transition-colors"
              required
            />
          </div>

          {/* Project & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Project Selection */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1f1e1d] dark:text-[#f0eee6]">
                Proyek
              </label>
              <select
                value={projectId || ''}
                onChange={(e) => setProjectId(e.target.value || null)}
                className="w-full px-3 py-2 text-xs bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#363430] rounded-xl text-[#1f1e1d] dark:text-[#f0eee6] focus:outline-none focus:border-[#cc785c] cursor-pointer"
              >
                <option value="">Tanpa Proyek</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selection */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1f1e1d] dark:text-[#f0eee6]">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PromptCategory)}
                className="w-full px-3 py-2 text-xs bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#363430] rounded-xl text-[#1f1e1d] dark:text-[#f0eee6] focus:outline-none focus:border-[#cc785c] cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Model */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1f1e1d] dark:text-[#f0eee6]">
                Target Model AI
              </label>
              <select
                value={targetModel}
                onChange={(e) => setTargetModel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#363430] rounded-xl text-[#1f1e1d] dark:text-[#f0eee6] focus:outline-none focus:border-[#cc785c] cursor-pointer font-mono"
              >
                {TARGET_MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#1f1e1d] dark:text-[#f0eee6]">
              Deskripsi Singkat (Opsional)
            </label>
            <input
              type="text"
              placeholder="Jelaskan tujuan atau konteks prompt ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-1.5 text-xs bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#363430] rounded-xl text-[#1f1e1d] dark:text-[#f0eee6] placeholder-[#84817a] focus:outline-none focus:border-[#cc785c] transition-colors"
            />
          </div>

          {/* Prompt Content */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#1f1e1d] dark:text-[#f0eee6]">
                Isi Prompt <span className="text-red-500">*</span>
              </label>
              <span className="font-mono text-[10px] text-[#84817a] dark:text-[#78756e] tabular-nums">
                {stats.words} kata · {stats.characters} karakter · ~{stats.estimatedTokens} token
              </span>
            </div>

            <textarea
              rows={9}
              placeholder={`Ketik atau paste prompt di sini...\nTips: Gunakan {{nama_variabel}} atau {variabel} untuk membuat bagian yang bisa diisi dinamis saat dipakai ulang.`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 font-mono text-xs leading-relaxed bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#363430] rounded-xl text-[#1f1e1d] dark:text-[#f0eee6] placeholder-[#84817a] focus:outline-none focus:border-[#cc785c] transition-colors font-mono-code resize-y"
              required
            />

            {/* Variable detection pill-free alert */}
            {detectedVariables.length > 0 ? (
              <div className="p-2.5 bg-[#faece7]/50 dark:bg-[#38251e]/40 border border-[#cc785c]/30 rounded-lg text-xs text-[#cc785c] flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold">Variabel terdeteksi ({detectedVariables.length}):</span>
                  {detectedVariables.map((v) => (
                    <span key={v} className="font-mono text-[11px] bg-white/70 dark:bg-black/30 px-1.5 py-0.5 rounded">
                      {`{${v}}`}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[#84817a] dark:text-[#78756e]">
                Belum ada variabel. Tambahkan <code className="font-mono text-[#cc785c]">{'{{topik}}'}</code> atau <code className="font-mono text-[#cc785c]">{'{target}'}</code> untuk templating otomatis.
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1f1e1d] dark:text-[#f0eee6]">
              Label / Tag
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <TagIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#84817a]" />
                <input
                  type="text"
                  placeholder="Ketik tag lalu tekan Enter (misal: react, copywriting, audit)..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#363430] rounded-xl text-[#1f1e1d] dark:text-[#f0eee6] placeholder-[#84817a] focus:outline-none focus:border-[#cc785c] transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#1f1e1d] dark:text-[#f0eee6] rounded-xl transition-colors cursor-pointer"
              >
                Tambah
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 text-xs bg-[#faf9f5] dark:bg-[#252421] border border-[#e5e3da] dark:border-[#363430] px-2 py-0.5 rounded-md text-[#57554f] dark:text-[#a8a49a]"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-neutral-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Optional version note if editing */}
          {promptToEdit && (
            <div className="space-y-1 pt-2 border-t border-[#e5e3da]/70 dark:border-[#33312c]/70">
              <label className="block text-xs font-semibold text-[#1f1e1d] dark:text-[#f0eee6]">
                Catatan Revisi / Versi Baru (Opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Ditambahkan instruksi edge-cases dan format output"
                value={versionNote}
                onChange={(e) => setVersionNote(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#363430] rounded-xl text-[#1f1e1d] dark:text-[#f0eee6] placeholder-[#84817a] focus:outline-none focus:border-[#cc785c] transition-colors"
              />
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e3da] dark:border-[#33312c] bg-white dark:bg-[#22211f] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#57554f] dark:text-[#bab6ab] hover:bg-[#faf9f5] dark:hover:bg-[#2a2926] rounded-xl border border-[#e5e3da] dark:border-[#363430] transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-medium bg-[#cc785c] hover:bg-[#b5674c] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {promptToEdit ? 'Simpan Perubahan' : 'Buat Prompt'}
          </button>
        </div>
      </div>
    </div>
  );
};

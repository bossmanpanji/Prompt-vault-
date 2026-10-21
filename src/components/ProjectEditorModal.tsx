import React, { useState, useEffect, useRef } from 'react';
import { X, FolderPlus, Sparkles, AlertCircle, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { Project } from '../types';
import { 
  uploadFileToStorage, 
  deleteFileFromStorage 
} from '../services/storageService';

interface ProjectEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Partial<Project>) => void;
  projectToEdit?: Project | null;
  userId?: string;
}

const COLOR_PALETTE = [
  '#cc785c', // Claude terracotta
  '#d97706', // warm amber
  '#059669', // emerald
  '#2563eb', // royal blue
  '#7c3aed', // violet
  '#db2777', // rose
  '#475569', // slate
];

export const ProjectEditorModal: React.FC<ProjectEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projectToEdit,
  userId,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [color, setColor] = useState('#cc785c');
  const [coverPath, setCoverPath] = useState<string | undefined>(undefined);
  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [error, setError] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setDescription(projectToEdit.description || '');
      setCustomInstructions(projectToEdit.customInstructions || '');
      setColor(projectToEdit.color || '#cc785c');
      setCoverPath(projectToEdit.coverPath);
      setCoverUrl(projectToEdit.coverUrl);
    } else {
      setName('');
      setDescription('');
      setCustomInstructions('');
      setColor('#cc785c');
      setCoverPath(undefined);
      setCoverUrl(undefined);
    }
    setError('');
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!userId) {
      const localUrl = URL.createObjectURL(file);
      setCoverUrl(localUrl);
      return;
    }

    setIsUploadingCover(true);
    try {
      const itemId = projectToEdit?.id || ('proj-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 6));
      const res = await uploadFileToStorage(file, {
        userId,
        featureName: 'projects',
        itemId,
        filename: file.name,
      });
      setCoverPath(res.filePath);
      setCoverUrl(res.signedUrl || undefined);
    } catch (err: any) {
      setError('Gagal mengunggah cover proyek: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleDeleteCover = async () => {
    if (coverPath) {
      await deleteFileFromStorage(coverPath);
    }
    setCoverPath(undefined);
    setCoverUrl(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama proyek wajib diisi.');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      customInstructions: customInstructions.trim(),
      color,
      coverPath,
      coverUrl,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-[#22211f] border border-[#e5e3da] dark:border-[#363430] w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e3da] dark:border-[#33312c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif-claude text-lg font-bold text-[#1f1e1d] dark:text-[#f0eee6]">
                {projectToEdit ? 'Edit Proyek' : 'Buat Proyek Baru'}
              </h2>
              <p className="text-xs text-[#84817a] dark:text-[#78756e]">
                Kelola kumpulan prompt spesifik dalam ruang kerja terdedikasi.
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Project Name */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#1f1e1d] dark:text-[#f0eee6]">
              Nama Proyek <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Otomasi Bisnis & Riset Pasar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#363430] rounded-xl text-[#1f1e1d] dark:text-[#f0eee6] placeholder-[#84817a] focus:outline-none focus:border-[#cc785c] transition-colors"
              required
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1f1e1d] dark:text-[#f0eee6]">
              Warna Proyek
            </label>
            <div className="flex items-center gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-[#cc785c]' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#1f1e1d] dark:text-[#f0eee6]">
              Deskripsi Proyek
            </label>
            <textarea
              rows={2}
              placeholder="Jelaskan ringkasan tujuan dan jenis prompt di dalam proyek ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-xs bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#363430] rounded-xl text-[#1f1e1d] dark:text-[#f0eee6] placeholder-[#84817a] focus:outline-none focus:border-[#cc785c] resize-none"
            />
          </div>

          {/* Cover Image Upload (Supabase Storage: app-files) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1f1e1d] dark:text-[#f0eee6] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#cc785c]" />
                <span>Gambar Sampul / Cover Proyek (Opsional)</span>
              </label>
              <span className="text-[10px] text-[#84817a]">Supabase Storage</span>
            </div>

            <input
              type="file"
              ref={coverInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleCoverSelect}
            />

            {coverUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-[#e5e3da] dark:border-[#363430] group">
                <img
                  src={coverUrl}
                  alt="Cover proyek"
                  className="w-full h-24 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="p-1.5 bg-white/90 dark:bg-black/80 rounded-lg text-xs font-medium text-[#1f1e1d] dark:text-[#f0eee6] hover:bg-white flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ganti</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCover}
                    className="p-1.5 bg-white/90 dark:bg-black/80 rounded-lg text-xs font-medium text-red-600 hover:bg-white flex items-center gap-1 cursor-pointer"
                    title="Hapus Cover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={isUploadingCover}
                onClick={() => coverInputRef.current?.click()}
                className="w-full py-3 px-3 border border-dashed border-[#e5e3da] dark:border-[#363430] hover:border-[#cc785c]/60 rounded-xl text-xs text-[#57554f] dark:text-[#bab6ab] hover:text-[#cc785c] bg-[#faf9f5] dark:bg-[#1c1b19] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ImageIcon className="w-4 h-4" />
                <span>{isUploadingCover ? 'Mengunggah cover ke Storage...' : 'Upload gambar sampul proyek'}</span>
              </button>
            )}
          </div>

          {/* Project Custom Instructions (Claude AI Project Instructions) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#1f1e1d] dark:text-[#f0eee6]">
                Instruksi Khusus Proyek (Opsional)
              </label>
              <span className="text-[10px] text-[#cc785c] font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Claude Project Instructions
              </span>
            </div>
            <textarea
              rows={4}
              placeholder={`Instruksi default yang melandasi semua prompt dalam proyek ini.\nContoh: "Kamu adalah Senior Engineer. Selalu berikan kode TypeScript modern, sertakan unit test, dan jelaskan asumsi arsitektur."`}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="w-full p-3 font-mono text-xs leading-relaxed bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#363430] rounded-xl text-[#1f1e1d] dark:text-[#f0eee6] placeholder-[#84817a] focus:outline-none focus:border-[#cc785c] font-mono-code resize-y"
            />
            <p className="text-[11px] text-[#84817a] dark:text-[#78756e]">
              Instruksi ini dapat otomatis digabungkan sebagai konteks saat Anda menjalankan prompt dari proyek ini.
            </p>
          </div>
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
            {projectToEdit ? 'Simpan Perubahan' : 'Buat Proyek'}
          </button>
        </div>
      </div>
    </div>
  );
};

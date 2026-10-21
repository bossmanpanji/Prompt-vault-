import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  itemName: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title = 'Hapus Proyek',
  itemName,
  description = 'Prompt di dalam proyek ini tidak akan dihapus, melainkan dipindahkan ke kategori "Tanpa Proyek". Sampul proyek (jika ada) akan dihapus dari penyimpanan.',
  confirmLabel = 'Hapus Proyek',
  onConfirm,
  onClose,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#22211f] border border-[#e5e3da] dark:border-[#363430] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="text-[#84817a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6] p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="font-serif-claude text-lg font-bold text-[#1f1e1d] dark:text-[#f0eee6]">
            {title}
          </h3>
          <p className="text-xs text-[#57554f] dark:text-[#a8a49a] mt-1.5 leading-relaxed">
            Apakah Anda yakin ingin menghapus proyek <strong className="text-[#1f1e1d] dark:text-[#f0eee6] font-semibold">"{itemName}"</strong>?
          </p>
          <div className="mt-3 p-3 rounded-xl bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#363430] text-[11px] text-[#84817a] dark:text-[#8c8980] flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <span>{description}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#57554f] dark:text-[#bab6ab] hover:bg-[#faf9f5] dark:hover:bg-[#2a2926] rounded-xl border border-[#e5e3da] dark:border-[#363430] transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

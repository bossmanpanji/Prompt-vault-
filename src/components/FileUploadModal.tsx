import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Clipboard, 
  CheckCircle2, 
  Folder, 
  Sparkles, 
  AlertCircle,
  FileCode
} from 'lucide-react';
import { Project, PromptCategory, PromptItem } from '../types';
import { parseTextFileContent } from '../utils/storage';
import { extractVariables, getPromptStats } from '../utils/variableDetector';
import { uploadFileToStorage } from '../services/storageService';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePrompt: (promptData: Partial<PromptItem>) => void | Promise<void>;
  onBatchSavePrompts: (promptsData: Partial<PromptItem>[]) => void | Promise<void>;
  projects: Project[];
  activeProjectId?: string | null;
  userId?: string;
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

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onSavePrompt,
  onBatchSavePrompts,
  projects,
  activeProjectId,
  userId,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [targetProjectId, setTargetProjectId] = useState<string | null>(activeProjectId || null);
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory>('Coding & Tech');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // File Upload State
  interface ParsedFile {
    file?: File;
    filename: string;
    title: string;
    description: string;
    content: string;
    variables: string[];
  }
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paste Directly State
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  // Sync targetProjectId whenever activeProjectId changes or modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setTargetProjectId(activeProjectId || null);
    }
  }, [isOpen, activeProjectId]);

  if (!isOpen) return null;

  // Handle files dropped or selected
  const handleFileProcess = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFileError('');

    const results: ParsedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Accept .txt, .md, .markdown, .json
      if (!file.name.match(/\.(txt|md|markdown|json|text)$/i)) {
        continue;
      }

      try {
        const text = await file.text();
        if (file.name.endsWith('.json')) {
          // If JSON, try to parse
          try {
            const parsedJson = JSON.parse(text);
            if (Array.isArray(parsedJson)) {
              // Batch prompt JSON
              parsedJson.forEach((item) => {
                if (item.title && item.content) {
                  results.push({
                    file,
                    filename: file.name,
                    title: item.title,
                    description: item.description || '',
                    content: item.content,
                    variables: item.variables || extractVariables(item.content),
                  });
                }
              });
              continue;
            } else if (parsedJson.title && parsedJson.content) {
              results.push({
                file,
                filename: file.name,
                title: parsedJson.title,
                description: parsedJson.description || '',
                content: parsedJson.content,
                variables: parsedJson.variables || extractVariables(parsedJson.content),
              });
              continue;
            }
          } catch {
            // Treat as raw text if JSON parse fails
          }
        }

        // Standard text/markdown file
        const parsed = parseTextFileContent(file.name, text);
        results.push({
          file,
          filename: file.name,
          title: parsed.title,
          description: parsed.description,
          content: parsed.content,
          variables: parsed.variables,
        });
      } catch (err) {
        console.error('Error reading file', err);
      }
    }

    if (results.length === 0) {
      setFileError('Harap pilih file teks (.txt, .md, atau .json) yang valid.');
    } else {
      setParsedFiles(results);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileProcess(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Submit Uploaded Files to Supabase Storage & Database
  const handleSaveUploadedFiles = async () => {
    if (parsedFiles.length === 0) return;
    setIsUploading(true);

    try {
      if (parsedFiles.length === 1) {
        const f = parsedFiles[0];
        let attachmentPath: string | undefined;
        let attachmentName: string | undefined;
        let attachmentSize: number | undefined;
        let attachmentType: string | undefined;
        let attachmentUrl: string | undefined;

        if (userId && f.file) {
          try {
            const itemId = 'prompt-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 6);
            const uploadRes = await uploadFileToStorage(f.file, {
              userId,
              featureName: 'prompts',
              itemId,
              filename: f.filename,
            });
            attachmentPath = uploadRes.filePath;
            attachmentName = uploadRes.originalName;
            attachmentSize = uploadRes.size;
            attachmentType = uploadRes.type;
            attachmentUrl = uploadRes.signedUrl || undefined;
          } catch (uploadErr) {
            console.warn('Storage upload warning, proceeding with prompt content:', uploadErr);
          }
        }

        if (!attachmentName) {
          attachmentName = f.filename;
          attachmentSize = f.file?.size;
          attachmentType = f.file?.type || 'text/plain';
        }

        await onSavePrompt({
          title: f.title,
          description: f.description,
          content: f.content,
          variables: f.variables,
          projectId: targetProjectId,
          category: selectedCategory,
          tags: ['uploaded', f.filename.split('.').pop() || 'txt'],
          attachmentPath,
          attachmentName,
          attachmentSize,
          attachmentType,
          attachmentUrl,
        });
      } else {
        const batch: Partial<PromptItem>[] = [];
        for (let i = 0; i < parsedFiles.length; i++) {
          const f = parsedFiles[i];
          let attachmentPath: string | undefined;
          let attachmentName: string | undefined;
          let attachmentSize: number | undefined;
          let attachmentType: string | undefined;
          let attachmentUrl: string | undefined;

          if (userId && f.file) {
            try {
              const itemId = `prompt-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
              const uploadRes = await uploadFileToStorage(f.file, {
                userId,
                featureName: 'prompts',
                itemId,
                filename: f.filename,
              });
              attachmentPath = uploadRes.filePath;
              attachmentName = uploadRes.originalName;
              attachmentSize = uploadRes.size;
              attachmentType = uploadRes.type;
              attachmentUrl = uploadRes.signedUrl || undefined;
            } catch (uploadErr) {
              console.warn('Batch storage upload warning:', uploadErr);
            }
          }

          if (!attachmentName) {
            attachmentName = f.filename;
            attachmentSize = f.file?.size;
            attachmentType = f.file?.type || 'text/plain';
          }

          batch.push({
            title: f.title,
            description: f.description,
            content: f.content,
            variables: f.variables,
            projectId: targetProjectId,
            category: selectedCategory,
            tags: ['batch-import'],
            attachmentPath,
            attachmentName,
            attachmentSize,
            attachmentType,
            attachmentUrl,
          });
        }
        await onBatchSavePrompts(batch);
      }

      onClose();
    } catch (err: any) {
      setFileError('Gagal mengunggah file: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Pasted Prompt
  const handleSavePastedPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteContent.trim()) {
      setPasteError('Silakan tempel teks prompt.');
      return;
    }

    const autoTitle = pasteTitle.trim() || 
      pasteContent.trim().split('\n')[0].replace(/^[#>\s]+/, '').slice(0, 50) || 
      'Prompt Tanpa Judul';

    const detected = extractVariables(pasteContent);

    onSavePrompt({
      title: autoTitle,
      description: pasteDescription.trim(),
      content: pasteContent.trim(),
      variables: detected,
      projectId: targetProjectId,
      category: selectedCategory,
      tags: ['quick-paste'],
    });

    onClose();
  };

  const pasteStats = getPromptStats(pasteContent);
  const pasteVariables = extractVariables(pasteContent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-[#22211f] border border-[#e5e3da] dark:border-[#363430] w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e3da] dark:border-[#33312c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#faece7] dark:bg-[#38251e] flex items-center justify-center text-[#cc785c]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif-claude text-lg font-bold text-[#1f1e1d] dark:text-[#f0eee6]">
                Tambah Prompt
              </h2>
              <p className="text-xs text-[#84817a] dark:text-[#78756e]">
                Upload file teks (.txt, .md, .json) atau tempel langsung ke aplikasi.
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

        {/* Segmented Control: Upload File vs Copy-Paste */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center p-1 bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#363430] rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-[#282622] text-[#1f1e1d] dark:text-[#f0eee6] shadow-xs font-semibold'
                  : 'text-[#84817a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#cc785c]" />
              <span>Upload File Teks (.txt / .md)</span>
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-white dark:bg-[#282622] text-[#1f1e1d] dark:text-[#f0eee6] shadow-xs font-semibold'
                  : 'text-[#84817a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6]'
              }`}
            >
              <Clipboard className="w-3.5 h-3.5 text-[#cc785c]" />
              <span>Copy-Paste Langsung</span>
            </button>
          </div>
        </div>

        {/* Shared Target Project & Category Row */}
        <div className="px-6 py-2 grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-[#84817a] dark:text-[#78756e] mb-1">
              Simpan ke Proyek
            </label>
            <select
              value={targetProjectId || ''}
              onChange={(e) => setTargetProjectId(e.target.value || null)}
              className="w-full px-3 py-1.5 bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#363430] rounded-lg text-[#1f1e1d] dark:text-[#f0eee6] focus:outline-none focus:border-[#cc785c] cursor-pointer"
            >
              <option value="">Tanpa Proyek</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {targetProjectId && (
              <p className="text-[10px] text-[#cc785c] mt-1 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>File akan tersimpan & tetap muncul di dalam proyek ini</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#84817a] dark:text-[#78756e] mb-1">
              Kategori Prompt
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as PromptCategory)}
              className="w-full px-3 py-1.5 bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#363430] rounded-lg text-[#1f1e1d] dark:text-[#f0eee6] focus:outline-none focus:border-[#cc785c] cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === 'upload' && (
          <div className="flex-1 overflow-y-auto px-6 py-3 space-y-4">
            {fileError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {/* Dropzone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-[#cc785c] bg-[#faece7]/40 dark:bg-[#38251e]/30'
                  : 'border-[#e5e3da] dark:border-[#363430] hover:border-[#cc785c]/60 bg-[#faf9f5] dark:bg-[#1c1b19]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md,.markdown,.json"
                className="hidden"
                onChange={(e) => handleFileProcess(e.target.files)}
              />
              <div className="w-10 h-10 rounded-full bg-[#faece7] dark:bg-[#38251e] text-[#cc785c] mx-auto flex items-center justify-center mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-[#1f1e1d] dark:text-[#f0eee6]">
                Tarik & lepas file teks di sini, atau <span className="text-[#cc785c] underline">pilih file</span>
              </p>
              <p className="text-[11px] text-[#84817a] mt-1">
                Mendukung .txt, .md (Markdown), dan .json. Judul dan variabel otomatis diekstrak.
              </p>
            </div>

            {/* Parsed File Preview List */}
            {parsedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#84817a] dark:text-[#78756e]">
                  <span className="font-semibold text-[#1f1e1d] dark:text-[#f0eee6]">
                    File Siap Diimport ({parsedFiles.length})
                  </span>
                  <button
                    onClick={() => setParsedFiles([])}
                    className="text-red-500 hover:underline text-[11px]"
                  >
                    Hapus Semua
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {parsedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#363430] rounded-xl flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-3.5 h-3.5 text-[#cc785c] shrink-0" />
                          <span className="font-semibold text-[#1f1e1d] dark:text-[#f0eee6] truncate">
                            {file.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#57554f] dark:text-[#a8a49a] line-clamp-2 font-mono font-mono-code">
                          {file.content}
                        </p>
                        {file.variables.length > 0 && (
                          <div className="text-[10px] text-[#cc785c]">
                            {file.variables.length} variabel: {file.variables.map(v => `{${v}}`).join(', ')}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setParsedFiles(parsedFiles.filter((_, i) => i !== idx))}
                        className="text-[#84817a] hover:text-red-500 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Copy-Paste Directly */}
        {activeTab === 'paste' && (
          <form onSubmit={handleSavePastedPrompt} className="flex-1 overflow-y-auto px-6 py-3 space-y-3">
            {pasteError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pasteError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1f1e1d] dark:text-[#f0eee6]">
                Judul Prompt (Opsional, otomatis dideteksi dari baris pertama jika kosong)
              </label>
              <input
                type="text"
                placeholder="Misal: Generator Ide Konten Viral"
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#363430] rounded-xl text-[#1f1e1d] dark:text-[#f0eee6] placeholder-[#84817a] focus:outline-none focus:border-[#cc785c]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#1f1e1d] dark:text-[#f0eee6]">
                  Paste Teks Prompt <span className="text-red-500">*</span>
                </label>
                <span className="font-mono text-[10px] text-[#84817a] tabular-nums">
                  {pasteStats.words} kata · {pasteStats.characters} kar · ~{pasteStats.estimatedTokens} token
                </span>
              </div>
              <textarea
                rows={7}
                placeholder="Tempel teks prompt Anda di sini secara langsung..."
                value={pasteContent}
                onChange={(e) => {
                  setPasteContent(e.target.value);
                  setPasteError('');
                }}
                className="w-full p-3 font-mono text-xs leading-relaxed bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#363430] rounded-xl text-[#1f1e1d] dark:text-[#f0eee6] placeholder-[#84817a] focus:outline-none focus:border-[#cc785c] font-mono-code resize-y"
                required
              />

              {pasteVariables.length > 0 && (
                <div className="p-2 bg-[#faece7]/50 dark:bg-[#38251e]/40 border border-[#cc785c]/30 rounded-lg text-xs text-[#cc785c] flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold">Otomatis mendeteksi variabel:</span>
                  {pasteVariables.map((v) => (
                    <span key={v} className="font-mono text-[10px] bg-white/70 dark:bg-black/30 px-1 py-0.5 rounded">
                      {`{${v}}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </form>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#e5e3da] dark:border-[#33312c] bg-white dark:bg-[#22211f] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#57554f] dark:text-[#bab6ab] hover:bg-[#faf9f5] dark:hover:bg-[#2a2926] rounded-xl border border-[#e5e3da] dark:border-[#363430] transition-colors cursor-pointer"
          >
            Batal
          </button>

          {activeTab === 'upload' ? (
            <button
              type="button"
              disabled={parsedFiles.length === 0 || isUploading}
              onClick={handleSaveUploadedFiles}
              className="px-5 py-2 text-xs font-medium bg-[#cc785c] hover:bg-[#b5674c] disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isUploading ? `Mengunggah (${parsedFiles.length})...` : `Simpan File (${parsedFiles.length})`}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSavePastedPrompt}
              className="px-5 py-2 text-xs font-medium bg-[#cc785c] hover:bg-[#b5674c] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Simpan Prompt
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

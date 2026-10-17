import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Sparkles, 
  Layers, 
  RotateCcw, 
  ExternalLink,
  Code2,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { PromptItem, Project } from '../types';
import { replaceVariables, getPromptStats } from '../utils/variableDetector';

interface PromptRunnerModalProps {
  prompt: PromptItem | null;
  project?: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onCopySuccess: (text: string, label: string) => void;
  onEditPrompt: (prompt: PromptItem) => void;
}

export const PromptRunnerModal: React.FC<PromptRunnerModalProps> = ({
  prompt,
  project,
  isOpen,
  onClose,
  onCopySuccess,
  onEditPrompt,
}) => {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [includeProjectInstructions, setIncludeProjectInstructions] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize variable inputs whenever prompt changes
  useEffect(() => {
    if (prompt) {
      const initial: Record<string, string> = {};
      prompt.variables.forEach((v) => {
        initial[v] = '';
      });
      setVariableValues(initial);
      setIncludeProjectInstructions(false);
    }
  }, [prompt]);

  if (!isOpen || !prompt) return null;

  const handleInputChange = (variable: string, value: string) => {
    setVariableValues((prev) => ({
      ...prev,
      [variable]: value,
    }));
  };

  const handleResetVariables = () => {
    const cleared: Record<string, string> = {};
    prompt.variables.forEach((v) => {
      cleared[v] = '';
    });
    setVariableValues(cleared);
  };

  // Compute rendered final text
  const renderedContent = replaceVariables(prompt.content, variableValues);

  // If project instructions are included
  const finalOutput = includeProjectInstructions && project?.customInstructions
    ? `[System / Project Instructions]\n${project.customInstructions}\n\n[Prompt]\n${renderedContent}`
    : renderedContent;

  const stats = getPromptStats(finalOutput);

  const handleCopy = () => {
    navigator.clipboard.writeText(finalOutput);
    setCopied(true);
    onCopySuccess(finalOutput, prompt.title);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasVariables = prompt.variables && prompt.variables.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-[#22211f] border border-[#e5e3da] dark:border-[#363430] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#e5e3da] dark:border-[#33312c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#faece7] dark:bg-[#38251e] flex items-center justify-center text-[#cc785c]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif-claude text-lg font-bold text-[#1f1e1d] dark:text-[#f0eee6]">
                {prompt.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#84817a] dark:text-[#78756e]">
                {project && (
                  <>
                    <span className="text-[#cc785c] font-medium">{project.name}</span>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                <span>{prompt.category}</span>
                {prompt.targetModel && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[10px]">{prompt.targetModel}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEditPrompt(prompt);
              }}
              className="text-xs text-[#57554f] dark:text-[#a8a49a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6] px-2.5 py-1.5 rounded-lg border border-[#e5e3da] dark:border-[#363430] hover:bg-[#faf9f5] dark:hover:bg-[#2a2926] transition-colors"
            >
              Edit Prompt
            </button>
            <button
              onClick={onClose}
              className="text-[#84817a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6] p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split view if variables exist, single view if not */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Variables Fill-in Section */}
          {hasVariables ? (
            <div className="bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#33312c] rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1f1e1d] dark:text-[#f0eee6]">
                  <Sliders className="w-4 h-4 text-[#cc785c]" />
                  <span>Isi Parameter Variabel ({prompt.variables.length})</span>
                </div>
                <button
                  onClick={handleResetVariables}
                  className="flex items-center gap-1 text-[11px] text-[#84817a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6] transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Isian</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {prompt.variables.map((variable) => (
                  <div key={variable} className="space-y-1">
                    <label className="block text-[11px] font-mono text-[#57554f] dark:text-[#bab6ab] truncate">
                      {`{{${variable}}}`}
                    </label>
                    <input
                      type="text"
                      placeholder={`Masukkan nilai untuk ${variable}...`}
                      value={variableValues[variable] || ''}
                      onChange={(e) => handleInputChange(variable, e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#252421] border border-[#e5e3da] dark:border-[#363430] rounded-lg text-[#1f1e1d] dark:text-[#f0eee6] placeholder-[#84817a]/70 focus:outline-none focus:border-[#cc785c] transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Optional Project Instructions Checkbox */}
          {project?.customInstructions && (
            <div className="flex items-center gap-2.5 px-3 py-2 bg-[#faf9f5] dark:bg-[#1c1b19] border border-[#e5e3da] dark:border-[#33312c] rounded-xl text-xs">
              <input
                type="checkbox"
                id="includeInstructions"
                checked={includeProjectInstructions}
                onChange={(e) => setIncludeProjectInstructions(e.target.checked)}
                className="w-4 h-4 accent-[#cc785c] rounded cursor-pointer"
              />
              <label htmlFor="includeInstructions" className="text-[#57554f] dark:text-[#bab6ab] cursor-pointer">
                Sertakan <strong>Instruksi Proyek ({project.name})</strong> di bagian atas prompt
              </label>
            </div>
          )}

          {/* Live Rendered Output Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#84817a] dark:text-[#78756e]">
              <div className="flex items-center gap-1.5 font-medium text-[#1f1e1d] dark:text-[#f0eee6]">
                <Code2 className="w-3.5 h-3.5 text-[#cc785c]" />
                <span>Hasil Prompt yang Siap Digunakan</span>
              </div>
              <div className="font-mono text-[11px] tabular-nums">
                {stats.words} kata · {stats.characters} karakter · ~{stats.estimatedTokens} token
              </div>
            </div>

            <div className="relative rounded-xl border border-[#e5e3da] dark:border-[#363430] bg-[#faf9f5] dark:bg-[#181716] p-4">
              <pre className="font-mono text-xs leading-relaxed text-[#1f1e1d] dark:text-[#f0eee6] whitespace-pre-wrap font-mono-code max-h-80 overflow-y-auto">
                {finalOutput}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer: 1-click Copy */}
        <div className="px-6 py-4 border-t border-[#e5e3da] dark:border-[#33312c] bg-white dark:bg-[#22211f] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#84817a] dark:text-[#78756e]">
            {copied ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Prompt berhasil disalin ke clipboard! Siap di-paste ke Claude / AI pilihanmu.
              </span>
            ) : (
              <span>Klik tombol di kanan untuk menyalin langsung.</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium text-[#57554f] dark:text-[#bab6ab] hover:bg-[#faf9f5] dark:hover:bg-[#2a2926] rounded-xl border border-[#e5e3da] dark:border-[#363430] transition-colors cursor-pointer"
            >
              Tutup
            </button>

            <button
              onClick={handleCopy}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer shadow-xs ${
                copied
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-[#cc785c] hover:bg-[#b5674c] text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Prompt Jadi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

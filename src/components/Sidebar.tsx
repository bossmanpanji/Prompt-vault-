import React, { useState } from 'react';
import { 
  FolderPlus, 
  Plus, 
  Sparkles, 
  Star, 
  Tag, 
  Moon, 
  Sun, 
  Upload, 
  Download, 
  FileText, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Layers,
  ChevronDown,
  ChevronRight,
  Database,
  X,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { Project, PromptItem, ViewFilter, UserProfile } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface SidebarProps {
  projects: Project[];
  prompts: PromptItem[];
  activeProjectId: string | null;
  activeView: ViewFilter;
  selectedTag: string | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsedDesktop?: boolean;
  onSelectProject: (id: string | null) => void;
  onSelectView: (view: ViewFilter) => void;
  onSelectTag: (tag: string | null) => void;
  onNewPrompt: () => void;
  onNewProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onOpenUploadModal: () => void;
  onExportBackup: () => void;
  onExportMarkdown: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  user?: UserProfile | null;
  onOpenLogin?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  prompts,
  activeProjectId,
  activeView,
  selectedTag,
  isOpenMobile,
  onCloseMobile,
  isCollapsedDesktop = false,
  onSelectProject,
  onSelectView,
  onSelectTag,
  onNewPrompt,
  onNewProject,
  onEditProject,
  onDeleteProject,
  onOpenUploadModal,
  onExportBackup,
  onExportMarkdown,
  isDarkMode,
  onToggleDarkMode,
  user,
  onOpenLogin,
  onLogout,
}) => {
  const [projectMenuOpen, setProjectMenuOpen] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [tagsCollapsed, setTagsCollapsed] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Helper to close mobile sidebar on navigation
  const handleMobileNav = (callback: () => void) => {
    callback();
    if (window.innerWidth < 768) {
      onCloseMobile();
    }
  };

  // Compute counts
  const totalPrompts = prompts.length;
  const favoriteCount = prompts.filter((p) => p.isFavorite).length;
  const unassignedCount = prompts.filter((p) => !p.projectId).length;

  // Project prompt counts
  const projectPromptCounts = projects.reduce<Record<string, number>>((acc, proj) => {
    acc[proj.id] = prompts.filter((p) => p.projectId === proj.id).length;
    return acc;
  }, {});

  // Compute top tags
  const tagCounts = prompts.reduce<Record<string, number>>((acc, p) => {
    p.tags?.forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <>
      {/* Mobile Drawer Backdrop Scrim */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 flex-shrink-0 flex flex-col h-screen bg-[#f5f3ec] dark:bg-[#1a1917] border-r border-[#e5e3da] dark:border-[#33312c] select-none transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        } ${isCollapsedDesktop ? 'md:hidden' : 'md:flex'}`}
      >
        {/* Brand & App Title */}
        <div className="p-4 border-b border-[#e5e3da]/70 dark:border-[#33312c]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Claude-style warm terracotta emblem */}
              <div className="w-7 h-7 rounded-lg bg-[#cc785c] text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 fill-white" />
              </div>
              <div>
                <span className="font-serif-claude text-base font-semibold tracking-tight text-[#1f1e1d] dark:text-[#f0eee6]">
                  PromptVault
                </span>
                <span className="text-[11px] text-[#84817a] dark:text-[#78756e] block leading-none mt-0.5">
                  Claude Prompt Manager
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onToggleDarkMode}
                title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                className="p-1.5 rounded-lg text-[#84817a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6] hover:bg-[#eae7dd] dark:hover:bg-[#262421] transition-colors cursor-pointer"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Mobile Close Button */}
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded-lg text-[#84817a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6] hover:bg-[#eae7dd] dark:hover:bg-[#262421] transition-colors cursor-pointer"
                title="Tutup menu sidebar"
                aria-label="Tutup sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Create Prompt Primary Action */}
          <button
            onClick={() => handleMobileNav(onNewPrompt)}
            className="mt-4 w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#cc785c] hover:bg-[#b5674c] text-white font-medium text-xs tracking-tight shadow-xs transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
              <span>Prompt Baru</span>
            </div>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
              ⌘N
            </span>
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {/* Main Views */}
          <div className="space-y-0.5 text-xs font-medium">
            <button
              onClick={() =>
                handleMobileNav(() => {
                  onSelectProject(null);
                  onSelectView('all');
                  onSelectTag(null);
                })
              }
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeProjectId === null && activeView === 'all' && selectedTag === null
                  ? 'bg-[#eae7de] dark:bg-[#282622] text-[#1f1e1d] dark:text-[#f0eee6] font-semibold'
                  : 'text-[#57554f] dark:text-[#a8a49a] hover:bg-[#eeebe3] dark:hover:bg-[#22201d]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#cc785c]" />
                <span>Semua Prompt</span>
              </div>
              <span className="font-mono text-[11px] text-[#84817a] tabular-nums">
                {totalPrompts}
              </span>
            </button>

            <button
              onClick={() =>
                handleMobileNav(() => {
                  onSelectProject(null);
                  onSelectView('favorites');
                  onSelectTag(null);
                })
              }
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeProjectId === null && activeView === 'favorites'
                  ? 'bg-[#eae7de] dark:bg-[#282622] text-[#1f1e1d] dark:text-[#f0eee6] font-semibold'
                  : 'text-[#57554f] dark:text-[#a8a49a] hover:bg-[#eeebe3] dark:hover:bg-[#22201d]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-600 dark:text-amber-500 fill-amber-500/20" />
                <span>Prompt Favorit</span>
              </div>
              <span className="font-mono text-[11px] text-[#84817a] tabular-nums">
                {favoriteCount}
              </span>
            </button>

            <button
              onClick={() =>
                handleMobileNav(() => {
                  onSelectProject(null);
                  onSelectView('no-project');
                  onSelectTag(null);
                })
              }
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeProjectId === null && activeView === 'no-project'
                  ? 'bg-[#eae7de] dark:bg-[#282622] text-[#1f1e1d] dark:text-[#f0eee6] font-semibold'
                  : 'text-[#57554f] dark:text-[#a8a49a] hover:bg-[#eeebe3] dark:hover:bg-[#22201d]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-neutral-400" />
                <span>Tanpa Proyek</span>
              </div>
              <span className="font-mono text-[11px] text-[#84817a] tabular-nums">
                {unassignedCount}
              </span>
            </button>
          </div>

          {/* Projects Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-1.5">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#84817a] dark:text-[#78756e]">
                Proyek
              </span>
              <button
                onClick={() => handleMobileNav(onNewProject)}
                title="Buat Proyek Baru"
                className="p-1 rounded text-[#84817a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6] hover:bg-[#eae7dd] dark:hover:bg-[#262421] transition-colors cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {projects.map((proj) => {
                const isActive = activeProjectId === proj.id;
                const count = projectPromptCounts[proj.id] || 0;

                return (
                  <div key={proj.id} className="relative group">
                    <button
                      onClick={() =>
                        handleMobileNav(() => {
                          onSelectProject(proj.id);
                          onSelectTag(null);
                        })
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#eae7de] dark:bg-[#282622] text-[#1f1e1d] dark:text-[#f0eee6] font-semibold'
                          : 'text-[#57554f] dark:text-[#a8a49a] hover:bg-[#eeebe3] dark:hover:bg-[#22201d]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: proj.color || '#cc785c' }}
                        />
                        <span className="truncate">{proj.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="font-mono text-[11px] text-[#84817a] tabular-nums">
                          {count}
                        </span>
                      </div>
                    </button>

                  {/* Project Context Menu button on hover */}
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectMenuOpen(projectMenuOpen === proj.id ? null : proj.id);
                      }}
                      className="p-1 rounded text-[#84817a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6] hover:bg-black/5 dark:hover:bg-white/10"
                      title="Menu Proyek"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>

                    {projectMenuOpen === proj.id && (
                      <div
                        className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-[#22211f] border border-[#e5e3da] dark:border-[#363430] rounded-lg shadow-lg py-1 z-30 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setProjectMenuOpen(null);
                            onEditProject(proj);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[#57554f] dark:text-[#bab6ab] hover:bg-[#faf9f5] dark:hover:bg-[#2a2926] cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit Proyek</span>
                        </button>
                        <button
                          onClick={() => {
                            setProjectMenuOpen(null);
                            setProjectToDelete(proj);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus Proyek</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {projects.length === 0 && (
              <p className="px-3 py-2 text-[11px] text-[#84817a] italic">
                Belum ada proyek. Klik + untuk membuat.
              </p>
            )}
          </div>
        </div>

        {/* Tags Section */}
        {sortedTags.length > 0 && (
          <div>
            <button
              onClick={() => setTagsCollapsed(!tagsCollapsed)}
              className="w-full flex items-center justify-between px-3 mb-1.5 text-[11px] font-semibold tracking-wider uppercase text-[#84817a] dark:text-[#78756e]"
            >
              <span>Label / Tag</span>
              {tagsCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {!tagsCollapsed && (
              <div className="space-y-0.5">
                {sortedTags.map(([tag, count]) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => handleMobileNav(() => onSelectTag(isSelected ? null : tag))}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#eae7de] dark:bg-[#282622] text-[#cc785c] font-semibold'
                          : 'text-[#57554f] dark:text-[#a8a49a] hover:bg-[#eeebe3] dark:hover:bg-[#22201d]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Tag className="w-3 h-3 opacity-60 shrink-0" />
                        <span className="truncate">#{tag}</span>
                      </div>
                      <span className="font-mono text-[10px] text-[#84817a] tabular-nums">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Footer Actions */}
      <div className="p-3 border-t border-[#e5e3da]/70 dark:border-[#33312c] space-y-1 relative">
        <button
          onClick={() => handleMobileNav(onOpenUploadModal)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#57554f] dark:text-[#a8a49a] hover:bg-[#eae7de] dark:hover:bg-[#282622] transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-[#cc785c]" />
          <span>Upload File Teks / Paste</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#57554f] dark:text-[#a8a49a] hover:bg-[#eae7de] dark:hover:bg-[#282622] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Database className="w-3.5 h-3.5 text-neutral-400" />
              <span>Ekspor & Cadangan</span>
            </div>
            <Download className="w-3 h-3 text-[#84817a]" />
          </button>

          {exportMenuOpen && (
            <div className="absolute bottom-full mb-1 left-0 right-0 bg-white dark:bg-[#22211f] border border-[#e5e3da] dark:border-[#363430] rounded-xl shadow-xl py-1 z-40 text-xs">
              <button
                onClick={() => {
                  setExportMenuOpen(false);
                  onExportBackup();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[#1f1e1d] dark:text-[#f0eee6] hover:bg-[#faf9f5] dark:hover:bg-[#2a2926]"
              >
                <Download className="w-3.5 h-3.5 text-[#cc785c]" />
                <div>
                  <div className="font-medium">Cadangan JSON</div>
                  <div className="text-[10px] text-[#84817a]">Simpan semua proyek & prompt</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setExportMenuOpen(false);
                  onExportMarkdown();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[#1f1e1d] dark:text-[#f0eee6] hover:bg-[#faf9f5] dark:hover:bg-[#2a2926] border-t border-[#e5e3da]/60 dark:border-[#363430]/60"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <div>
                  <div className="font-medium">Ekspor Markdown (.md)</div>
                  <div className="text-[10px] text-[#84817a]">Dokumen rapi siap baca</div>
                </div>
              </button>
            </div>
          )}
        </div>
        {/* User Account / Login Section */}
        <div className="pt-1 border-t border-[#e5e3da]/60 dark:border-[#33312c]">
          {user ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#22211f] border border-[#e5e3da] dark:border-[#363430]">
              <div className="flex items-center gap-2 min-w-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-[#cc785c]/40"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#faece7] dark:bg-[#38251e] text-[#cc785c] dark:text-[#e58767] text-xs font-bold flex items-center justify-center shrink-0">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#1f1e1d] dark:text-[#f0eee6] truncate">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-[#84817a] truncate">
                    {user.email}
                  </div>
                </div>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Keluar dari akun"
                  className="p-1.5 rounded-lg text-[#84817a] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  aria-label="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            onOpenLogin && (
              <button
                type="button"
                onClick={() => handleMobileNav(onOpenLogin)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#cc785c] dark:text-[#e58767] bg-[#faece7]/80 hover:bg-[#faece7] dark:bg-[#38251e]/60 dark:hover:bg-[#38251e] border border-[#cc785c]/35 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk ke Akun</span>
              </button>
            )
          )}
        </div>
      </div>
    </aside>

    {projectToDelete && (
      <ConfirmDeleteModal
        isOpen={!!projectToDelete}
        title="Hapus Proyek"
        itemName={projectToDelete.name}
        description="Prompt di dalam proyek ini tidak akan dihapus, melainkan dipindahkan ke kategori 'Tanpa Proyek'. Sampul proyek (jika ada) akan dihapus dari Supabase Storage."
        confirmLabel="Hapus Proyek"
        onConfirm={() => {
          if (projectToDelete) {
            onDeleteProject(projectToDelete.id);
            setProjectToDelete(null);
          }
        }}
        onClose={() => setProjectToDelete(null)}
      />
    )}
  </>
  );
};

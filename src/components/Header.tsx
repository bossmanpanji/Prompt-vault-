import React, { useRef, useEffect } from 'react';
import { 
  Search, 
  X, 
  Upload, 
  Plus, 
  ArrowUpDown, 
  Folder, 
  Layers, 
  Star, 
  FileText,
  SlidersHorizontal,
  Menu,
  LogIn,
  ChevronDown,
  User as UserIcon
} from 'lucide-react';
import { Project, PromptCategory, ViewFilter, UserProfile } from '../types';
import { UserMenuPopup } from './UserMenuPopup';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  sortBy: 'updatedAt' | 'copyCount' | 'title' | 'createdAt';
  onSortByChange: (sort: 'updatedAt' | 'copyCount' | 'title' | 'createdAt') => void;
  activeProject: Project | null;
  activeView: ViewFilter;
  selectedTag: string | null;
  onClearTag: () => void;
  onNewPrompt: () => void;
  onOpenUpload: () => void;
  onToggleSidebar: () => void;
  user: UserProfile | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onExportData: () => void;
  totalPrompts: number;
  totalProjects: number;
}

const CATEGORIES: PromptCategory[] = [
  'Semua',
  'Coding & Tech',
  'Copywriting & Konten',
  'Bisnis & Strategi',
  'Riset & Analisis',
  'Kreatif',
  'Produktivitas',
  'System Prompt',
];

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortByChange,
  activeProject,
  activeView,
  selectedTag,
  onClearTag,
  onNewPrompt,
  onOpenUpload,
  onToggleSidebar,
  user,
  onOpenLogin,
  onLogout,
  onExportData,
  totalPrompts,
  totalProjects,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener for search focus ('/' or 'Cmd+K')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.metaKey && e.key === 'k') || (e.ctrlKey && e.key === 'k')) && 
          document.activeElement !== searchInputRef.current && 
          !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Determine breadcrumb title
  const getBreadcrumbTitle = () => {
    if (activeProject) return activeProject.name;
    if (activeView === 'favorites') return 'Prompt Favorit';
    if (activeView === 'no-project') return 'Tanpa Proyek';
    return 'Semua Prompt';
  };

  const getBreadcrumbIcon = () => {
    if (activeProject) return <Folder className="w-3.5 h-3.5 text-[#cc785c]" />;
    if (activeView === 'favorites') return <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />;
    if (activeView === 'no-project') return <FileText className="w-3.5 h-3.5 text-neutral-400" />;
    return <Layers className="w-3.5 h-3.5 text-[#cc785c]" />;
  };

  return (
    <header className="border-b border-[#e5e3da] dark:border-[#33312c] bg-[#faf9f5]/80 dark:bg-[#181716]/80 backdrop-blur-md sticky top-0 z-20 px-4 md:px-6 py-3.5 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Hamburger Toggle & Breadcrumbs */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 -ml-1 rounded-lg text-[#57554f] dark:text-[#a8a49a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6] hover:bg-[#eae7dd] dark:hover:bg-[#282622] transition-colors cursor-pointer shrink-0"
            title="Buka / Tutup Menu Sidebar"
            aria-label="Toggle sidebar menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 text-xs text-[#84817a] dark:text-[#78756e] truncate">
            <span className="font-medium hover:text-[#1f1e1d] dark:hover:text-[#f0eee6] transition-colors cursor-pointer hidden sm:inline">
              PromptVault
            </span>
            <span className="hidden sm:inline">/</span>
            <span className="flex items-center gap-1.5 font-semibold text-[#1f1e1d] dark:text-[#f0eee6] truncate">
              {getBreadcrumbIcon()}
              <span className="truncate max-w-[180px] sm:max-w-[240px] md:max-w-[320px]">{getBreadcrumbTitle()}</span>
            </span>
          </div>

          {selectedTag && (
            <div className="flex items-center gap-1 pl-2 border-l border-[#e5e3da] dark:border-[#33312c]">
              <span className="text-xs text-[#cc785c] font-medium">#{selectedTag}</span>
              <button
                onClick={onClearTag}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Search, Filter, Sort, Primary Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#84817a]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari prompt atau variabel... (/)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-[#22211f] border border-[#e5e3da] dark:border-[#363430] rounded-lg text-[#1f1e1d] dark:text-[#f0eee6] placeholder-[#84817a] focus:outline-none focus:border-[#cc785c] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#84817a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="relative flex items-center">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as any)}
              className="text-xs bg-white dark:bg-[#22211f] border border-[#e5e3da] dark:border-[#363430] text-[#57554f] dark:text-[#a8a49a] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#cc785c] cursor-pointer appearance-none pr-7"
            >
              <option value="updatedAt">Terbaru Diperbarui</option>
              <option value="copyCount">Paling Sering Disalin</option>
              <option value="title">Judul (A-Z)</option>
              <option value="createdAt">Tanggal Dibuat</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-[#84817a] absolute right-2 pointer-events-none" />
          </div>

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-[#22211f] hover:bg-[#f3f1eb] dark:hover:bg-[#2a2926] border border-[#e5e3da] dark:border-[#363430] rounded-lg text-[#1f1e1d] dark:text-[#f0eee6] transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#cc785c]" />
            <span className="hidden sm:inline">Upload File</span>
          </button>

          {/* New Prompt Button */}
          <button
            onClick={onNewPrompt}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#cc785c] hover:bg-[#b5674c] text-white rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Prompt Baru</span>
          </button>

          {/* User Account / Login Button */}
          <div className="relative pl-1 border-l border-[#e5e3da] dark:border-[#363430]">
            {user ? (
              <div>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#e5e3da] dark:border-[#363430] bg-white dark:bg-[#22211f] hover:bg-[#f3f1eb] dark:hover:bg-[#2a2926] text-xs font-medium text-[#1f1e1d] dark:text-[#f0eee6] transition-colors cursor-pointer shadow-xs"
                  aria-label="Menu Akun Pengguna"
                >
                  {user.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name} 
                      className="w-5 h-5 rounded-full object-cover border border-[#cc785c]/40" 
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#faece7] dark:bg-[#38251e] text-[#cc785c] dark:text-[#e58767] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="max-w-[90px] sm:max-w-[120px] truncate hidden sm:inline">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#84817a]" />
                </button>

                <UserMenuPopup
                  user={user}
                  isOpen={isUserMenuOpen}
                  onClose={() => setIsUserMenuOpen(false)}
                  onLogout={onLogout}
                  onSwitchAccount={onOpenLogin}
                  onExportData={onExportData}
                  totalPrompts={totalPrompts}
                  totalProjects={totalProjects}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#cc785c] dark:text-[#e58767] hover:text-[#b5674c] bg-[#faece7]/80 hover:bg-[#faece7] dark:bg-[#38251e]/60 dark:hover:bg-[#38251e] border border-[#cc785c]/35 rounded-lg transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subcategory Strip / Tabs */}
      <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-1 no-scrollbar text-xs">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1 rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#1f1e1d] text-white dark:bg-[#f0eee6] dark:text-[#181716] font-medium'
                  : 'text-[#84817a] dark:text-[#78756e] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6] hover:bg-[#f3f1eb] dark:hover:bg-[#22201d]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </header>
  );
};

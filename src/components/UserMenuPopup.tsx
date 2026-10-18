import React, { useRef, useEffect } from 'react';
import { 
  User, 
  LogOut, 
  Sparkles, 
  ShieldCheck, 
  SwitchCamera, 
  Database, 
  ChevronRight,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { UserProfile } from '../types';

interface UserMenuPopupProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onSwitchAccount: () => void;
  onExportData: () => void;
  totalPrompts: number;
  totalProjects: number;
}

export const UserMenuPopup: React.FC<UserMenuPopupProps> = ({
  user,
  isOpen,
  onClose,
  onLogout,
  onSwitchAccount,
  onExportData,
  totalPrompts,
  totalProjects,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

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

  // Initial letter for avatar
  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div
      ref={popupRef}
      className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#22211f] border border-[#e5e3da] dark:border-[#363430] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* User Header */}
      <div className="p-4 bg-[#faf9f5] dark:bg-[#1c1b1a] border-b border-[#e5e3da] dark:border-[#33312c]">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover border border-[#cc785c]/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#faece7] dark:bg-[#38251e] border border-[#cc785c]/40 text-[#cc785c] dark:text-[#e58767] font-semibold text-sm flex items-center justify-center shrink-0">
              {initial}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-xs text-[#1f1e1d] dark:text-[#f0eee6] truncate block">
                {user.name}
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#faece7] dark:bg-[#38251e] text-[#cc785c] dark:text-[#e58767] rounded-md shrink-0">
                PRO
              </span>
            </div>
            <span className="text-[11px] text-[#84817a] truncate block">
              {user.email}
            </span>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#e5e3da]/70 dark:border-[#2e2c29] text-center">
          <div className="bg-white dark:bg-[#252320] py-1.5 px-2 rounded-lg border border-[#e5e3da]/60 dark:border-[#383632]">
            <div className="text-[10px] text-[#84817a]">Koleksi Prompt</div>
            <div className="text-xs font-bold text-[#1f1e1d] dark:text-[#f0eee6]">{totalPrompts}</div>
          </div>
          <div className="bg-white dark:bg-[#252320] py-1.5 px-2 rounded-lg border border-[#e5e3da]/60 dark:border-[#383632]">
            <div className="text-[10px] text-[#84817a]">Proyek Aktif</div>
            <div className="text-xs font-bold text-[#1f1e1d] dark:text-[#f0eee6]">{totalProjects}</div>
          </div>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="px-3.5 py-2 bg-emerald-50/60 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Sesi Aktif & Tersinkron</span>
        </div>
        <span className="text-[10px] text-emerald-600/80 dark:text-emerald-500 uppercase tracking-wide">
          {user.provider}
        </span>
      </div>

      {/* Menu Actions */}
      <div className="p-1.5 space-y-0.5 text-xs">
        <button
          onClick={() => {
            onClose();
            onExportData();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#57554f] dark:text-[#a8a49a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6] hover:bg-[#faf9f5] dark:hover:bg-[#282623] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-[#cc785c]" />
            <span>Cadangkan Data Prompt</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#84817a]" />
        </button>

        <button
          onClick={() => {
            onClose();
            onSwitchAccount();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#57554f] dark:text-[#a8a49a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6] hover:bg-[#faf9f5] dark:hover:bg-[#282623] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <SwitchCamera className="w-4 h-4 text-neutral-400" />
            <span>Ganti Akun Lain</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#84817a]" />
        </button>
      </div>

      {/* Logout Action */}
      <div className="p-1.5 border-t border-[#e5e3da]/70 dark:border-[#33312c]">
        <button
          onClick={() => {
            onClose();
            onLogout();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-xs font-medium cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Akun</span>
        </button>
      </div>
    </div>
  );
};

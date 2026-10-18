import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck
} from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../supabaseClient';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile, message: string) => void;
  canClose?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  canClose = true,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Close on Escape key if allowed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && canClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, canClose]);

  // Read URL search params on mount (for ?signup=success&email=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const signupParam = params.get('signup');
    const emailParam = params.get('email');

    if (signupParam === 'success' || emailParam) {
      setTab('signin');
      if (emailParam) {
        setEmail(decodeURIComponent(emailParam));
      }
      setSuccessNotice("Your account has been created. Please check your email and verify your address before logging in.");
    }
  }, []);

  // Reset errors when opened, without overwriting pre-filled email from signup
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic Validation
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Masukkan alamat email yang valid.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Kata sandi harus minimal 6 karakter.');
      return;
    }

    if (tab === 'signup' && !name.trim()) {
      setErrorMessage('Silakan masukkan nama lengkap Anda.');
      return;
    }

    setIsLoading(true);

    try {
      if (tab === 'signup') {
        const submittedEmail = email.trim().toLowerCase();

        // 1) For Sign Up: supabase.auth.signUp({ email, password })
        const { error } = await supabase.auth.signUp({
          email: submittedEmail,
          password: password,
          options: {
            data: {
              full_name: name.trim() || undefined,
            },
          },
        });

        // Basic error handling if signup fails
        if (error) {
          setErrorMessage(error.message);
          setSuccessNotice(null);
          setIsLoading(false);
          return;
        }

        // 1) After a successful Supabase signUp({ email, password }):
        // - Do NOT auto-login.
        // - Redirect the user to the Sign In page.
        // - Keep / pre-fill the email they just used for signup in the Sign In form.
        setIsLoading(false);
        setPassword(''); // Clear password field for clean sign in
        setEmail(submittedEmail); // Pre-fill email
        setErrorMessage(null);
        setSuccessNotice("Your account has been created. Please check your email and verify your address before logging in.");
        setTab('signin');

        // Pass email via query parameter so it survives page reloads
        const newUrl = `/login?signup=success&email=${encodeURIComponent(submittedEmail)}`;
        window.history.pushState({ signupSuccess: true, email: submittedEmail }, '', newUrl);
        return;
      } else {
        // 2) For Sign In: Use supabase.auth.signInWithPassword({ email, password })
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        // Error handling if sign in fails
        if (error) {
          setErrorMessage(error.message);
          setSuccessNotice(null);
          setIsLoading(false);
          return;
        }

        // Only redirect when a real session exists after login
        if (!data.session) {
          setErrorMessage("Please verify your email address before logging in.");
          setSuccessNotice(null);
          setIsLoading(false);
          return;
        }

        const authUser = data.user;
        const displayName =
          authUser?.user_metadata?.full_name ||
          email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

        const loggedUser: UserProfile = {
          id: authUser?.id || 'usr_' + Date.now().toString(36),
          name: displayName,
          email: email.trim().toLowerCase(),
          provider: 'email',
          createdAt: authUser?.created_at || new Date().toISOString(),
        };

        setIsLoading(false);
        onLoginSuccess(loggedUser, `Selamat datang kembali, ${displayName}!`);
        onClose();

        // Clear signup query parameters on successful login and redirect to '/'
        if (window.location.pathname !== '/' || window.location.search) {
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan saat memproses permintaan.');
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google') => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/',
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || `Gagal login dengan Google`);
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => {
        if (canClose) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-[#22211f] border border-[#e5e3da] dark:border-[#363430] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#cc785c] via-[#da7756] to-amber-500" />

        {/* Modal Close Button */}
        {canClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[#84817a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6] hover:bg-[#f3f1eb] dark:hover:bg-[#2e2c29] transition-colors cursor-pointer"
            aria-label="Tutup popup"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Modal Body */}
        <div className="p-6 md:p-7">
          {/* Brand header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#faece7] dark:bg-[#38251e] border border-[#cc785c]/20 flex items-center justify-center text-[#cc785c] mx-auto mb-3 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="font-serif-claude text-2xl font-bold text-[#1f1e1d] dark:text-[#f0eee6]">
              {tab === 'signin' ? 'Masuk ke PromptVault' : 'Buat Akun Baru'}
            </h2>
            <p className="text-xs text-[#84817a] dark:text-[#a8a49a] mt-1.5 max-w-xs mx-auto">
              Simpan, sinkronkan, dan jalankan koleksi prompt Claude & AI Anda di berbagai perangkat.
            </p>
          </div>

          {/* Social Login Button (Google) */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-3 bg-[#faf9f5] hover:bg-[#f3f1eb] dark:bg-[#282623] dark:hover:bg-[#302e2a] border border-[#e5e3da] dark:border-[#383632] rounded-xl text-xs font-medium text-[#1f1e1d] dark:text-[#f0eee6] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Lanjutkan dengan Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e5e3da] dark:border-[#33312c]" />
            </div>
            <span className="relative px-3 bg-white dark:bg-[#22211f] text-[11px] text-[#84817a] uppercase tracking-wider">
              atau dengan email
            </span>
          </div>

          {/* Tab Selector: Masuk / Daftar */}
          <div className="flex rounded-xl bg-[#f3f1eb] dark:bg-[#1a1918] p-1 mb-4">
            <button
              type="button"
              onClick={() => {
                setTab('signin');
                setErrorMessage(null);
                setSuccessNotice(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                tab === 'signin'
                  ? 'bg-white dark:bg-[#282623] text-[#1f1e1d] dark:text-[#f0eee6] shadow-xs'
                  : 'text-[#84817a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6]'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setErrorMessage(null);
                setSuccessNotice(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                tab === 'signup'
                  ? 'bg-white dark:bg-[#282623] text-[#1f1e1d] dark:text-[#f0eee6] shadow-xs'
                  : 'text-[#84817a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6]'
              }`}
            >
              Daftar Baru
            </button>
          </div>

          {/* Success Message ABOVE the form on Sign In */}
          {tab === 'signin' && successNotice && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{successNotice}</span>
            </div>
          )}

          {/* Error Message ABOVE the form */}
          {errorMessage && (
            <div className="mb-4 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-[#57554f] dark:text-[#a8a49a] mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#84817a] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="misal: Panji Wibowo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#faf9f5] dark:bg-[#1b1a19] border border-[#e5e3da] dark:border-[#363430] rounded-xl text-[#1f1e1d] dark:text-[#f0eee6] focus:outline-none focus:border-[#cc785c] focus:bg-white dark:focus:bg-[#22211f] transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#57554f] dark:text-[#a8a49a] mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#84817a] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#faf9f5] dark:bg-[#1b1a19] border border-[#e5e3da] dark:border-[#363430] rounded-xl text-[#1f1e1d] dark:text-[#f0eee6] focus:outline-none focus:border-[#cc785c] focus:bg-white dark:focus:bg-[#22211f] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#57554f] dark:text-[#a8a49a]">
                  Kata Sandi
                </label>
                {tab === 'signin' && (
                  <button
                    type="button"
                    onClick={() => alert('Fitur reset sandi: Tautan pemulihan akan dikirimkan ke email terdaftar.')}
                    className="text-[11px] text-[#cc785c] hover:underline"
                  >
                    Lupa sandi?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#84817a] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-[#faf9f5] dark:bg-[#1b1a19] border border-[#e5e3da] dark:border-[#363430] rounded-xl text-[#1f1e1d] dark:text-[#f0eee6] focus:outline-none focus:border-[#cc785c] focus:bg-white dark:focus:bg-[#22211f] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#84817a] hover:text-[#1f1e1d] dark:hover:text-[#f0eee6]"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#cc785c] rounded cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-[11px] text-[#84817a] dark:text-[#a8a49a] cursor-pointer">
                Tetap masuk di perangkat ini
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-[#cc785c] hover:bg-[#b5674c] text-white font-medium text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{tab === 'signin' ? 'Masuk Sekarang' : 'Daftarkan Akun'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Privacy & Security note */}
          <div className="mt-5 pt-4 border-t border-[#e5e3da]/60 dark:border-[#33312c] flex items-center justify-center gap-2 text-[10px] text-[#84817a]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Koneksi aman dengan enkripsi data & sesi lokal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

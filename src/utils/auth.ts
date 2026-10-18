import { User, UserRecord } from '../types';

const AUTH_KEYS = {
  USERS: 'promptvault_auth_users_v1',
  CURRENT_USER: 'promptvault_current_user_v1',
  REMEMBER_ME: 'promptvault_remember_me_v1',
};

// Simple yet secure SHA-256 hashing using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_promptvault_salt_2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Preset default demo users with known hashed passwords
// password123 hash with salt
const DEFAULT_USERS_SEEDED: UserRecord[] = [
  {
    id: 'user_panji_001',
    email: 'bossmanpanji@gmail.com',
    name: 'Panji Bossman',
    avatarColor: '#cc785c',
    createdAt: '2025-01-15T08:00:00Z',
    // SHA-256 hash for 'password123_promptvault_salt_2025'
    passwordHash: '8642055743c4a961df7e20ec427aa29b9f5e1f0e219760dd186c761b0c0f82df',
  },
  {
    id: 'user_demo_002',
    email: 'demo@promptvault.app',
    name: 'Pengguna Demo',
    avatarColor: '#3b82f6',
    createdAt: '2025-02-01T10:00:00Z',
    passwordHash: '8642055743c4a961df7e20ec427aa29b9f5e1f0e219760dd186c761b0c0f82df',
  },
];

export function getStoredUsers(): UserRecord[] {
  try {
    const raw = localStorage.getItem(AUTH_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(DEFAULT_USERS_SEEDED));
      return DEFAULT_USERS_SEEDED;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USERS_SEEDED;
  } catch {
    return DEFAULT_USERS_SEEDED;
  }
}

export function saveStoredUsers(users: UserRecord[]): void {
  try {
    localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users to localStorage', e);
  }
}

export function getCurrentUser(): User | null {
  try {
    // Check localStorage first
    const rawLocal = localStorage.getItem(AUTH_KEYS.CURRENT_USER);
    if (rawLocal) return JSON.parse(rawLocal);

    // Check sessionStorage if remember me was false
    const rawSession = sessionStorage.getItem(AUTH_KEYS.CURRENT_USER);
    if (rawSession) return JSON.parse(rawSession);

    return null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null, rememberMe: boolean = true): void {
  try {
    if (!user) {
      localStorage.removeItem(AUTH_KEYS.CURRENT_USER);
      sessionStorage.removeItem(AUTH_KEYS.CURRENT_USER);
      return;
    }

    const payload = JSON.stringify(user);
    if (rememberMe) {
      localStorage.setItem(AUTH_KEYS.CURRENT_USER, payload);
      sessionStorage.removeItem(AUTH_KEYS.CURRENT_USER);
    } else {
      sessionStorage.setItem(AUTH_KEYS.CURRENT_USER, payload);
      localStorage.removeItem(AUTH_KEYS.CURRENT_USER);
    }
  } catch (e) {
    console.error('Failed to set current user', e);
  }
}

export async function loginUser(
  email: string, 
  passwordPlain: string, 
  rememberMe: boolean = true
): Promise<{ success: boolean; user?: User; error?: string }> {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();
  
  const userRecord = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!userRecord) {
    return {
      success: false,
      error: 'Email tidak ditemukan. Silakan periksa kembali atau daftar akun baru.',
    };
  }

  const hash = await hashPassword(passwordPlain);
  // For easy onboarding, demo accounts also accept 'password123'
  const isMatch = userRecord.passwordHash === hash || 
    (passwordPlain === 'password123' && (normalizedEmail === 'bossmanpanji@gmail.com' || normalizedEmail === 'demo@promptvault.app'));

  if (!isMatch) {
    return {
      success: false,
      error: 'Kata sandi salah. Silakan coba lagi atau gunakan opsi lupa password.',
    };
  }

  const { passwordHash: _, ...publicUser } = userRecord;
  setCurrentUser(publicUser, rememberMe);
  return { success: true, user: publicUser };
}

export async function registerUser(
  name: string,
  email: string,
  passwordPlain: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  if (!name.trim()) {
    return { success: false, error: 'Nama lengkap wajib diisi.' };
  }
  if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    return { success: false, error: 'Format alamat email tidak valid.' };
  }
  if (passwordPlain.length < 6) {
    return { success: false, error: 'Kata sandi minimal 6 karakter.' };
  }

  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return { success: false, error: 'Email sudah terdaftar. Silakan masuk menggunakan akun tersebut.' };
  }

  const avatarColors = ['#cc785c', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b'];
  const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

  const passwordHash = await hashPassword(passwordPlain);
  const newUser: UserRecord = {
    id: `user_${Date.now()}`,
    email: normalizedEmail,
    name: name.trim(),
    avatarColor: randomColor,
    createdAt: new Date().toISOString(),
    passwordHash,
  };

  const updatedUsers = [...users, newUser];
  saveStoredUsers(updatedUsers);

  const { passwordHash: _, ...publicUser } = newUser;
  setCurrentUser(publicUser, true);

  return { success: true, user: publicUser };
}

export async function resetUserPassword(
  email: string,
  newPasswordPlain: string
): Promise<{ success: boolean; error?: string }> {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const userIndex = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);
  if (userIndex === -1) {
    return { success: false, error: 'Akun dengan email tersebut tidak ditemukan.' };
  }

  if (newPasswordPlain.length < 6) {
    return { success: false, error: 'Kata sandi baru minimal 6 karakter.' };
  }

  const passwordHash = await hashPassword(newPasswordPlain);
  users[userIndex].passwordHash = passwordHash;
  saveStoredUsers(users);

  return { success: true };
}

export function logoutUser(): void {
  setCurrentUser(null);
}

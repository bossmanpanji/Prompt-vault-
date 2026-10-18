import { createClient } from "@supabase/supabase-js";

// ============================================================================
// 1. TEMPELKAN URL SUPABASE PROYEK ANDA DI SINI (Project URL)
// ============================================================================
const SUPABASE_URL = "https://rykadeeqlinqzxledgkl.supabase.co/rest/v1/";

// ============================================================================
// 2. TEMPELKAN SUPABASE PUBLIC / ANON KEY ANDA DI SINI
// ============================================================================
const SUPABASE_PUBLIC_KEY = "sb_publishable_5BAo3brdQyoEFgXO8YybkA_-ugGPYHW";

// createClient membutuhkan base URL tanpa suffix endpoint (/rest/v1/),
// fungsi di bawah otomatis membersihkannya agar koneksi valid.
const formattedUrl = SUPABASE_URL.replace(/\/rest\/v1\/?$/, "");

export const supabase = createClient(formattedUrl || SUPABASE_URL, SUPABASE_PUBLIC_KEY);

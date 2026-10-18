# PromptVault - Claude Style Prompt Manager

Aplikasi manajemen dan pengorganisasian prompt bergaya Claude AI dengan fitur Project, upload file teks/instruksi, deteksi otomatis variabel `{{variabel}}`, prompt runner interaktif, dan penyimpanan offline lokal (localStorage).

---

## 🚀 Panduan Deploy ke Vercel

Aplikasi ini sudah dikonfigurasi penuh dengan file `vercel.json` dan Vite build modern sehingga **100% siap di-deploy langsung ke Vercel tanpa konfigurasi tambahan**.

### Cara 1: Deploy via Dashboard Vercel (Paling Mudah)
1. Push repository ini ke akun **GitHub**, **GitLab**, atau **Bitbucket** Anda.
2. Buka [vercel.com](https://vercel.com) dan login ke akun Anda.
3. Klik tombol **"Add New..."** lalu pilih **"Project"**.
4. Pilih repository project ini dari daftar Git Anda lalu klik **"Import"**.
5. Vercel akan otomatis mengenali:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Klik **"Deploy"**. Dalam ~30 detik, website Anda sudah aktif dengan URL gratis `https://nama-project.vercel.app`!

---

### Cara 2: Deploy via Vercel CLI (Terminal)
Jika Anda menggunakan Vercel CLI:
```bash
# 1. Install Vercel CLI secara global (jika belum)
npm install -g vercel

# 2. Jalankan perintah deploy di folder project
vercel

# 3. Untuk deploy langsung ke production:
vercel --prod
```

---

## 🛠️ Konfigurasi Vercel yang Disediakan (`vercel.json`)
- **SPA Rewrites**: Menangani routing Single Page Application (Vite) agar tidak terjadi error 404 saat navigasi atau reload halaman.
- **Asset Caching**: Mengaktifkan caching browser jangka panjang (`immutable`) untuk aset statis (`/assets/*`).
- **Security Headers**: Dilengkapi header perlindungan (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`).
- **`.vercelignore`**: Memastikan folder `node_modules` dan file log lokal tidak ikut diunggah.

---

## 💻 Menjalankan di Lokal (Development)
```bash
# Install dependencies
npm install

# Jalankan dev server
npm run dev

# Build untuk production
npm run build

# Preview build lokal
npm run preview
```

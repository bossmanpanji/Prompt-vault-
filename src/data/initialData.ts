import { Project, PromptItem } from '../types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-software-eng',
    name: 'Pengembangan Web & Software',
    description: 'Kumpulan prompt untuk arsitektur sistem, code review, debugging, dan implementasi fitur modern.',
    customInstructions: 'Kamu adalah Senior Fullstack Software Architect. Berikan solusi dengan kode TypeScript/React yang bersih, modular, tangguh terhadap edge cases, dan sertakan penjelasan singkat yang to-the-point.',
    color: '#cc785c', // Claude terracotta
    icon: 'Code2',
    createdAt: '2026-03-10T08:00:00Z',
    updatedAt: '2026-04-01T10:30:00Z',
  },
  {
    id: 'proj-copywriting',
    name: 'Pemasaran Konten & Copywriting',
    description: 'Prompt untuk artikel SEO bernas, landing page copy konversi tinggi, hook media sosial, dan email newsletter.',
    customInstructions: 'Gunakan gaya bahasa copywriting persuasif, profesional namun mengalir santai. Hindari klise AI klise (seperti "delve", "game-changer"), dan tonjolkan value proposition yang jelas.',
    color: '#d97706', // warm amber
    icon: 'PenTool',
    createdAt: '2026-03-12T09:15:00Z',
    updatedAt: '2026-04-05T14:20:00Z',
  },
  {
    id: 'proj-data-research',
    name: 'Analisis Data & Riset Bisnis',
    description: 'Template ekstraksi data terstruktur JSON, framework evaluasi pasar, sintesis laporan, dan business intelligence.',
    customInstructions: 'Bertindak sebagai Principal Data Analyst dan konsultan strategi. Prioritaskan kejelasan logika, data terstruktur JSON valid, dan actionable insights berbasis angka.',
    color: '#059669', // emerald
    icon: 'BarChart3',
    createdAt: '2026-03-15T11:00:00Z',
    updatedAt: '2026-04-10T16:45:00Z',
  },
];

export const INITIAL_PROMPTS: PromptItem[] = [
  {
    id: 'prompt-code-review',
    title: 'Senior Code Reviewer & Security Audit',
    projectId: 'proj-software-eng',
    description: 'Review mendalam untuk mendeteksi race conditions, kebocoran memori, dan celah keamanan OWASP.',
    content: `Sebagai Principal Security Engineer dan Staff Developer, tolong lakukan audit dan review kode secara teliti untuk kode berikut:

Bahasa / Framework: {{bahasa_pemrograman}}
Fokus Utama: {{fokus_audit}} (Performa, Keamanan OWASP, Memory Leak, Arsitektur)

Kode yang perlu di-review:
\`\`\`{{bahasa_pemrograman}}
{{kode_sumber}}
\`\`\`

Mohon format ulasan kamu dalam:
1. Ringkasan Eksekutif (Kualitas keseluruhan & skor keamanan 1-10)
2. Temuan Kritis & Rekomendasi Solusi (sertakan potongan diff / kode perbaikan)
3. Optimasi Performa & Edge Cases yang belum tertangani
4. Kode hasil refactor akhir yang siap produksi`,
    tags: ['code-review', 'security', 'typescript', 'architecture'],
    variables: ['bahasa_pemrograman', 'fokus_audit', 'kode_sumber'],
    category: 'Coding & Tech',
    targetModel: 'Claude 3.7 Sonnet',
    isFavorite: true,
    copyCount: 42,
    lastUsedAt: '2026-04-15T09:30:00Z',
    createdAt: '2026-03-10T08:30:00Z',
    updatedAt: '2026-04-12T11:20:00Z',
    versions: [
      {
        timestamp: '2026-03-10T08:30:00Z',
        content: 'Review kode ini tolong cek bug dan security.',
        note: 'Versi draf pertama'
      },
      {
        timestamp: '2026-04-12T11:20:00Z',
        content: 'Format struktural 4 poin audit keamanan tingkat senior.',
        note: 'Ditambahkan variabel fokus_audit dan kode refactor'
      }
    ]
  },
  {
    id: 'prompt-claude-artifact',
    title: 'Claude React Component & UI Crafting',
    projectId: 'proj-software-eng',
    description: 'Prompt pembuatan komponen React interaktif bergaya modern dengan Tailwind CSS dan accessibility penuh.',
    content: `Buatkan komponen React (TypeScript) untuk: {{nama_komponen}}.
Tujuan fungsionalitas: {{fungsionalitas}}
Gaya Desain: Clean modern, font Plus Jakarta Sans, Tailwind CSS, zero-clutter.

Ketentuan penting:
- Komponen harus self-contained, typed secara eksplisit (no \`any\`).
- Tangani state: normal, hover/focus, loading, dan empty state.
- Gunakan Lucide React untuk ikon jika relevan.
- Sertakan contoh integrasi atau demo state di dalam komponen.`,
    tags: ['react', 'tailwind', 'ui-ux', 'artifact'],
    variables: ['nama_komponen', 'fungsionalitas'],
    category: 'Coding & Tech',
    targetModel: 'Claude 3.7 Sonnet',
    isFavorite: true,
    copyCount: 28,
    lastUsedAt: '2026-04-14T15:10:00Z',
    createdAt: '2026-03-11T10:00:00Z',
    updatedAt: '2026-04-08T14:00:00Z',
  },
  {
    id: 'prompt-landing-headline',
    title: 'High-Converting Hero Headline & Value Hook',
    projectId: 'proj-copywriting',
    description: 'Menghasilkan 5 variasi headline hero landing page dengan formula PAS, BAB, dan Direct Value.',
    content: `Saya sedang merancang landing page untuk produk: {{nama_produk}}.
Target audiens: {{target_audiens}}
Masalah terbesar yang mereka hadapi: {{masalah_utama}}
Solusi unik yang kami tawarkan: {{solusi_unik}}

Tolong buatkan 5 set copy Hero Section dengan struktur:
1. Eyebrow / Kicker (3-5 kata)
2. Main Headline (maksimal 10 kata, kuat, tanpa kata klise)
3. Sub-headline (1-2 kalimat penjelas dengan bukti konkrit)
4. Teks Call to Action (CTA) utama (3 kata kerja aktif)

Sertakan penjelasan singkat alasan psikologis di balik setiap variasi.`,
    tags: ['copywriting', 'landing-page', 'conversion', 'headline'],
    variables: ['nama_produk', 'target_audiens', 'masalah_utama', 'solusi_unik'],
    category: 'Copywriting & Konten',
    targetModel: 'Claude 3.5 Haiku',
    isFavorite: true,
    copyCount: 35,
    lastUsedAt: '2026-04-16T11:00:00Z',
    createdAt: '2026-03-12T14:00:00Z',
    updatedAt: '2026-04-10T09:15:00Z',
  },
  {
    id: 'prompt-b2b-cold-email',
    title: 'Email Outreach B2B 3-Paragraf (Tanpa Basa-Basi)',
    projectId: 'proj-copywriting',
    description: 'Template email penawaran B2B yang menghargai waktu penerima dan fokus pada dampak angka bisnis.',
    content: `Tuliskan draft email cold outreach yang sangat personal dan singkat (maksimal 120 kata) untuk:
Nama Prospek: {{nama_prospek}}
Jabatan & Perusahaan: {{jabatan_perusahaan}}
Triggers / Berita Terkini Mereka: {{trigger_event}}
Solusi yang kita tawarkan: {{nilai_solusi}}

Aturan nada bicara:
- Jangan gunakan salam pembuka basi ("Semoga email ini menemui Anda dalam keadaan sehat").
- Paragraf 1: Pengamatan relevan tentang perusahaan mereka.
- Paragraf 2: Cara kita menyelesaikan masalah spesifik tersebut + 1 bukti hasil terukur.
- Paragraf 3: Soft call to action (misal: "Apakah relevan jika saya kirimkan 2 menit ringkasan via email?").`,
    tags: ['email', 'b2b', 'sales', 'cold-email'],
    variables: ['nama_prospek', 'jabatan_perusahaan', 'trigger_event', 'nilai_solusi'],
    category: 'Copywriting & Konten',
    targetModel: 'Claude 3.5 Sonnet',
    isFavorite: false,
    copyCount: 19,
    lastUsedAt: '2026-04-09T16:20:00Z',
    createdAt: '2026-03-14T09:00:00Z',
    updatedAt: '2026-03-25T11:00:00Z',
  },
  {
    id: 'prompt-json-extractor',
    title: 'Ekstraksi Data Teks ke Format JSON Valid',
    projectId: 'proj-data-research',
    description: 'Mengubah teks mentah atau laporan tidak terstruktur menjadi schema JSON siap pakai tanpa halusinasi.',
    content: `Anda adalah mesin ekstraksi data JSON presisi tinggi.
Tolong ekstrak informasi dari teks berikut dan hasilkan HANYA objek JSON yang valid dan terformat rapi sesuai skema berikut.

Skema JSON yang diinginkan:
\`\`\`json
{{skema_json_target}}
\`\`\`

Teks Sumber:
"""
{{teks_sumber}}
"""

Instruksi ketat:
- Kembalikan HANYA valid JSON, tanpa teks pembuka atau penutup markdown selain kode JSON.
- Jika ada field yang tidak ditemukan di teks sumber, isi dengan null (jangan mengarang data).
- Format tanggal dalam format ISO 8601 (YYYY-MM-DD).`,
    tags: ['json', 'data-extraction', 'automation', 'structured-data'],
    variables: ['skema_json_target', 'teks_sumber'],
    category: 'Riset & Analisis',
    targetModel: 'Claude 3.5 Haiku',
    isFavorite: true,
    copyCount: 51,
    lastUsedAt: '2026-04-16T14:30:00Z',
    createdAt: '2026-03-16T11:30:00Z',
    updatedAt: '2026-04-14T17:10:00Z',
  },
  {
    id: 'prompt-swot-framework',
    title: 'Analisis Strategis SWOT & TOWS Komprehensif',
    projectId: 'proj-data-research',
    description: 'Framework matriks SWOT dilanjutkan dengan strategi aksi TOWS untuk perencanaan bisnis.',
    content: `Lakukan analisis SWOT mendalam dan matriks strategi TOWS untuk:
Bisnis / Produk: {{nama_bisnis}}
Industri & Pasar: {{industri}}
Kondisi Internal Saat Ini: {{kondisi_internal}}
Tantangan Pasar Utama: {{tantangan_pasar}}

Keluaran yang diharapkan:
1. Matriks 4 Kuadran SWOT (Strengths, Weaknesses, Opportunities, Threats)
2. Strategi TOWS (SO: Maksimalkan Kekuatan untuk Raih Peluang; WO: Atasi Kelemahan dengan Peluang; ST: Pakai Kekuatan Hadapi Ancaman; WT: Minimalisir Kelemahan & Hindari Ancaman)
3. 3 Prioritas Quick-Win dalam 30 hari ke depan`,
    tags: ['strategy', 'swot', 'business-plan', 'analysis'],
    variables: ['nama_bisnis', 'industri', 'kondisi_internal', 'tantangan_pasar'],
    category: 'Bisnis & Strategi',
    targetModel: 'Claude 3.7 Sonnet',
    isFavorite: false,
    copyCount: 14,
    lastUsedAt: '2026-04-02T13:00:00Z',
    createdAt: '2026-03-18T10:00:00Z',
    updatedAt: '2026-03-18T10:00:00Z',
  },
  {
    id: 'prompt-system-financial',
    title: 'System Prompt: Advisor Finansial & Portofolio',
    projectId: null,
    description: 'System prompt untuk memprogram asisten AI menjadi penasihat keuangan analitis dan objektif.',
    content: `Anda berperan sebagai Analis Perencanaan Keuangan Independen bersertifikat (CFP).
Karakteristik interaksi Anda:
- Netral, berbasis angka, tidak mempromosikan produk finansial tertentu.
- Selalu memperjelas konsep risiko, likuiditas, dan inflasi.
- Bila pengguna meminta rekomendasi saham atau instrumen berisiko, selalu tekankan diversifikasi dan batas profil risiko.
- Gunakan bahasa Indonesia yang mudah dipahami orang awam tanpa mengurangi akurasi terminologi keuangan.

Format jawaban:
1. Diagnosis situasi finansial pengguna
2. Analisis simulasi skenario (skenario konservatif vs moderat)
3. Langkah aksi bertahap (Checklist prioritas: dana darurat, asuransi murni, baru investasi)`,
    tags: ['system-prompt', 'finance', 'persona', 'advisory'],
    variables: [],
    category: 'System Prompt',
    targetModel: 'Claude 3.7 Sonnet',
    isFavorite: true,
    copyCount: 31,
    lastUsedAt: '2026-04-15T18:00:00Z',
    createdAt: '2026-03-20T14:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
  }
];

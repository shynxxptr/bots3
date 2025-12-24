# Daftar Lengkap Semua Icon yang Dibutuhkan untuk Profile Card

## 📐 Ukuran Icon

### 1. Icon Title (20px × 20px)
Digunakan untuk title/header di profile card

### 2. Icon Stats Sidebar (24px × 24px)
Digunakan untuk icon di sidebar stats

### 3. Icon Achievement/Badge (Ukuran Badge Card)
Badge ditampilkan di card dengan tinggi 70px, icon ditampilkan dengan font size 20px (sekitar 20×20px efektif)

---

## 📋 DAFTAR ICON YANG DIBUTUHKAN

### A. ICON TITLE (20×20px) - 2 icon

1. **icon_stats.png** (20×20px)
   - Untuk: Title "Stats" di sidebar
   - Fungsi: `drawStatsIcon()`
   - Lokasi kode: Baris ~806

2. **icon_trophy.png** (20×20px)
   - Untuk: Title "Achievements"
   - Fungsi: `drawTrophyIcon()`
   - Lokasi kode: Baris ~1008

---

### B. ICON STATS SIDEBAR (24×24px) - 6 icon

1. **icon_microphone.png** (24×24px)
   - Untuk: Voice Time & Voice Streak
   - Fungsi: `drawMicrophoneIcon()`
   - Lokasi kode: Baris ~864
w
2. **icon_message.png** (24×24px)
   - Untuk: Messages
   - Fungsi: `drawMessageIcon()`
   - Lokasi kode: Baris ~880

3. **icon_star.png** (24×24px)
   - Untuk: Prestasi
   - Fungsi: `drawStarIcon()`
   - Lokasi kode: Baris ~914

4. **icon_quote.png** (24×24px)
   - Untuk: Quotes
   - Fungsi: `drawQuoteIcon()`
   - Lokasi kode: Baris ~944

5. **icon_fire.png** (24×24px)
   - Untuk: Streak
   - Fungsi: `drawFireIcon()`
   - Lokasi kode: Baris ~965

6. **icon_default.png** (24×24px)
   - Untuk: Default (jika stat tidak dikenali)
   - Fungsi: `drawDefaultIcon()`
   - Lokasi kode: Baris ~998

---

### C. ICON ACHIEVEMENT/BADGE (~20×20px efektif) - 35 icon

Icon achievement ditampilkan sebagai emoji di badge card. Ukuran font 20px, jadi icon harus terlihat jelas pada ukuran sekitar 20×20px.

#### Voice Achievements (6 icon)

1. **icon_achievement_voice_murid_baru.png** (~20×20px)
   - ID: `voice_murid_baru`
   - Nama: "Murid Baru"
   - Emoji asli: 🎤
   - Kategori: Voice (10 jam)

2. **icon_achievement_voice_siswa_aktif.png** (~20×20px)
   - ID: `voice_siswa_aktif`
   - Nama: "Siswa Aktif"
   - Emoji asli: 📢
   - Kategori: Voice (25 jam)

3. **icon_achievement_voice_enthusiast.png** (~20×20px)
   - ID: `voice_enthusiast`
   - Nama: "Voice Enthusiast"
   - Emoji asli: 🎙️
   - Kategori: Voice (50 jam)

4. **icon_achievement_voice_ketua.png** (~20×20px)
   - ID: `voice_ketua`
   - Nama: "Ketua Voice"
   - Emoji asli: 👑
   - Kategori: Voice (100 jam)

5. **icon_achievement_voice_master.png** (~20×20px)
   - ID: `voice_master`
   - Nama: "Voice Master"
   - Emoji asli: ⭐
   - Kategori: Voice (250 jam)

6. **icon_achievement_voice_legend.png** (~20×20px)
   - ID: `voice_legend`
   - Nama: "Voice Legend"
   - Emoji asli: 💫
   - Kategori: Voice (500 jam)

#### Reputation Achievements (5 icon)

7. **icon_achievement_prestasi_siswa_biasa.png** (~20×20px)
   - ID: `prestasi_siswa_biasa`
   - Nama: "Siswa Biasa"
   - Emoji asli: 📜
   - Kategori: Reputation (10 poin)

8. **icon_achievement_prestasi_berprestasi.png** (~20×20px)
   - ID: `prestasi_berprestasi`
   - Nama: "Siswa Berprestasi"
   - Emoji asli: 🏆
   - Kategori: Reputation (25 poin)

9. **icon_achievement_prestasi_emas.png** (~20×20px)
   - ID: `prestasi_emas`
   - Nama: "Prestasi Emas"
   - Emoji asli: ⭐
   - Kategori: Reputation (50 poin)

10. **icon_achievement_prestasi_platinum.png** (~20×20px)
    - ID: `prestasi_platinum`
    - Nama: "Prestasi Platinum"
    - Emoji asli: 💎
    - Kategori: Reputation (100 poin)

11. **icon_achievement_prestasi_diamond.png** (~20×20px)
    - ID: `prestasi_diamond`
    - Nama: "Prestasi Diamond"
    - Emoji asli: ✨
    - Kategori: Reputation (250 poin)

#### Streak Achievements (5 icon)

12. **icon_achievement_streak_tidak_bolos.png** (~20×20px)
    - ID: `streak_tidak_bolos`
    - Nama: "Tidak Bolos"
    - Emoji asli: ✅
    - Kategori: Streak (7 hari)

13. **icon_achievement_streak_rajin_absen.png** (~20×20px)
    - ID: `streak_rajin_absen`
    - Nama: "Rajin Absen"
    - Emoji asli: 📅
    - Kategori: Streak (14 hari)

14. **icon_achievement_streak_siswa_disiplin.png** (~20×20px)
    - ID: `streak_siswa_disiplin`
    - Nama: "Siswa Disiplin"
    - Emoji asli: 🔥
    - Kategori: Streak (30 hari)

15. **icon_achievement_streak_master.png** (~20×20px)
    - ID: `streak_master`
    - Nama: "Streak Master"
    - Emoji asli: ⭐
    - Kategori: Streak (60 hari)

16. **icon_achievement_streak_legend.png** (~20×20px)
    - ID: `streak_legend`
    - Nama: "Streak Legend"
    - Emoji asli: 💫
    - Kategori: Streak (100 hari)

#### Quote Achievements (4 icon)

17. **icon_achievement_quote_pencatat_kata.png** (~20×20px)
    - ID: `quote_pencatat_kata`
    - Nama: "Pencatat Kata"
    - Emoji asli: 📝
    - Kategori: Quote (5 quotes)

18. **icon_achievement_quote_collector.png** (~20×20px)
    - ID: `quote_collector`
    - Nama: "Quote Collector"
    - Emoji asli: 💬
    - Kategori: Quote (10 quotes)

19. **icon_achievement_quote_king.png** (~20×20px)
    - ID: `quote_king`
    - Nama: "Quote King"
    - Emoji asli: 👑
    - Kategori: Quote (25 quotes)

20. **icon_achievement_quote_master.png** (~20×20px)
    - ID: `quote_master`
    - Nama: "Quote Master"
    - Emoji asli: ⭐
    - Kategori: Quote (50 quotes)

#### Message Achievements (5 icon)

21. **icon_achievement_message_murid_aktif.png** (~20×20px)
    - ID: `message_murid_aktif`
    - Nama: "Murid Aktif"
    - Emoji asli: 💬
    - Kategori: Message (1k pesan)

22. **icon_achievement_message_siswa_komunikatif.png** (~20×20px)
    - ID: `message_siswa_komunikatif`
    - Nama: "Siswa Komunikatif"
    - Emoji asli: 🗣️
    - Kategori: Message (5k pesan)

23. **icon_achievement_message_chat_master.png** (~20×20px)
    - ID: `message_chat_master`
    - Nama: "Chat Master"
    - Emoji asli: 📢
    - Kategori: Message (10k pesan)

24. **icon_achievement_message_chat_legend.png** (~20×20px)
    - ID: `message_chat_legend`
    - Nama: "Chat Legend"
    - Emoji asli: ⭐
    - Kategori: Message (25k pesan)

25. **icon_achievement_message_chat_god.png** (~20×20px)
    - ID: `message_chat_god`
    - Nama: "Chat God"
    - Emoji asli: 💫
    - Kategori: Message (50k pesan)

#### Voice Streak Achievements (4 icon)

26. **icon_achievement_voice_streak_best_friend.png** (~20×20px)
    - ID: `voice_streak_best_friend`
    - Nama: "Best Friend"
    - Emoji asli: 💕
    - Kategori: Voice Streak (5 hari)

27. **icon_achievement_voice_streak_soulmate.png** (~20×20px)
    - ID: `voice_streak_soulmate`
    - Nama: "Soulmate"
    - Emoji asli: ❤️
    - Kategori: Voice Streak (10 hari)

28. **icon_achievement_voice_streak_couple_goals.png** (~20×20px)
    - ID: `voice_streak_couple_goals`
    - Nama: "Couple Goals"
    - Emoji asli: 💑
    - Kategori: Voice Streak (20 hari)

29. **icon_achievement_voice_streak_power_couple.png** (~20×20px)
    - ID: `voice_streak_power_couple`
    - Nama: "Power Couple"
    - Emoji asli: ⭐
    - Kategori: Voice Streak (50 hari)

#### Default/Fallback (1 icon)

30. **icon_achievement_default.png** (~20×20px)
    - Untuk: Fallback jika achievement tidak punya icon
    - Emoji asli: ★
    - Default icon untuk achievement

---

## 📊 RINGKASAN

### Total Icon yang Dibutuhkan: **38 icon**

- **Icon Title**: 2 icon (20×20px)
- **Icon Stats Sidebar**: 6 icon (24×24px)
- **Icon Achievement**: 29 icon (~20×20px efektif) + 1 default = 30 icon

---

## 📁 Struktur Folder yang Disarankan

```
assets/
  icons/
    title/
      icon_stats.png (20×20)
      icon_trophy.png (20×20)
    stats/
      icon_microphone.png (24×24)
      icon_message.png (24×24)
      icon_star.png (24×24)
      icon_quote.png (24×24)
      icon_fire.png (24×24)
      icon_default.png (24×24)
    achievements/
      icon_achievement_voice_murid_baru.png (~20×20)
      icon_achievement_voice_siswa_aktif.png (~20×20)
      icon_achievement_voice_enthusiast.png (~20×20)
      icon_achievement_voice_ketua.png (~20×20)
      icon_achievement_voice_master.png (~20×20)
      icon_achievement_voice_legend.png (~20×20)
      icon_achievement_prestasi_siswa_biasa.png (~20×20)
      icon_achievement_prestasi_berprestasi.png (~20×20)
      icon_achievement_prestasi_emas.png (~20×20)
      icon_achievement_prestasi_platinum.png (~20×20)
      icon_achievement_prestasi_diamond.png (~20×20)
      icon_achievement_streak_tidak_bolos.png (~20×20)
      icon_achievement_streak_rajin_absen.png (~20×20)
      icon_achievement_streak_siswa_disiplin.png (~20×20)
      icon_achievement_streak_master.png (~20×20)
      icon_achievement_streak_legend.png (~20×20)
      icon_achievement_quote_pencatat_kata.png (~20×20)
      icon_achievement_quote_collector.png (~20×20)
      icon_achievement_quote_king.png (~20×20)
      icon_achievement_quote_master.png (~20×20)
      icon_achievement_message_murid_aktif.png (~20×20)
      icon_achievement_message_siswa_komunikatif.png (~20×20)
      icon_achievement_message_chat_master.png (~20×20)
      icon_achievement_message_chat_legend.png (~20×20)
      icon_achievement_message_chat_god.png (~20×20)
      icon_achievement_voice_streak_best_friend.png (~20×20)
      icon_achievement_voice_streak_soulmate.png (~20×20)
      icon_achievement_voice_streak_couple_goals.png (~20×20)
      icon_achievement_voice_streak_power_couple.png (~20×20)
      icon_achievement_default.png (~20×20)
```

---

## 🎨 Tips Desain Icon

1. **Format**: PNG dengan transparansi (alpha channel)
2. **Warna**: Icon akan ditampilkan dalam warna putih (#FFFFFF), jadi pastikan icon terlihat jelas
3. **Detail**: Karena ukuran kecil (20-24px), hindari detail yang terlalu kompleks
4. **Kontras**: Pastikan icon memiliki kontras yang baik untuk visibility
5. **Style**: Konsisten dalam style semua icon untuk tampilan yang seragam

---

## 📝 Catatan Penting

- Icon achievement saat ini menggunakan emoji yang di-render sebagai text
- Untuk mengganti dengan file gambar, perlu modifikasi di `drawBadgesEnhanced()` function
- Achievement icon menggunakan `badge.emoji` dari achievement definition
- Untuk menggunakan file gambar, perlu mapping dari achievement ID ke file path icon




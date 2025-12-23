# Welcomer Bot - Discord Bot

Discord bot dengan fitur lengkap untuk komunitas sekolah yang santai dan friendly.

## Fitur

- 🎉 **Welcome & Goodbye Images** - Custom welcome/goodbye cards dengan avatar dan text
- 📊 **Leveling System** - XP dan level berdasarkan aktivitas chat
- 🔥 **Voice Pair Streak** - Tracking streak voice bersama teman (min 55 menit/hari, 3 hari berturut-turut)
- 🎫 **Ticket System** - Sistem tiket dengan kategori (Laporan, Partnership, Saran, Banding, Verifikasi)
- 💡 **Suggestion Box** - Sistem saran dengan voting dan status tracking
- 📝 **Daily Attendance** - Sistem absen harian dengan streak
- 🎓 **Kartu Pelajar** - Generate kartu pelajar otomatis
- 📈 **Leaderboard** - Ranking berdasarkan XP
- 🎮 **Menfess** - Fitur menfess anonim
- 🖼️ **Web Dashboard** - Dashboard untuk adjust image settings (welcome, goodbye, kartu pelajar, voice streak)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` ke `.env` dan isi dengan token bot:
```bash
cp .env.example .env
```

3. Edit `config.json` sesuai kebutuhan server

4. Deploy slash commands:
```bash
node deploy-commands.js
```

5. Start bot:
```bash
npm start
```

Atau dengan PM2:
```bash
npm run start:prod
```

## Commands

### Slash Commands
- `/absen` - Absen harian
- `/leaderboard` - Lihat ranking
- `/rank` - Lihat rank kamu
- `/setup` - Setup bot (admin only)
- Dan lainnya...

### Prefix Commands
- `!saran <text>` - Buat saran
- `!ticketbox` - Post ticket panel (admin only)
- `!vstreak [@user]` - Cek voice streak
- `!teststreak @user1 @user2 [streak]` - Test streak notification (admin/staff)
- `!purge <jumlah>` - Hapus pesan (staff)
- `!slowmode <detik>` - Set slowmode (staff)
- `!say <text>` - Bot kirim pesan (staff)
- `!setlevel @user <level>` - Set level user (staff)
- `!setxp @user <xp>` - Set XP user (staff)
- `!streak` - Cek daily streak
- Dan lainnya...

## Web Dashboard

Jalankan dashboard untuk adjust image settings:
```bash
node dashboard.js
```

Buka `http://localhost:3000` di browser.

## License

ISC







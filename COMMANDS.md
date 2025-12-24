# 📋 Daftar Command Bot

## 🎯 Slash Commands (Global)

### 1. `/absen`
- **Deskripsi**: Absen harian untuk mendapatkan XP tambahan
- **Penggunaan**: `/absen`
- **Channel**: Hanya di channel tertentu (ID: 1445442876426293388)
- **Fitur**: 
  - Memberikan XP harian
  - Menampilkan streak harian
  - Auto-delete setelah 5 detik

### 2. `/help`
- **Deskripsi**: Tampilkan informasi bantuan server
- **Penggunaan**: `/help`
- **Fitur**: Menampilkan embed dengan info rules, role, denah, dll

### 3. `/leaderboard`
- **Deskripsi**: Lihat top 100 member dengan level tertinggi
- **Penggunaan**: `/leaderboard`
- **Fitur**: 
  - Generate gambar leaderboard
  - Top 100 ranking

### 4. `/rank`
- **Deskripsi**: Lihat kartu level kamu atau member lain
- **Penggunaan**: `/rank [target]`
- **Options**:
  - `target` (optional): Member yang ingin dicek
- **Fitur**: Generate kartu rank dengan avatar dan statistik

### 5. `/menfess`
- **Deskripsi**: Kirim menfess baru (akan memunculkan pop-up)
- **Penggunaan**: `/menfess`
- **Fitur**: 
  - Modal form untuk menfess
  - Timeout system
  - Auto-post ke channel menfess

### 6. `/setup`
- **Deskripsi**: Atur konfigurasi bot (admin only)
- **Penggunaan**: `/setup [subcommand]`
- **Permission**: Administrator
- **Subcommands**:
  - `show` - Lihat ringkasan konfigurasi yang aktif
  - `suggestion` - Set channel & role staff untuk Kotak Saran
    - Options: `channel`, `staff_role`
  - `ticket` - Set kategori tiket & role staff untuk Ticket Box
    - Options: `category`, `staff_role`
  - `utilities` - Set role staff untuk utility commands
    - Options: `staff_role`

### 7. `/resetabsen`
- **Deskripsi**: Reset absen harian (admin)
- **Penggunaan**: `/resetabsen [user]`
- **Permission**: Administrator
- **Options**:
  - `user` (optional): User yang akan di-reset

### 8. `/resetabsenall`
- **Deskripsi**: Reset absen semua user (admin)
- **Penggunaan**: `/resetabsenall`
- **Permission**: Administrator

### 9. `/selfrole`
- **Deskripsi**: Self-role system
- **Penggunaan**: `/selfrole`
- **Fitur**: Memberikan role otomatis

### 10. `/selfgame`
- **Deskripsi**: Self-game role system
- **Penggunaan**: `/selfgame`
- **Fitur**: Memberikan game role

### 11. `/inputdata`
- **Deskripsi**: Input data (admin)
- **Penggunaan**: `/inputdata`
- **Permission**: Administrator

### 12. `/controlpanel`
- **Deskripsi**: Control panel (admin)
- **Penggunaan**: `/controlpanel`
- **Permission**: Administrator

### 13. `/setupkartu`
- **Deskripsi**: Setup kartu pelajar (admin)
- **Penggunaan**: `/setupkartu`
- **Permission**: Administrator

---

## 💬 Prefix Commands (Message Commands)

### 1. `!hadir`
- **Deskripsi**: Absen harian (alternatif dari `/absen`)
- **Penggunaan**: `!hadir`
- **Channel**: Hanya di channel tertentu (ID: 1445442876426293388)
- **Fitur**: Sama seperti `/absen`

### 2. `!streak`
- **Deskripsi**: Cek daily streak kamu
- **Penggunaan**: `!streak`
- **Fitur**: Menampilkan streak harian absen

### 3. `!vstreak` / `!vstreak @user`
- **Deskripsi**: Cek voice pair streak
- **Penggunaan**: 
  - `!vstreak` - Lihat top 5 voice streak kamu
  - `!vstreak @user` - Cek streak dengan user tertentu
- **Fitur**: 
  - Menampilkan streak voice bersama
  - Top pairs per user (max 5)

### 4. `!teststreak @user1 @user2 [streak]`
- **Deskripsi**: Test streak notification (admin/staff)
- **Penggunaan**: `!teststreak @user1 @user2 5`
- **Permission**: Admin atau Staff role
- **Fitur**: 
  - Generate test notification dengan card
  - Default streak: 5 (jika tidak disebutkan)

### 5. `!saran <text>`
- **Deskripsi**: Buat saran baru
- **Penggunaan**: `!saran <isi saran>`
- **Fitur**: 
  - Post saran ke channel suggestion
  - Voting system (upvote/downvote)
  - Status management (staff)

### 6. `!ticketbox`
- **Deskripsi**: Post ticket panel (admin)
- **Penggunaan**: `!ticketbox`
- **Permission**: Administrator
- **Fitur**: 
  - Post panel dengan 5 tombol:
    - Laporan
    - Partnership
    - Saran/Masukan (trigger modal)
    - Banding
    - Verifikasi Cewek

### 7. `!purge <jumlah>`
- **Deskripsi**: Hapus pesan dalam jumlah tertentu (staff)
- **Penggunaan**: `!purge 10`
- **Permission**: Staff role
- **Fitur**: 
  - Hapus pesan (max 100)
  - Auto-delete command setelah 5 detik

### 8. `!slowmode <detik>`
- **Deskripsi**: Set slowmode channel (staff)
- **Penggunaan**: `!slowmode 5`
- **Permission**: Staff role
- **Fitur**: 
  - Set slowmode (0-21600 detik)
  - Auto-delete command setelah 5 detik

### 9. `!say <text>`
- **Deskripsi**: Bot kirim pesan (staff)
- **Penggunaan**: `!say <pesan>`
- **Permission**: Staff role
- **Fitur**: 
  - Bot mengirim pesan sebagai bot
  - Auto-delete command setelah 5 detik

### 10. `!setlevel @user <level>`
- **Deskripsi**: Set level user (staff)
- **Penggunaan**: `!setlevel @user 10`
- **Permission**: Staff role
- **Fitur**: 
  - Set level user secara manual
  - Auto-delete command setelah 5 detik

### 11. `!setxp @user <xp>`
- **Deskripsi**: Set XP user (staff)
- **Penggunaan**: `!setxp @user 1000`
- **Permission**: Staff role
- **Fitur**: 
  - Set XP user secara manual
  - Auto-delete command setelah 5 detik

### 12. `s3!help`
- **Deskripsi**: Help command (alternatif)
- **Penggunaan**: `s3!help`
- **Fitur**: Menampilkan embed help

---

## 🎫 Ticket System (Button Interactions)

### Tombol di Ticket Panel:
1. **Laporan** - Buat ticket untuk laporan
2. **Partnership** - Buat ticket untuk partnership
3. **Saran/Masukan** - Trigger modal untuk saran
4. **Banding** - Buat ticket untuk banding
5. **Verifikasi Cewek** - Buat ticket untuk verifikasi

### Tombol di Ticket:
- **Close Ticket** - Tutup ticket (owner atau staff)
- **Auto-close** - Ticket otomatis tutup setelah 24 jam

---

## 💡 Suggestion System (Button Interactions)

### Tombol di Suggestion:
- **⬆️ Upvote** - Vote positif
- **⬇️ Downvote** - Vote negatif
- **Status Menu** - Ubah status (Pending, Approved, Rejected, Implemented) - Staff only

---

## 📝 Setup yang Perlu Dilakukan

### 1. Environment Variables (.env)
```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_bot_client_id
GUILD_ID=your_guild_id
```

### 2. Deploy Commands
```bash
node deploy-commands.js
```

### 3. Setup via Discord
- Gunakan `/setup` untuk konfigurasi:
  - `/setup suggestion` - Set channel & role untuk suggestion
  - `/setup ticket` - Set category & role untuk ticket
  - `/setup utilities` - Set role untuk utility commands

### 4. Post Ticket Panel
- Gunakan `!ticketbox` di channel yang diinginkan (admin only)

---

## 🔧 Test Commands (Development)

Commands berikut untuk testing (bisa dihapus di production):
- `/testwelcome`
- `/testgoodbye`
- `/testlevelup`
- `/testinvite`
- `/testgeneralwelcome`

---

## 📌 Catatan Penting

1. **Channel Restrictions**: 
   - `/absen` dan `!hadir` hanya bisa digunakan di channel tertentu (ID: 1445442876426293388)

2. **Permissions**:
   - Admin: `/setup`, `/resetabsen`, `/resetabsenall`, `!ticketbox`
   - Staff: `!purge`, `!slowmode`, `!say`, `!setlevel`, `!setxp`, `!teststreak`, suggestion status management

3. **Auto-delete**: 
   - Beberapa command auto-delete setelah beberapa detik untuk menjaga kebersihan chat

4. **Voice Streak**:
   - Minimal 55 menit/hari di voice channel yang sama
   - 3 hari berturut-turut untuk menjadi "active"
   - Maksimal 5 active pairs per user
   - Streak gugur jika bolong lebih dari 24 jam










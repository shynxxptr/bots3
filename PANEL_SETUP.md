# 🎛️ Panduan Setup Panel & Menu

Dokumentasi lengkap cara memunculkan semua panel dan menu di bot.

---

## 🎫 1. Ticket Panel

### Cara Munculkan:
```
!ticketbox
```
- **Permission**: Admin only
- **Channel**: Bisa di channel manapun
- **Fitur**: 
  - Auto-delete command setelah panel terkirim
  - Panel dengan 7 tombol:
    - 🧑‍🏫 **BK** (Curhat/konflik)
    - 🧾 **TU** (Pertanyaan server)
    - 🚨 **Lapor** (Report)
    - 🤝 **Partnership**
    - 🧑‍⚖️ **Banding**
    - 💡 **Saran/Masukan** (trigger modal, otomatis masuk kotak saran)
    - 🎀 **Verifikasi Cewek**

### Setup Sebelumnya:
1. Jalankan `/setup ticket` di Discord
2. Pilih **category** (tempat channel ticket dibuat)
3. Pilih **staff_role** (role yang bisa akses semua ticket)

### Contoh:
```
!ticketbox
```
→ Panel akan muncul di channel tersebut dengan semua tombol

---

## 🎓 2. Self-Role Menu (Jurusan)

### Cara Munculkan:
```
/selfrole
```
- **Permission**: Admin only
- **Channel**: Bisa di channel manapun
- **Fitur**: 
  - Dropdown menu untuk pilih jurusan
  - Hanya bisa pilih 1 jurusan
  - Auto-update role

### Setup Sebelumnya:
Edit `config.json`, tambahkan:
```json
{
  "selfRoles": [
    {
      "label": "Teknik Informatika",
      "description": "Jurusan IT",
      "value": "role_id_here",
      "emoji": "💻"
    },
    {
      "label": "Teknik Mesin",
      "description": "Jurusan Mesin",
      "value": "role_id_here",
      "emoji": "⚙️"
    }
  ]
}
```

### Contoh:
```
/selfrole
```
→ Menu dropdown akan muncul dengan pilihan jurusan

---

## 🎮 3. Self-Game Menu (Game Roles)

### Cara Munculkan:
```
/selfgame
```
- **Permission**: Admin only
- **Channel**: Bisa di channel manapun
- **Fitur**: 
  - Dropdown menu untuk pilih game
  - Bisa pilih lebih dari 1 game
  - Ada opsi "Hapus Semua Role Game"

### Setup Sebelumnya:
Edit `config.json`, tambahkan:
```json
{
  "gameRoles": [
    {
      "label": "Mobile Legends",
      "description": "Game MLBB",
      "value": "role_id_here",
      "emoji": "📱"
    },
    {
      "label": "Valorant",
      "description": "Game Valorant",
      "value": "role_id_here",
      "emoji": "🔫"
    }
  ]
}
```

### Contoh:
```
/selfgame
```
→ Menu dropdown akan muncul dengan pilihan game

---

## 🆔 4. Kartu Pelajar Panel

### Cara Munculkan:
```
/setupkartu
```
- **Permission**: Admin only
- **Channel**: Bisa di channel manapun
- **Fitur**: 
  - Panel dengan tombol "Buat Kartu Pelajar"
  - Klik tombol → modal form untuk input data
  - Generate kartu pelajar otomatis

### Setup Sebelumnya:
1. Pastikan background image sudah ada di `assets/`:
   - `kartu_pelajar_template.png` (untuk cowok)
   - `kartu_pelajar_cewe.png` (untuk cewek)
2. Setup via `/setup` atau edit `config.json` untuk:
   - Class roles (X, XI, XII)
   - Student role IDs
   - Avatar positions
   - Text field positions

### Contoh:
```
/setupkartu
```
→ Panel dengan tombol akan muncul, user klik → modal form

---

## 🛡️ 5. Control Panel (Menfess Management)

### Cara Munculkan:
```
/controlpanel manage @user
```
atau
```
/controlpanel check_status
```
- **Permission**: Mod/Staff (cek di `config.json` → `menfess.modRoleId`)
- **Channel**: Bisa di channel manapun
- **Subcommands**:
  - `manage @user` - Panel kontrol untuk user tertentu
    - Tombol: Timeout 1 Jam, 1 Hari, 1 Minggu, Permanen, Cabut Timeout
  - `check_status` - Lihat daftar user yang sedang timeout

### Setup Sebelumnya:
Edit `config.json`, tambahkan:
```json
{
  "menfess": {
    "modRoleId": "role_id_staff_here"
  }
}
```

### Contoh:
```
/controlpanel manage @user123
```
→ Panel kontrol akan muncul (ephemeral, hanya admin yang lihat)

---

## 📋 Ringkasan Setup

### 1. Ticket Panel
```bash
# Setup dulu
/setup ticket

# Munculkan panel
!ticketbox
```

### 2. Self-Role Menu
```bash
# Edit config.json dulu (tambah selfRoles)
# Lalu munculkan
/selfrole
```

### 3. Self-Game Menu
```bash
# Edit config.json dulu (tambah gameRoles)
# Lalu munculkan
/selfgame
```

### 4. Kartu Pelajar
```bash
# Setup dulu (background images, config)
# Lalu munculkan
/setupkartu
```

### 5. Control Panel
```bash
# Edit config.json dulu (tambah menfess.modRoleId)
# Lalu munculkan
/controlpanel manage @user
```

---

## ⚙️ Setup via Discord (Recommended)

### Setup Ticket:
```
/setup ticket
```
- Pilih **category** (tempat ticket dibuat)
- Pilih **staff_role** (role yang bisa akses ticket)

### Setup Suggestion:
```
/setup suggestion
```
- Pilih **channel** (tempat saran diposting)
- Pilih **staff_role** (role yang bisa ubah status saran)

### Setup Utilities:
```
/setup utilities
```
- Pilih **staff_role** (role untuk command: purge, slowmode, say, setlevel, setxp)

---

## 📝 Setup via config.json (Manual)

### Self-Role:
```json
{
  "selfRoles": [
    {
      "label": "Nama Jurusan",
      "description": "Deskripsi",
      "value": "role_id_discord",
      "emoji": "🎓"
    }
  ]
}
```

### Game Roles:
```json
{
  "gameRoles": [
    {
      "label": "Nama Game",
      "description": "Deskripsi",
      "value": "role_id_discord",
      "emoji": "🎮"
    }
  ]
}
```

### Menfess Mod:
```json
{
  "menfess": {
    "modRoleId": "role_id_staff"
  }
}
```

---

## 🎯 Urutan Setup yang Disarankan

1. **Setup Ticket** → `/setup ticket` → `!ticketbox`
2. **Setup Suggestion** → `/setup suggestion` → User pakai `!saran`
3. **Setup Utilities** → `/setup utilities` → Staff bisa pakai utility commands
4. **Setup Self-Role** → Edit `config.json` → `/selfrole`
5. **Setup Self-Game** → Edit `config.json` → `/selfgame`
6. **Setup Kartu Pelajar** → Edit `config.json` + upload images → `/setupkartu`
7. **Setup Control Panel** → Edit `config.json` → `/controlpanel`

---

## ⚠️ Catatan Penting

1. **Permission**: 
   - Admin: Semua panel
   - Staff: Control panel (jika sudah di-setup)

2. **Auto-delete**: 
   - Command `!ticketbox` auto-delete setelah panel terkirim
   - Command lainnya tetap ada (bisa dihapus manual)

3. **Ephemeral**: 
   - Control panel muncul sebagai ephemeral (hanya admin yang lihat)
   - Panel lainnya public (semua bisa lihat)

4. **Config Reload**: 
   - Setelah edit `config.json`, restart bot untuk apply perubahan
   - Atau gunakan `/setup` untuk update tanpa restart

---

## 🔄 Update Panel

Jika ingin update panel yang sudah ada:
1. Hapus panel lama (delete message)
2. Jalankan command lagi untuk munculkan panel baru
3. Atau edit `config.json` lalu restart bot

---

## 📞 Troubleshooting

### Panel tidak muncul?
- Cek permission (harus admin)
- Cek apakah setup sudah dilakukan
- Cek console untuk error

### Button tidak bekerja?
- Pastikan bot online
- Cek `interactionCreate.js` untuk handler
- Restart bot jika perlu

### Role tidak ter-assign?
- Cek role ID di `config.json`
- Pastikan bot punya permission "Manage Roles"
- Pastikan role bot lebih tinggi dari role yang di-assign










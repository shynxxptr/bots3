# ✅ Production Setup Checklist

Checklist lengkap untuk setup bot di VPS/production.

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
- [ ] Buat file `.env` dari `.env.example`
- [ ] Isi `DISCORD_TOKEN` (dari Discord Developer Portal)
- [ ] Isi `CLIENT_ID` (dari Discord Developer Portal)
- [ ] Isi `GUILD_ID` (ID server Discord)
- [ ] Pastikan `.env` ada di `.gitignore` (tidak ter-commit)

### 2. Dependencies
- [ ] Install Node.js (v18 atau lebih baru)
- [ ] Install npm atau yarn
- [ ] Install PM2 (untuk production): `npm install -g pm2`
- [ ] Install dependencies: `npm install`

### 3. Bot Permissions
Pastikan bot punya permission berikut di Discord:
- [ ] **Administrator** (atau minimal):
  - Manage Channels
  - Manage Roles
  - Manage Messages
  - Send Messages
  - Embed Links
  - Attach Files
  - Read Message History
  - Use External Emojis
  - Connect (untuk voice streak tracking)
  - Speak (untuk voice streak tracking)

### 4. Config.json Setup
- [ ] Edit `config.json` sesuai server:
  - [ ] Channel IDs
  - [ ] Role IDs
  - [ ] Image paths
  - [ ] Embed colors
  - [ ] Self roles
  - [ ] Game roles
  - [ ] Voice streak settings

### 5. Assets/Images
- [ ] Upload background images ke folder `assets/`:
  - [ ] `template.png` (welcome)
  - [ ] `goodbye_template.png` (goodbye)
  - [ ] `kartu_pelajar_template.png` (kartu pelajar cowok)
  - [ ] `kartu_pelajar_cewe.png` (kartu pelajar cewek)
  - [ ] `stamp.png` (stamp image)
  - [ ] `logo.png` (logo)
  - [ ] `checklist.png` (checklist icon)

### 6. Data Directories
- [ ] Pastikan folder `data/` ada
- [ ] File `data/.gitkeep` sudah ada
- [ ] Data files akan dibuat otomatis saat bot jalan

---

## 🚀 Deployment Steps

### Step 1: Clone & Setup
```bash
# Clone repository
git clone https://github.com/shynxxptr/bots3.git
cd bots3

# Install dependencies
npm install

# Buat .env
cp .env.example .env
nano .env  # Edit dengan token, client ID, guild ID
```

### Step 2: Deploy Commands
```bash
# Deploy slash commands ke Discord
node deploy-commands.js
```

### Step 3: Setup via Discord
Jalankan di Discord (sebagai admin):
- [ ] `/setup suggestion` - Set channel & staff role untuk suggestion
- [ ] `/setup ticket` - Set category & staff role untuk ticket
- [ ] `/setup utilities` - Set staff role untuk utility commands
- [ ] `/setup show` - Cek semua konfigurasi

### Step 4: Post Panels
- [ ] `!ticketbox` - Post ticket panel di channel yang diinginkan
- [ ] `/selfrole` - Post self-role menu (jika sudah di-setup di config.json)
- [ ] `/selfgame` - Post self-game menu (jika sudah di-setup di config.json)
- [ ] `/setupkartu` - Post kartu pelajar panel (jika sudah di-setup)

### Step 5: Start Bot
```bash
# Dengan PM2 (recommended untuk production)
npm run start:prod

# Atau manual
npm start

# Cek status
pm2 status
pm2 logs welcomer-bot
```

---

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Bot online dan connected
- [ ] Slash commands muncul di Discord
- [ ] `/help` command bekerja
- [ ] `/absen` atau `!hadir` bekerja
- [ ] Welcome message muncul saat member join
- [ ] Goodbye message muncul saat member leave

### Leveling System
- [ ] XP bertambah saat chat
- [ ] Level up notification muncul
- [ ] `/rank` generate kartu level
- [ ] `/leaderboard` menampilkan ranking

### Voice Streak
- [ ] Voice streak tracking aktif (cek di console)
- [ ] Notifikasi streak muncul di channel yang di-setup
- [ ] `!vstreak` command bekerja
- [ ] `!teststreak` command bekerja (admin/staff)

### Ticket System
- [ ] Ticket panel muncul setelah `!ticketbox`
- [ ] Tombol ticket membuat channel private
- [ ] Close ticket button bekerja
- [ ] Auto-close setelah 24 jam bekerja

### Suggestion System
- [ ] `!saran` command bekerja
- [ ] Saran muncul di channel yang di-setup
- [ ] Voting buttons bekerja
- [ ] Status menu bekerja (staff)

### Other Features
- [ ] `/menfess` command bekerja
- [ ] Kartu pelajar generate dengan benar
- [ ] Self-role menu bekerja (jika di-setup)
- [ ] Self-game menu bekerja (jika di-setup)

---

## 🔧 Production Best Practices

### 1. PM2 Configuration
- [ ] PM2 sudah terinstall
- [ ] `ecosystem.config.js` sudah benar
- [ ] Auto-restart on crash enabled
- [ ] Logs di-monitor

### 2. Security
- [ ] `.env` file tidak ter-commit ke Git
- [ ] Token bot tidak di-share
- [ ] Bot permissions minimal (jika tidak pakai Administrator)
- [ ] Staff roles sudah di-setup dengan benar

### 3. Monitoring
- [ ] Setup log monitoring (PM2 logs)
- [ ] Monitor bot uptime
- [ ] Monitor error logs
- [ ] Setup alerts jika bot down

### 4. Backup
- [ ] Backup `config.json` secara berkala
- [ ] Backup `data/*.json` secara berkala
- [ ] Setup auto-backup jika perlu

### 5. Updates
- [ ] Setup cron job untuk auto-pull (optional)
- [ ] Atau manual pull dan restart setelah update
- [ ] Test update di staging dulu (jika ada)

---

## 📝 Post-Deployment

### 1. Verify Everything Works
- [ ] Test semua command utama
- [ ] Test semua fitur utama
- [ ] Cek error logs
- [ ] Monitor bot untuk beberapa jam

### 2. Documentation
- [ ] Share command list ke member (via `/help`)
- [ ] Buat channel rules/guide jika perlu
- [ ] Dokumentasikan custom settings

### 3. Maintenance
- [ ] Schedule regular updates
- [ ] Monitor bot performance
- [ ] Backup data secara berkala
- [ ] Update dependencies secara berkala

---

## 🆘 Troubleshooting

### Bot tidak online?
- Cek `.env` file (token benar?)
- Cek internet connection
- Cek PM2 status: `pm2 status`
- Cek logs: `pm2 logs welcomer-bot`

### Commands tidak muncul?
- Jalankan `node deploy-commands.js` lagi
- Cek `CLIENT_ID` dan `GUILD_ID` di `.env`
- Tunggu beberapa menit (Discord cache)

### Error saat bot jalan?
- Cek logs: `pm2 logs welcomer-bot`
- Cek `config.json` (format JSON benar?)
- Cek permissions bot di Discord
- Cek file/folder yang diperlukan ada

### Images tidak muncul?
- Cek file di folder `assets/` ada
- Cek path di `config.json` benar
- Cek permissions file/folder

---

## 📞 Support

Jika ada masalah:
1. Cek logs: `pm2 logs welcomer-bot`
2. Cek dokumentasi: `README.md`, `COMMANDS.md`, `PANEL_SETUP.md`
3. Cek GitHub issues (jika ada)
4. Contact developer

---

## ✅ Final Checklist

Sebelum production:
- [ ] Semua checklist di atas sudah dicentang
- [ ] Bot sudah di-test dengan baik
- [ ] Semua fitur bekerja
- [ ] Monitoring sudah di-setup
- [ ] Backup sudah di-setup
- [ ] Documentation sudah lengkap

**Bot siap untuk production! 🚀**


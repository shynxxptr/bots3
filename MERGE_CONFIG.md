# 🔀 Cara Merge Config di VPS

Jika ada konflik saat `git pull` karena perubahan lokal di `config.json`, ikuti langkah berikut:

## Solusi 1: Stash & Merge (Recommended)

```bash
# 1. Backup config.json lokal dulu (safety first!)
cp config.json config.json.backup

# 2. Stash perubahan lokal
git stash

# 3. Pull dari remote
git pull origin main

# 4. Pop stash untuk merge
git stash pop

# 5. Jika ada konflik, edit config.json manual
# Merge perubahan dari remote dengan setting lokal kamu
nano config.json

# 6. Setelah selesai, commit merge
git add config.json
git commit -m "Merge local config with remote"
```

## Solusi 2: Manual Merge (Lebih Aman)

```bash
# 1. Backup config.json lokal
cp config.json config.json.local

# 2. Stash perubahan lokal
git stash

# 3. Pull dari remote
git pull origin main

# 4. Copy config dari remote ke file baru
cp config.json config.json.remote

# 5. Restore config lokal
cp config.json.local config.json

# 6. Edit config.json manual, gabungkan:
# - Setting dari config.json.local (yang sudah kamu set)
# - Perubahan baru dari config.json.remote (voicePairStreak.notifyChannelId)
nano config.json

# 7. Setelah selesai, commit
git add config.json
git commit -m "Merge local config with remote"
```

## Solusi 3: Force Overwrite (HATI-HATI!)

**Hanya jika kamu yakin tidak ada setting penting yang akan hilang!**

```bash
# 1. Backup dulu!
cp config.json config.json.backup

# 2. Discard perubahan lokal
git checkout -- config.json

# 3. Pull dari remote
git pull origin main

# 4. Edit config.json, tambahkan setting yang hilang dari backup
nano config.json
```

## Yang Perlu Di-merge

Pastikan config.json kamu punya:

1. **voicePairStreak** (dari remote):
```json
"voicePairStreak": {
    "notifyChannelId": "1451496074643509381"
}
```

2. **Setting lokal kamu** (yang sudah di-set di VPS):
   - Channel IDs
   - Role IDs
   - Image paths
   - dll

## Tips

- **Selalu backup** sebelum merge
- Gunakan `nano` atau `vim` untuk edit di VPS
- Setelah merge, test bot untuk pastikan semua setting masih benar










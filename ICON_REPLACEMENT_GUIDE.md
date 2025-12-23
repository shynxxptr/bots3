# Panduan Mengganti Icon dengan Icon Buatan Sendiri

## Fungsi Icon yang Perlu Diganti

### 1. **drawStatsIcon** (Icon untuk Title "Stats")
- **Ukuran**: 20px × 20px
- **Lokasi**: Baris 806 di `utils/profileCardRenderer.js`
- **Dipanggil di**: Baris 725
- **Fungsi**: Icon bar chart untuk title "Stats" di sidebar
- **Format yang direkomendasikan**: PNG dengan transparansi, warna putih (#FFFFFF)

### 2. **drawTrophyIcon** (Icon untuk Title "Achievements")
- **Ukuran**: 20px × 20px
- **Lokasi**: Baris 1008 di `utils/profileCardRenderer.js`
- **Dipanggil di**: Baris 453
- **Fungsi**: Icon trophy untuk title "Achievements"
- **Format yang direkomendasikan**: PNG dengan transparansi, warna putih (#FFFFFF)

### 3. **drawStatIcon** (Icon untuk Stat Items di Sidebar)
- **Ukuran**: 24px × 24px
- **Lokasi**: Baris 830 di `utils/profileCardRenderer.js`
- **Dipanggil di**: Baris 759 dengan `iconSize = 24`
- **Fungsi**: Icon utama yang memanggil icon spesifik berdasarkan stat ID

#### Icon-icon yang dipanggil oleh drawStatIcon:

##### 3a. **drawMicrophoneIcon** 
- Untuk: `voice_time` dan `voice_streak`
- Ukuran: 24px × 24px (base size, di-scale secara internal)
- Lokasi: Baris 864

##### 3b. **drawMessageIcon**
- Untuk: `messages`
- Ukuran: 24px × 24px
- Lokasi: Baris 880

##### 3c. **drawStarIcon**
- Untuk: `prestasi`
- Ukuran: 24px × 24px
- Lokasi: Baris 914

##### 3d. **drawQuoteIcon**
- Untuk: `quotes`
- Ukuran: 24px × 24px
- Lokasi: Baris 944

##### 3e. **drawFireIcon**
- Untuk: `streak`
- Ukuran: 24px × 24px
- Lokasi: Baris 965

##### 3f. **drawDefaultIcon**
- Untuk: Default (jika stat ID tidak dikenali)
- Ukuran: 24px × 24px
- Lokasi: Baris 998

---

## Cara Mengganti dengan Icon Image File (PNG/SVG)

### Opsi 1: Menggunakan File PNG/SVG (Recommended)

Jika Anda ingin menggunakan file gambar, Anda perlu:

1. **Siapkan icon files** (PNG dengan transparansi, atau SVG):
   - `icon_stats.png` - 20×20px
   - `icon_trophy.png` - 20×20px
   - `icon_microphone.png` - 24×24px
   - `icon_message.png` - 24×24px
   - `icon_star.png` - 24×24px
   - `icon_quote.png` - 24×24px
   - `icon_fire.png` - 24×24px
   - `icon_default.png` - 24×24px

2. **Simpan di folder**: `assets/icons/` (buat folder ini jika belum ada)

3. **Modifikasi fungsi** untuk load image:

```javascript
// Contoh untuk drawMicrophoneIcon
async function drawMicrophoneIcon(ctx, size) {
    try {
        const iconPath = path.join(__dirname, '../assets/icons/icon_microphone.png');
        const iconImage = await Canvas.loadImage(iconPath);
        
        // Draw icon dengan ukuran yang diinginkan
        const iconX = -size / 2;
        const iconY = -size / 2;
        ctx.drawImage(iconImage, iconX, iconY, size, size);
    } catch (err) {
        console.error('Error loading microphone icon:', err);
        // Fallback ke icon default atau shape sederhana
        ctx.fillRect(-size/4, -size/2, size/2, size);
    }
}
```

**Catatan**: Jika menggunakan async, fungsi yang memanggil juga harus async.

---

## Spesifikasi Ukuran Detail

### Icon Title (20px)
- **drawStatsIcon**: 20×20px
- **drawTrophyIcon**: 20×20px
- **Area rendering**: Sekitar 20×20px
- **Posisi**: Di sebelah kiri text title

### Icon Stats Sidebar (24px)
- **Semua icon stat**: 24×24px
- **Area rendering**: 24×24px (center-aligned)
- **Posisi**: Di sebelah kiri value stat

---

## Ukuran Canvas Internal

Saat ini, semua icon menggunakan sistem scale dengan base size 24px:
- `const scale = size / 24;`
- Icon digambar dengan koordinat yang di-scale

Jika Anda menggunakan file gambar, tidak perlu khawatir tentang scale ini - cukup load gambar dengan ukuran yang sesuai.

---

## Tips

1. **Warna**: Icon akan dirender dalam warna putih (#FFFFFF), jadi pastikan icon Anda terlihat jelas dengan warna putih atau gunakan gambar dengan transparansi yang baik.

2. **Format**: 
   - PNG dengan transparansi (recommended)
   - SVG bisa digunakan tapi perlu konversi ke PNG atau menggunakan library SVG renderer

3. **Background**: Icon akan memiliki background transparan, jadi pastikan icon Anda terlihat jelas di background glassmorphism card.

4. **Style**: Icon akan ditampilkan kecil (20-24px), jadi pastikan detail icon cukup jelas pada ukuran tersebut.

---

## Lokasi File untuk Disimpan

Saran struktur folder:
```
assets/
  icons/
    icon_stats.png (20×20)
    icon_trophy.png (20×20)
    icon_microphone.png (24×24)
    icon_message.png (24×24)
    icon_star.png (24×24)
    icon_quote.png (24×24)
    icon_fire.png (24×24)
    icon_default.png (24×24)
```

---

## Fungsi yang Perlu Dimodifikasi

1. `drawStatsIcon` - Baris ~806
2. `drawTrophyIcon` - Baris ~1008
3. `drawMicrophoneIcon` - Baris ~864
4. `drawMessageIcon` - Baris ~880
5. `drawStarIcon` - Baris ~914
6. `drawQuoteIcon` - Baris ~944
7. `drawFireIcon` - Baris ~965
8. `drawDefaultIcon` - Baris ~998

**Catatan Penting**: Jika Anda menggunakan file gambar, fungsi-fungsi ini perlu diubah menjadi `async function` dan fungsi yang memanggilnya juga harus `await`.



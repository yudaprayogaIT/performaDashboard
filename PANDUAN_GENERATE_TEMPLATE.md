# Panduan Generate Template Excel

## Masalah
Fitur download template Excel menampilkan error "File wasn't available on site"

## Solusi

### 1. Generate Template Excel

Jalankan command ini untuk membuat file template:

```bash
cd /var/www/html/performaDashboard
npm run generate:template
```

Atau:

```bash
cd /var/www/html/performaDashboard
node scripts/generate-templates.js
```

Command ini akan membuat 3 file template di folder `public/templates/`:
- template_upload_penjualan.xlsx
- template_upload_gross_margin.xlsx
- template_upload_retur.xlsx

### 2. Restart Next.js Server

Setelah generate template, Next.js perlu di-restart. Pilih salah satu cara:

#### Cara 1: Menggunakan PM2 (Recommended)

Jika Next.js dijalankan dengan PM2:

```bash
# Cari nama aplikasi
pm2 list

# Restart aplikasi (ganti 'performa-dashboard' dengan nama app Anda)
pm2 restart performa-dashboard
```

#### Cara 2: Menggunakan systemctl

Jika Next.js dijalankan sebagai service:

```bash
# Cari nama service
sudo systemctl list-units | grep -i next

# Restart service (ganti 'nextjs' dengan nama service Anda)
sudo systemctl restart nextjs
sudo systemctl restart performa-dashboard
```

#### Cara 3: Kill & Restart Manual

Jika dijalankan manual:

```bash
# Cari PID process Next.js
ps aux | grep "next start"

# Kill process (ganti PID_NUMBER dengan PID yang ditemukan)
kill PID_NUMBER

# Start ulang
cd /var/www/html/performaDashboard
npm start
```

### 3. Verifikasi Template Sudah Tersedia

Cek apakah file template bisa diakses:

```bash
# Cek file ada
ls -la /var/www/html/performaDashboard/public/templates/

# Cek permission (harus readable)
# Output seharusnya: -rw-rw-r--
```

### 4. Test Download di Browser

1. Buka halaman upload: `http://performa.ekatunggal.com/upload`
2. Klik tombol "Download Template"
3. Pilih salah satu template (Penjualan/Gross Margin/Retur)
4. File seharusnya terdownload

---

## Troubleshooting

### Template masih tidak bisa didownload setelah restart

Cek permission file:

```bash
cd /var/www/html/performaDashboard/public/templates/
chmod 644 *.xlsx
```

### Generate template gagal dengan error "No categories found"

Pastikan database sudah di-seed:

```bash
cd /var/www/html/performaDashboard
npm run db:seed
```

Lalu generate ulang template:

```bash
npm run generate:template
```

### Port 3001 sudah digunakan

Jika ada error port sudah digunakan:

```bash
# Cari process yang pakai port 3001
sudo lsof -i :3001

# Kill process tersebut
kill -9 PID_NUMBER
```

---

## Maintenance Rutin

Kapan perlu generate ulang template:

1. **Setelah tambah/ubah kategori produk** di database
2. **Setelah tambah/ubah lokasi** di Master Data
3. **Setelah update struktur template** di kode

Command yang dijalankan:

```bash
cd /var/www/html/performaDashboard
npm run generate:template
pm2 restart performa-dashboard  # atau cara restart lainnya
```

---

## Catatan Penting

- Template di-generate secara dinamis dari database
- File template tersimpan di `public/templates/`
- Setiap kali generate, file lama akan ditimpa
- Next.js perlu restart agar detect file baru
- Template berisi sheet: Petunjuk, Template Kosong, Contoh Data, dan Referensi

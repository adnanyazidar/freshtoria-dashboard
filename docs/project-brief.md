# BRIEF PENGEMBANGAN SISTEM: JUICE-SYNC ADMIN DASHBOARD
**Versi:** 1.0 (Final Draft)
**Tanggal:** 25 Februari 2026
**Status:** Ready for Development

---

## 1. RINGKASAN EKSEKUTIF
**Juice-Sync** adalah platform manajemen inventaris dan keuangan berbasis web yang dirancang untuk mengoptimalkan operasional harian usaha jus.

Sistem berfokus pada:

- Akurasi perhitungan stok bahan baku yang mudah rusak (perishable)
- Transparansi arus kas
- Monitoring laba bersih secara real-time
- Keamanan dan pelacakan perubahan data

Versi 1.0 ini merupakan versi MVP (Minimum Viable Product) yang lean, stabil, dan scalable untuk pengembangan tahap awal usaha.

---

## 2. TUJUAN PROYEK
* **Integritas Data:** 
- Perhitungan stok dan nilai aset dilakukan otomatis oleh sistem.
- Mencegah kesalahan perhitungan manual.
* **Transparansi Finansial:** 
- Menyediakan laporan laba rugi bulanan yang akurat dan omset bulanan.
- Menampilkan ringkasan profit/loss real-time.
* **Keamanan:** 
- Melacak setiap perubahan data melalui sistem Audit Trail.
- Mendukung kontrol akses berbasis peran (Role-Based Access).

---

## 3. SPESIFIKASI FITUR WAJIB

### A. Modul Manajemen Stok (Inventory)

📌 Konsep Sistem
- Sistem menggunakan model stok akumulatif berjalan (running total).
- Setiap transaksi stok masuk/keluar akan memperbarui total stok sebelumnya.
- Stok tidak menimpa data lama, melainkan dihitung secara kumulatif.

Tabel inventaris sebagai berikut:

| Kolom | Tipe | Ketentuan / Logika |
| :--- | :--- | :--- |
| **SKU_ID** | String | ID unik (Primary Key) |
| **Batch_ID** | String | Jika satu SKU punya tanggal expired berbeda |
| **Nama Barang** | String | Nama bahan baku jus (Wajib). |
| **Tanggal Masuk** | Date | Wajib. |
| **Stok Masuk** | Decimal | Hanya angka positif (≥ 0). |
| **Stok Keluar** | Decimal | Validasi: Tidak boleh melebihi stok tersedia. |
| **Stok Akhir** | **Otomatis** | StokAkhir: StokSebelumnya + StokMasuk − StokKeluar|
| **Harga Satuan** | Decimal | Format Rupiah (IDR). |
| **Total Nilai** | **Otomatis** | TotalNilai = StokAkhir × HargaSatuan |
| **Expired Date** | Date | Validasi: ≥ Tanggal Masuk |
| **Status** | **Otomatis** | Hampir Habis jika stok < 2, Tersedia jika stok >  2. |
| **Catetan** | String | Optional |

📌 Aturan Validasi
- Tidak boleh ada stok negatif.
- Expired Date tidak boleh lebih kecil dari Tanggal Masuk.
- Semua perubahan stok harus tercatat sebagai transaksi (bukan overwrite).

### B. Modul Omset & Cash Flow

📌 Konsep
- Setiap produksi dianggap sebagai satu batch.
- Batch memiliki tanggal masuk dan expired.
- Sistem menghitung potensi kerugian dari produk sisa.

Tabel Cash Flow sebagai berikut:

| Kolom | Tipe | Ketentuan / Logika |
| :--- | :--- | :--- |
| **id** | String | Primary Key. |
| **Menu Smoothies** | String | Nama varian produk jus/smoothies (Wajib diisi). |
| **Produksi (Botol)** | Decimal | Jumlah total botol yang diproduksi dalam satu batch (≥ 0). |
| **Terjual** | Decimal | Jumlah botol yang berhasil terjual (≤ Produksi). |
| **Produk Sisa** | **Otomatis** | Rumus: Produksi − Terjual |
| **Harga Produk** | Decimal | Harga jual per botol dalam Rupiah (IDR). |
| **Tanggal Masuk** | Date | Format DD/MM/YYYY (Tanggal distribusi ke Mitra) |
| **Expired Date** | Date | Format DD/MM/YYYY (Validasi: Harus > Tanggal Masuk) |
| **Mitra** | String | Nama pihak ketiga atau lokasi penitipan produk. |
| **Status** | **Otomatis** | - Expired (Merah) jika Today > Expired Date
- Habis (Biru) jika Sisa = 0
- Tersedia (Hijau) jika Sisa > 0 |
| **Total Payment** | **Otomatis** | Rumus: Terjual × Harga Produk |
| **Minus** | **Otomatis**  | Rumus: Produk Sisa × Harga Produk (Potensi kerugian) *Pastikan fitur Minus otomatis masuk ke laporan kerugian. |
| **Pengeluaran (HPP)** | Decimal | Biaya produksi batch. |

📌 Status Produk
- Expired (Merah) → Today > Expired Date
- Habis (Biru) → Produk Sisa = 0
- Tersedia (Hijau) → Produk Sisa > 0 dan belum expired

📌 Cash Management
* **Cash-In:** 
- Form pencatatan pendapatan penjualan harian. 
- Relasi ke batch atau manual entry
* **Cash-Out:** Form input pengeluaran operasional (Bahan baku, listrik, gaji).
* **Profit/Loss Widget:** Ringkasan real-time: `Total Pemasukan − Total Pengeluaran`.
Ditampilkan real-time di Dashboard.

### C. Analisis & Laporan
Fitur:
* Grafik perbandingan Pemasukan vs Pengeluaran (Line Chart).
* Grafik Produk Terlaris (Bar/Column Chart).
* Laporan stok bulanan  nilai inventaris tersisa.
* Laporan nilai inventaris tersisa.
* Ringkasan Laba Rugi Bulanan (Profit/Loss = Pemasukan - Pengeluaran).

Semua laporan dapat difilter berdasarkan:
- Rentang tanggal
- SKU
- Mitra (opsional)

### D. User Management
📌 Konsep Sistem
Modul ini berfungsi untuk mengelola kredensial dan hak akses setiap individu yang berinteraksi dengan sistem. Setiap akun terikat pada peran (role) tertentu untuk membatasi akses fitur sesuai tanggung jawab.

Tabel User Management sebagai berikut:
| Kolom | Tipe | Ketentuan / Logika |
| :--- | :--- | :--- |
| **User_ID** | String | ID unik (Primary Key) |
| **Nama Lengkap** | String | Nama asli pengguna. |
| **Username** | String | Unik, digunakan untuk login. |
| **Password** | String | Tersimpan dalam format hash (Bcrypt/Argon2). |
| **Role** | Enum | Admin (Akses penuh) atau Staff (Akses terbatas). |
| **Status** | Boolean | Aktif / Non-Aktif. |
| **Last Login** | DateTime | Mencatat waktu terakhir masuk ke sistem. |

📌 Fitur Keamanan Pengguna
1. Create New Account: Hanya peran Admin yang dapat membuat akun baru untuk menjaga integritas sistem.
2. Change Password: * Setiap pengguna dapat mengganti password mereka sendiri setelah verifikasi password lama.
    - Admin memiliki otoritas untuk reset password staff jika terjadi lupa password.
3. Session Management: Sesi akan otomatis berakhir jika tidak ada aktivitas selama periode tertentu (e.g., 2 jam) untuk mencegah akses tidak sah.
4. Tambahkan fitur "Soft Delete" (Status: Non-Aktif) alih-alih menghapus data user permanen untuk menjaga histori Audit Trail. 

---

### 4 Data Export
* **Export to Excel:** 
- Mengunduh kondisi stok saat ini .
- Digunakan untuk stok opname manual.

* **Export to PDF:** 
- Laporan keuangan siap cetak untuk arsip pemilik.
- Format profesional dengan:
    * Logo usaha
    * Periode laporan
    * Tanggal cetak
---

## 5. AUDIT TRAIL (WAJIB)
Sistem harus mencatat:
1. User yang melakukan aksi.
2. Jenis aksi (Create / Update / Delete).
3. Tanggal & waktu.
4. Data sebelum perubahan.
5. Data sesudah perubahan.
6. Nama modul (Inventory / Finance / User Management)
7. Target_User: Akun mana yang diubah (jika terjadi perubahan data user).
8. IP_Address: Lokasi akses untuk mendeteksi login mencurigakan.
9. Action_Type: Termasuk LOGIN_SUCCESS, LOGIN_FAILED, dan PASSWORD_CHANGE.

---

## 7. FITUR REKOMENDASI (EXPERT ADD-ONS)
1. **Recipe Management:** Otomasi potong stok bahan baku berdasarkan jumlah jus yang terjual.

---

## 8. SPESIFIKASI DESAIN UI/UX
* **Prinsip:** 
*Prinsip Mobile Responsive: Menggunakan sistem Fluid Grid. Pada tampilan Mobile, navigasi samping (Sidebar) akan berubah menjadi Hamburger Menu dan tabel akan menjadi kartu (cards) yang dapat di-scroll vertikal*, 
*High Contrast: * Stok Kritis: Background #FF0000 (Red) dengan Teks Putih. 
  - Stok Aman: Background #00C853 (Green) dengan Teks Putih., 
*Tipografi: Menggunakan font Inter untuk keterbacaan tinggi pada angka-angka keuangan.*
*Aksesibilitas: Rasio kontras teks memenuhi standar WCAG 2.1 untuk memastikan kenyamanan mata pengguna saat bekerja durasi lama.*

* **Navigasi:** 
  * Dashboard (Overview & Widget Profit/Loss)
  * Inventory (Stok, Input Barang, Export)
  * Finance (Cash-In, Cash-Out, Laporan Keuangan)
  * User Management (List User, Tambah Akun, Pengaturan Profile)
  * Audit Log (History)
  * Logout
  
* **USER FLOW (ALUR PENGGUNA)** 
  1. Login & Keamanan (Kritis) = User Input Username/Password -> Validasi Databas -> Generate JWT/Session Token-> Redirect ke Dashboard -> Update Last Login.
  
  2. Manajemen Inventaris (Minimum Click) = Dashboard > Klik Status Stok Rendah > Popup Edit Stok > Simpan. (Hanya 3 klik). 
---

## 9. NON-FUNCTIONAL REQUIREMENTS
1. Format tanggal: DD/MM/YYYY.
2. Timezone: Asia/Jakarta (UTC+7).
3. Semua data disimpan dalam format ISO di database.
4. Sistem harus mencegah race condition pada update stok.
5. Backup database harian.
6. Sistem harus scalable untuk penambahan fitur Phase 2

---

## 10. Future Roadmap
- Multi-Outlet Support.
- Smart Notification Notifikasi WhatsApp/Telegram saat stok kritis atau mendekati expired.
---
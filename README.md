# FitnessVals

Aplikasi pelacakan kebugaran, nutrisi, dan rekomendasi diet berbasis AI yang terdiri dari **REST API Backend (Go)**, **AI Engine lokal (Ollama)**, dan **Mobile App (Expo / React Native)**.

---

## Arsitektur Proyek

```text
FitnessVals-App/
├── main.go                 # Entry point server Go, loader .env, dan konfigurasi CORS
├── koneksi/                # Koneksi MySQL & GORM AutoMigrate
├── models/                 # Entitas GORM (User, MemberProfile, BMILog, NutritionLog, WorkoutLog)
├── repository/             # Layer akses database (UserRepository, WorkoutRepository)
├── service/                # Logika bisnis (AuthService, AIService + fallback engine)
├── controllers/            # HTTP handler Gin (Auth, Member, Workout, AI)
├── middleware/             # Autentikasi JWT & otorisasi berbasis role
├── routes/                 # Registrasi endpoint REST API (/api/*)
├── utils/                  # Utilitas JWT (GenerateToken & ValidateToken)
├── .env.example            # Template environment variable untuk backend Go
└── mobile-app/             # Aplikasi mobile & web berbasis Expo Router + TypeScript
    ├── src/app/            # Halaman (login, register, dan tab member)
    ├── src/context/        # State management autentikasi & profil (Zustand)
    ├── src/services/       # Klien HTTP Axios & service API
    └── .env.example        # Template EXPO_PUBLIC_API_URL untuk mobile app
```

### 1. Backend (Go + Gin + GORM + MySQL)
- **Framework Web**: Gin (`github.com/gin-gonic/gin`) dengan CORS middleware.
- **ORM & Database**: GORM (`gorm.io/gorm`) dengan driver MySQL (`gorm.io/driver/mysql`) dan auto-migration untuk model `User`, `MemberProfile`, `BMILog`, `NutritionLog`, dan `WorkoutLog`.
- **Keamanan**: Password di-hash menggunakan `bcrypt` dan autentikasi menggunakan JWT (`HS256`) melalui middleware `AuthMiddleware` dan `RequireRole`.

### 2. AI Engine (Ollama + Offline Fallback)
- Terintegrasi dengan Ollama REST API lokal (`OLLAMA_URL/api/generate`, default `http://127.0.0.1:11434`, model default `minicpm-v`).
- **Fitur AI**:
  - Rekomendasi menu makanan harian (Sarapan, Camilan, Makan Siang, Makan Malam) berdasarkan BMI, preferensi diet, riwayat medis, dan aktivitas latihan 24 jam terakhir.
  - Analisis foto makanan (`AnalyzeFoodImage`) via Ollama Vision untuk mendeteksi apakah gambar berupa makanan/minuman beserta estimasi kalori dan makronutrisi.
  - Estimasi nutrisi berbasis teks (`AnalyzeFoodText`) dan estimasi kalori terbakar untuk sesi latihan (`CalculateWorkoutCalories`).
- **Fallback Engine**: Jika Ollama lokal tidak aktif atau respons gagal diproses, `AIService` menyediakan estimasi offline berbasis kategori BMI, pencocokan kata kunci makanan, serta kalkulasi durasi/set-rep latihan (analisis gambar tetap membutuhkan Ollama aktif).

### 3. Mobile App (`mobile-app/`)
- **Stack**: Expo (`~54`), React Native (`0.81.5`), Expo Router (`~6`), TypeScript, NativeWind v4 / Tailwind CSS, Zustand, Axios, dan `react-native-gifted-charts`.
- **Fitur Layar**:
  - Autentikasi (`/login`, `/register`) dengan penyimpanan token di `AsyncStorage`.
  - **Dashboard** (`/(member)`): ringkasan target/konsumsi kalori harian dan grafik progres berat badan/BMI.
  - **Nutrition** (`/(member)/nutrition`): pencatatan log makan manual, prediksi nutrisi dari teks, dan pemindaian foto makanan.
  - **AI Meals** (`/(member)/ai-meals`): rekomendasi menu diet personal dari AI.
  - **Workout** (`/(member)/workout-logs`): pencatatan latihan *cardio* dan *weightlifting* beserta estimasi kalori terbakar.
  - **Profile** (`/(member)/profile`): pengelolaan tinggi/berat badan, usia, gender, target kalori harian (Mifflin-St Jeor), preferensi diet, dan riwayat medis.

---

## Daftar Endpoint API

| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Cek status server & ping koneksi MySQL |
| `POST` | `/api/auth/register` | Public | Registrasi akun member baru |
| `POST` | `/api/auth/login` | Public | Login dan mendapatkan JWT token |
| `GET` | `/api/users/profile` | Auth (`Bearer`) | Mengambil profil fisik, BMI, dan target kalori user |
| `PUT` | `/api/users/profile` | Auth (`Bearer`) | Memperbarui profil fisik & menyimpan riwayat BMI |
| `GET` | `/api/member/dashboard` | Member | Ringkasan kalori hari ini & 5 data BMI terakhir |
| `GET` | `/api/member/nutrition` | Member | Daftar riwayat log nutrisi |
| `POST` | `/api/member/nutrition` | Member | Tambah log konsumsi makanan |
| `GET` | `/api/member/meals/recommendations` | Member | Rekomendasi menu sehat dari AI / fallback |
| `POST` | `/api/member/meals/analyze` | Member | Analisis nutrisi dari foto makanan (`image_base64`) |
| `POST` | `/api/member/meals/analyze-text` | Member | Estimasi nutrisi dari nama makanan (`food_name`) |
| `GET` | `/api/member/workout-logs` | Member | Daftar riwayat latihan member |
| `POST` | `/api/member/workout-logs` | Member | Catat sesi latihan dengan estimasi kalori terbakar |

---

## Panduan Setup & Menjalankan Proyek

### Prasyarat
- **Go** `1.25+`
- **MySQL** (misalnya MariaDB/MySQL lokal di port `3306`)
- **Node.js** & **npm**
- **Ollama** (opsional, untuk fitur AI penuh): unduh model `minicpm-v` dengan `ollama pull minicpm-v`

### 1. Menjalankan Backend Go
1. Salin template environment di root repository:
   ```bash
   cp .env.example .env
   ```
2. Sesuaikan `.env` dengan konfigurasi MySQL lokal Anda, lalu pastikan database (default: `cobappt`) sudah dibuat di MySQL.
3. Unduh dependensi dan jalankan server:
   ```bash
   go mod download
   go run main.go
   ```
   Server akan berjalan pada `http://localhost:3000` (atau sesuai `PORT` di `.env`). Anda dapat mengecek statusnya di `GET http://localhost:3000/api/health`.
4. Menjalankan unit test backend:
   ```bash
   go test ./...
   ```

### 2. Menjalankan Mobile App (`mobile-app/`)
1. Masuk ke folder `mobile-app` dan install dependensi:
   ```bash
   cd mobile-app
   npm install
   ```
2. (Opsional) Salin `.env.example` menjadi `.env` jika Anda menjalankan aplikasi di perangkat fisik pada jaringan Wi-Fi yang sama:
   ```bash
   cp .env.example .env
   ```
   Jika `EXPO_PUBLIC_API_URL` tidak diisi, aplikasi otomatis memakai `http://10.0.2.2:3000/api` di Android Emulator dan `http://localhost:3000/api` di Web/iOS Simulator.
3. Jalankan Expo dev server:
   ```bash
   npx expo start
   ```
4. Pengecekan TypeScript dan lint:
   ```bash
   npx tsc --noEmit
   npm run lint
   ```

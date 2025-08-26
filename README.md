# Basic Login App

Aplikasi autentikasi fullstack dengan fitur keamanan lengkap yang dibangun menggunakan Next.js dan Express.js.

## 🚀 Fitur Utama

### Autentikasi & Keamanan

- ✅ **Registrasi & Login** dengan validasi email
- ✅ **Verifikasi Email** untuk aktivasi akun
- ✅ **Two-Factor Authentication (2FA)** dengan TOTP
- ✅ **Google OAuth Integration**
- ✅ **Reset Password** via email
- ✅ **Session Management** dengan tracking device
- ✅ **Backup Codes** untuk 2FA recovery

### Dashboard & Profile

- ✅ **User Dashboard** dengan overview aktivitas
- ✅ **Profile Management** dengan upload foto
- ✅ **Change Password** dengan validasi
- ✅ **Notification Preferences**
- ✅ **Device Session Management**
- ✅ **Account Deletion** dengan konfirmasi keamanan

### UI/UX

- ✅ **Dark/Light Theme** toggle
- ✅ **Responsive Design** untuk semua device
- ✅ **Toast Notifications** dengan Sonner
- ✅ **Loading States** & error handling
- ✅ **Status Badges** dengan berbagai variant

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework dengan App Router
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - High-quality UI components
- **React Hook Form** - Form handling
- **Sonner** - Toast notifications

### Backend

- **Express.js** - Node.js web framework
- **Prisma ORM** - Database toolkit
- **MySQL** - Relational database
- **Passport.js** - Authentication middleware
- **Speakeasy** - Two-factor authentication
- **Nodemailer** - Email sending

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/dietchse/basic-login-ap.git
cd basic-login-ap
```

### 2. Setup Backend

```bash
cd backend
npm install

# Setup database
cp .env.example .env
# Edit .env dengan database credentials Anda

# Run migrations
npx prisma migrate dev
npx prisma generate
```

### 3. Setup Frontend

```bash
cd ..
npm install
```

### 4. Jalankan Aplikasi

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
npm run dev
```

Aplikasi akan berjalan di:

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📧 Konfigurasi Email

Untuk fitur verifikasi email dan reset password, konfigurasikan SMTP di file `.env` backend.

## 🔐 Keamanan

Aplikasi ini menerapkan best practices keamanan dengan password hashing, JWT tokens, rate limiting, dan session tracking.

---

⭐ Jangan lupa star repository ini jika bermanfaat!

# 🧩 Monggu Platform — Full Setup (Windows & macOS)

Monggu is an **AI-powered companion platform** with:
1) **Backend API** — FastAPI, PostgreSQL, Uvicorn  
2) **Frontend** — React (Vite), TailwindCSS

---

## ⚙️ Tech Stack
- **Backend:** FastAPI, Uvicorn, AsyncPG, Pydantic, PostgreSQL
- **Frontend:** React (Vite), TypeScript, TailwindCSS
- **Runtime:** Python 3.11+, Node.js 18+
- **Repo:** `https://github.com/KennethhPoenadi/Monggu.git`

---

## 📁 Monorepo Structure
```
Monggu/
├─ backend/
│ ├─ config/ ├─ database/ ├─ models/ ├─ routers/
│ ├─ main.py
│ ├─ requirements.txt
│ └─ .env (you will create)
└─ frontend/
├─ src/ ├─ public/
├─ package.json
└─ vite.config.ts
```
---

# 🚀 QUICK START (Copy–Paste)

> Run these blocks **step by step**. Choose **Windows** or **macOS** commands where shown.

## 0) Clone Repository (Windows/macOS)
```bash
git clone https://github.com/KennethhPoenadi/Monggu.git
cd Monggu

🧱 BACKEND (FastAPI + PostgreSQL)

1) Prerequisites
Windows
Install Python 3.11+: https://www.python.org/downloads/windows/ (centang “Add Python to PATH”)

Install PostgreSQL: https://www.postgresql.org/download/windows/

(Optional) Install Git: https://git-scm.com/download/win

macOS
Install Homebrew (recommended): https://brew.sh/

Install Git (if belum ada):

brew install git
Install Python 3.11+:

brew install python
Install PostgreSQL:

brew install postgresql
brew services start postgresql
Pastikan PostgreSQL berjalan (default port 5432) dan kamu tahu user/password-nya (contoh: postgres / root).

2) Create & Activate Virtual Environment
Windows (PowerShell)

cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
macOS (Terminal)

cd backend
python3 -m venv venv
source venv/bin/activate
Kamu tahu venv aktif kalau prompt terminal diawali (venv).

3) Install Backend Dependencies

pip install -r requirements.txt
# Jika uvicorn belum terpasang/terdeteksi:
pip install "uvicorn[standard]"

4) Create .env
Buat file backend/.env dengan isi berikut:


DB_HOST=localhost
DB_PORT=5432
DB_NAME=Monggu
DB_USER=postgres
DB_PASSWORD=root
Sesuaikan DB_USER dan DB_PASSWORD dengan instalasi PostgreSQL kamu.

5) Run Backend (Uvicorn)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
Jika sukses, akan muncul:


INFO:     Uvicorn running on http://127.0.0.1:8000
Quick Test
Swagger Docs → http://localhost:8000/docs

Health Check → http://localhost:8000/health

💻 FRONTEND (React + Vite)
1) Prerequisites
Windows & macOS
Install Node.js 18+ (npm termasuk di dalamnya): https://nodejs.org/en/download/

Cek versi:

node -v
npm -v
2) Install & Run
Buka terminal baru (biarkan backend tetap jalan), lalu:

cd ../frontend
npm install
npm run dev
Jika sukses, Vite menampilkan:

  VITE vX.X.X  ready in XXXms
  ➜  Local:   http://localhost:5173/
Buka: http://localhost:5173/

Pastikan backend aktif di http://localhost:8000.

🔗 Connect Frontend ↔ Backend
Jika frontend membutuhkan base URL API, buat file frontend/.env (atau sesuaikan file config) berisi:

VITE_API_URL=http://localhost:8000
Lalu restart npm run dev jika perlu.

🧪 Verifikasi Cepat
Backend: buka http://localhost:8000/health → harus ada response JSON.

Docs: buka http://localhost:8000/docs → Swagger UI tampil.

Frontend: buka http://localhost:5173/ → UI tampil.

🛠 Troubleshooting Ringkas
uvicorn: command not found

Pastikan venv aktif, lalu:

pip install "uvicorn[standard]"
Tidak bisa konek database

Cek service PostgreSQL aktif.

Windows: gunakan pgAdmin atau Services.

macOS (Homebrew):

brew services start postgresql
Cek kredensial .env sesuai user/password PostgreSQL.

Port bentrok

Backend: ganti port, mis. --port 8001

Frontend: Vite biasanya otomatis pilih port baru; bisa set --port 5174.




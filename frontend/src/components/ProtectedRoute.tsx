import type { ReactNode } from 'react';
import LoginGoogle from './login/LoginGoogle';
import Navbar from './navbar';
import Footer from './footer';
import type { User } from '../types/user';

interface ProtectedRouteProps {
  children: ReactNode;
  userInfo: (User & { name?: string }) | null;
  error?: string;
}

export default function ProtectedRoute({ children, userInfo, error }: ProtectedRouteProps) {
  // Jika belum login, tampilkan halaman login
  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🍃</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Selamat datang di Monggu!
              </h1>
              <p className="text-gray-600 mb-6">
                Platform donasi makanan untuk berbagi kebaikan
              </p>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p className="font-semibold">Login gagal:</p>
                <p>{error}</p>
              </div>
            )}
            
            <div className="mb-6">
              <p className="text-center text-gray-600 mb-4">
                Silakan login untuk melanjutkan
              </p>
              <LoginGoogle />
            </div>
            
            <div className="text-center text-sm text-gray-500">
              <p>Dengan login, Anda dapat:</p>
              <ul className="mt-2 space-y-1">
                <li>• Berdonasi makanan</li>
                <li>• Mendapatkan reward</li>
                <li>• Melihat notifikasi</li>
                <li>• Mengakses semua fitur</li>
              </ul>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Jika sudah login, tampilkan konten yang diminta
  return <>{children}</>;
}
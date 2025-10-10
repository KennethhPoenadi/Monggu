import React, { useState } from "react";

const LoginGoogle: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    if (loading) return;
    setLoading(true);
    // arahkan ke backend OAuth
    window.location.href = "http://localhost:8000/auth/google/login";
  };

  return (
    <div className="w-full">
      <div className="space-y-6">
        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full group relative overflow-hidden rounded-2xl bg-white hover:bg-gray-50 text-gray-900 py-4 px-6 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed border border-gray-200"
          aria-label="Continue with Google"
        >
          <div className="flex items-center justify-center gap-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6" viewBox="0 0 48 48" aria-hidden>
                <g>
                  <path fill="#4285F4" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.22l6.9-6.9C35.64 2.34 30.13 0 24 0 14.64 0 6.4 5.48 2.44 13.44l8.06 6.27C12.6 13.36 17.82 9.5 24 9.5z"/>
                  <path fill="#34A853" d="M46.1 24.5c0-1.56-.14-3.06-.41-4.5H24v9h12.5c-.54 2.9-2.17 5.36-4.62 7.04l7.18 5.59C43.98 37.36 46.1 31.36 46.1 24.5z"/>
                  <path fill="#FBBC05" d="M12.5 28.21c-.6-1.8-.95-3.7-.95-5.71s.35-3.91.95-5.71l-8.06-6.27C2.16 14.64 0 19.09 0 24c0 4.91 2.16 9.36 5.49 12.48l8.06-6.27z"/>
                  <path fill="#EA4335" d="M24 48c6.13 0 11.64-2.02 15.72-5.5l-7.18-5.59c-2.01 1.35-4.59 2.15-7.54 2.15-6.18 0-11.4-3.86-13.5-9.24l-8.06 6.27C6.4 42.52 14.64 48 24 48z"/>
                </g>
              </svg>
            </div>
            <span className="text-lg">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  Mengarahkan...
                </div>
              ) : (
                "Masuk dengan Google"
              )}
            </span>
          </div>
          
          {/* Hover effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
        </button>

        {/* Alternative login link */}
        <div className="text-center">
          <p className="text-sm text-slate-400 mb-3">
            Mengalami masalah saat masuk?
          </p>
          <a
            href="http://localhost:8000/auth/google/login"
            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Buka login langsung
          </a>
        </div>

        {/* Terms and Privacy */}
        <div className="text-center pt-4 border-t border-slate-700/30">
          <p className="text-xs text-slate-400">
            Dengan melanjutkan, Anda menyetujui{" "}
            <a href="#" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
              Syarat & Ketentuan
            </a>{" "}
            dan{" "}
            <a href="#" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
              Kebijakan Privasi
            </a>{" "}
            kami.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginGoogle;

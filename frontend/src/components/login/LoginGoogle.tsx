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
    <div className="relative min-h-[calc(100vh-120px)] flex items-center justify-center px-6 py-14
                    bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      {/* dekorasi blob */}
      <svg
        className="pointer-events-none absolute -right-20 -top-20 w-[36rem] h-[36rem] opacity-20 blur-3xl"
        viewBox="0 0 200 200"
        aria-hidden
      >
        <path
          d="M53.6,-58.2C67.2,-45.5,74.9,-24.7,73.8,-5.7C72.8,13.3,63.1,26.6,49.5,38.9C36,51.3,18,62.7,-0.3,63.1C-18.5,63.6,-36.9,53.1,-49.1,39.6C-61.3,26.1,-67.3,9.6,-65.7,-6.1C-64.1,-21.7,-54.8,-36.5,-42.1,-49.5C-29.4,-62.6,-14.7,-73.9,3.1,-77.9C20.9,-81.9,41.9,-78.6,53.6,-58.2Z"
          transform="translate(100 100)"
          className="fill-emerald-500/30"
        />
      </svg>

      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-xl p-8 shadow-xl">
          <div className="text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              {/* badge kecil */}
              <svg className="h-6 w-6" viewBox="0 0 48 48" aria-hidden>
                <g>
                  <path fill="#4285F4" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.22l6.9-6.9C35.64 2.34 30.13 0 24 0 14.64 0 6.4 5.48 2.44 13.44l8.06 6.27C12.6 13.36 17.82 9.5 24 9.5z"/>
                  <path fill="#34A853" d="M46.1 24.5c0-1.56-.14-3.06-.41-4.5H24v9h12.5c-.54 2.9-2.17 5.36-4.62 7.04l7.18 5.59C43.98 37.36 46.1 31.36 46.1 24.5z"/>
                  <path fill="#FBBC05" d="M12.5 28.21c-.6-1.8-.95-3.7-.95-5.71s.35-3.91.95-5.71l-8.06-6.27C2.16 14.64 0 19.09 0 24c0 4.91 2.16 9.36 5.49 12.48l8.06-6.27z"/>
                  <path fill="#EA4335" d="M24 48c6.13 0 11.64-2.02 15.72-5.5l-7.18-5.59c-2.01 1.35-4.59 2.15-7.54 2.15-6.18 0-11.4-3.86-13.5-9.24l-8.06 6.27C6.4 42.52 14.64 48 24 48z"/>
                </g>
              </svg>
            </span>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Sign in with Google</h1>
            <p className="mt-2 text-slate-300 text-sm">
              Use your Google account to continue to <span className="text-emerald-300 font-semibold">Monggu</span>.
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-6 w-full inline-flex items-center justify-center gap-3 rounded-xl
                       border border-slate-700 bg-white text-slate-900 py-3 font-semibold
                       shadow hover:bg-slate-100 transition-colors disabled:opacity-60"
            aria-label="Continue with Google"
          >
            <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden>
              <g>
                <path fill="#4285F4" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.22l6.9-6.9C35.64 2.34 30.13 0 24 0 14.64 0 6.4 5.48 2.44 13.44l8.06 6.27C12.6 13.36 17.82 9.5 24 9.5z"/>
                <path fill="#34A853" d="M46.1 24.5c0-1.56-.14-3.06-.41-4.5H24v9h12.5c-.54 2.9-2.17 5.36-4.62 7.04l7.18 5.59C43.98 37.36 46.1 31.36 46.1 24.5z"/>
                <path fill="#FBBC05" d="M12.5 28.21c-.6-1.8-.95-3.7-.95-5.71s.35-3.91.95-5.71l-8.06-6.27C2.16 14.64 0 19.09 0 24c0 4.91 2.16 9.36 5.49 12.48l8.06-6.27z"/>
                <path fill="#EA4335" d="M24 48c6.13 0 11.64-2.02 15.72-5.5l-7.18-5.59c-2.01 1.35-4.59 2.15-7.54 2.15-6.18 0-11.4-3.86-13.5-9.24l-8.06 6.27C6.4 42.52 14.64 48 24 48z"/>
              </g>
            </svg>
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>

          <p className="mt-4 text-center text-xs text-slate-400">
            By continuing, you agree to our{" "}
            <a href="#" className="underline decoration-slate-600 hover:text-slate-200">
              Terms
            </a>{" "}
            &{" "}
            <a href="#" className="underline decoration-slate-600 hover:text-slate-200">
              Privacy
            </a>
            .
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Trouble signing in?{" "}
          <a
            href="http://localhost:8000/auth/google/login"
            className="text-emerald-400 hover:text-emerald-300"
          >
            open login directly
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginGoogle;

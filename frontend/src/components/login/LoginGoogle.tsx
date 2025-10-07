import React from "react";

const LoginGoogle: React.FC = () => {
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/auth/google/login";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Login dengan Google
        </h2>
        <button
          onClick={handleGoogleLogin}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48">
            <g>
              <path
                fill="#4285F4"
                d="M24 9.5c3.54 0 6.73 1.22 9.24 3.22l6.9-6.9C35.64 2.34 30.13 0 24 0 14.64 0 6.4 5.48 2.44 13.44l8.06 6.27C12.6 13.36 17.82 9.5 24 9.5z"
              />
              <path
                fill="#34A853"
                d="M46.1 24.5c0-1.56-.14-3.06-.41-4.5H24v9h12.5c-.54 2.9-2.17 5.36-4.62 7.04l7.18 5.59C43.98 37.36 46.1 31.36 46.1 24.5z"
              />
              <path
                fill="#FBBC05"
                d="M12.5 28.21c-.6-1.8-.95-3.7-.95-5.71s.35-3.91.95-5.71l-8.06-6.27C2.16 14.64 0 19.09 0 24c0 4.91 2.16 9.36 5.49 12.48l8.06-6.27z"
              />
              <path
                fill="#EA4335"
                d="M24 48c6.13 0 11.64-2.02 15.72-5.5l-7.18-5.59c-2.01 1.35-4.59 2.15-7.54 2.15-6.18 0-11.4-3.86-13.5-9.24l-8.06 6.27C6.4 42.52 14.64 48 24 48z"
              />
            </g>
          </svg>
          Login with Google
        </button>
      </div>
    </div>
  );
};

export default LoginGoogle;

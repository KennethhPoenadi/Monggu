import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
      <motion.div
        className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
      <span className="ml-4 text-lg font-semibold">Loading...</span>
    </div>
  );
}
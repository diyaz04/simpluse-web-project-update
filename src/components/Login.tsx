import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { motion } from "motion/react";
import { ArrowLeft, Lock, User as UserIcon } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBypass, setShowBypass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Strict master account restriction
    if (email !== "admin@simpluse.com" || password !== "admin2026") {
      setError("Akses Ditolak. Hanya Admin Utama yang diizinkan masuk.");
      setLoading(false);
      return;
    }

    try {
      // Attempt login
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Auth Error:", err.code, err.message);
      
      // If master account doesn't exist yet, create it silently (Auto-Register)
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        try {
          const { createUserWithEmailAndPassword } = await import("firebase/auth");
          await createUserWithEmailAndPassword(auth, email, password);
          return; // Success create & login
        } catch (regErr: any) {
          // If creation fails (e.g. invalid credential was actually wrong password for existing user)
          if (err.code === "auth/invalid-credential") {
             setError("Password salah untuk akun admin ini.");
          } else {
             setError("Terjadi kesalahan koneksi. Silakan coba lagi.");
          }
        }
      } else if (err.code === "auth/network-request-failed") {
        setError("Koneksi ke Firebase terputus. Matikan Ad-blocker jika ada.");
        setShowBypass(true);
      } else {
        setError(`Terjadi kesalahan: ${err.code || "Unknown error"}.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBypass = () => {
    if (email === "admin@simpluse.com" && password === "admin2026") {
      // Emergency Login: Save info to local storage and force reload
      // The application will try to use this mock session if Firebase is unreachable
      localStorage.setItem("simpluse_admin_bypass", JSON.stringify({
        email: "admin@simpluse.com",
        timestamp: Date.now()
      }));
      window.location.reload(); // Force refresh to trigger session check
    } else {
      setError("Kredensial bypass salah.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Landing Page</span>
        </a>

        <div className="p-10 rounded-3xl glass border border-white/10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold mb-2">Admin Login</h1>
          <p className="text-text-secondary">Akses Terbatas - Simpluse Web Project</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary">Email Admin</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-orange transition-colors"
                placeholder="admin@simpluse.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-text-secondary">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-orange transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-bg text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Menghubungkan..." : "Masuk ke Dashboard"}
          </button>
        </form>

        {showBypass && (
          <button 
            onClick={handleBypass}
            className="mt-4 w-full text-xs text-white/30 hover:text-white transition-colors"
          >
            Gunakan Bypass (Hanya jika jaringan bermasalah)
          </button>
        )}
        </div>
      </motion.div>
    </div>
  );
}

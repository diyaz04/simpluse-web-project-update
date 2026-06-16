import React, { useState } from 'react';
import { db } from '../lib/db';
import { Rocket, Lock, Mail, Home, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (route: string) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const isDemoMode = db.isDemoMode();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErrorMsg('');

    try {
      const response = await db.login(email, password);
      if (response.success) {
        // Succesfully logged in! Direct dashboard home view
        onNavigate('#/dashboard');
      } else {
        setErrorMsg(response.error || 'Autentikasi gagal. Mohon periksa kembali data Anda.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err?.message || 'Kesalahan tak terduga terjadi selama proses autentikasi.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div id="login-container" className="pt-28 pb-20 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Absolute glow design circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#F97316]/10 rounded-full blur-[110px] pointer-events-none select-none animate-pulse-glow" />

      <div className="bg-[#111111]/75 backdrop-blur-md p-8 rounded-2xl border border-white/10 w-full max-w-md relative z-10 shadow-2xl">
        <button
          type="button"
          onClick={() => onNavigate('#/')}
          className="mb-6 inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition cursor-pointer"
        >
          <Home className="w-3.5 h-3.5 text-[#F97316]" />
          <span>Ke Landing Page</span>
        </button>

        {/* Brand signature header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 hover:scale-105 duration-200 transition shadow-[0_0_20px_rgba(249,115,22,0.15)] overflow-hidden">
            <img 
              src="https://lh3.googleusercontent.com/d/1cAk12EZRnreW8c7SOc2V7rJO4M0c3Dq_" 
              alt="Simpluse Logo" 
              className="w-full h-full object-contain p-1.5"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Simpluse Web Console</h1>
          <p className="text-slate-400 text-xs mt-1">Platform Manajemen Proyek Website & Order Masuk</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start space-x-2 animate-fadeIn">
            <span className="font-bold font-mono">ERROR:</span>
            <p className="leading-normal">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 text-left">
          {/* Email field */}
          <div>
            <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">
              Email Address / Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isDemoMode ? 'demo@simpluse.local' : 'admin@example.com'}
                className="w-full bg-white/5 border border-white/10 focus:border-[#F97316]/60 text-white rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition duration-150 focus:shadow-[0_0_15px_rgba(249,115,22,0.15)]"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2">
              Password Pengenal
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 focus:border-[#F97316]/60 text-white rounded-xl py-3 pl-10 pr-10 text-sm outline-none transition duration-150 focus:shadow-[0_0_15px_rgba(249,115,22,0.15)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-[#F97316] hover:bg-[#ea580c] disabled:bg-white/5 disabled:text-slate-600 text-black py-3.5 px-4 rounded-full font-extrabold tracking-wide transition duration-200 transform hover:-translate-y-0.5 disabled:transform-none flex items-center justify-center space-x-2 text-sm cursor-pointer border-0 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]"
          >
            {isLoggingIn ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Memverifikasi Sandi...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Console</span>
                <Rocket className="w-4 h-4 fill-current" />
              </>
            )}
          </button>
        </form>

        {isDemoMode && (
          <div className="mt-8 pt-6 border-t border-white/5 text-center space-y-2 select-none">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Demo Mode Aktif:</p>
            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 inline-block text-left text-[11px] font-mono text-slate-400 space-y-1">
              <p>Email: <span className="text-white">demo@simpluse.local</span></p>
              <p>Sandi: <span className="text-white">demo-admin</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

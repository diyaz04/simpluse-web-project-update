import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { LayoutDashboard, Menu, X, Rocket, Send, LogOut } from 'lucide-react';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export default function Navbar({ currentRoute, onNavigate }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const user = db.getCurrentUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', path: '#/' },
    { label: 'Portfolio', path: '#/portfolio' },
    { label: 'Order', path: '#/order' },
  ];

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    setIsOpen(false);
  };

  const isLinkActive = (path: string) => {
    if (path === '#/' && (currentRoute === '' || currentRoute === '#/')) return true;
    return currentRoute === path;
  };

  const handleLogout = () => {
    db.logout();
    onNavigate('#/dashboard/login');
  };

  return (
    <nav 
      id="main-navbar"
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] py-3.5' 
          : 'bg-transparent border-b border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => handleLinkClick('#/')} 
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.15)] transform group-hover:scale-105 transition-transform duration-250 overflow-hidden">
              <img 
                src="https://lh3.googleusercontent.com/d/1cAk12EZRnreW8c7SOc2V7rJO4M0c3Dq_" 
                alt="Simpluse Logo" 
                className="w-full h-full object-contain p-1"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-xl font-bold font-sans tracking-tight text-white group-hover:text-[#F97316] transition-colors">
                Simpluse
              </span>
              <span className="text-[9px] block text-slate-400 -mt-1 font-mono tracking-[0.2em] uppercase">
                Web Project
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 bg-white/5 border border-white/5 backdrop-blur-md px-6 py-2 rounded-full">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleLinkClick(item.path)}
                className={`font-medium transition-all duration-200 relative py-1 cursor-pointer text-sm ${
                  isLinkActive(item.path) 
                    ? 'text-[#F97316] font-bold' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onNavigate('#/dashboard')}
                  className="bg-white/5 hover:bg-white/10 text-white text-xs py-2 px-4 rounded-full border border-white/10 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-red-400 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('#/dashboard/login')}
                className="px-5 py-2 text-xs bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition-all cursor-pointer font-medium"
              >
                Admin Area
              </button>
            )}

            <a
              href="https://wa.me/6285121535821?text=Halo%20Simpluse%20Web%20Project%2C%20saya%20tertarik%20untuk%20konsultasi%20pembuatan%20website..."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#F97316] hover:bg-[#ea580c] text-black font-extrabold text-sm px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] transform hover:-translate-y-0.5 transition duration-200 flex items-center space-x-2 cursor-pointer"
            >
              <Send className="w-4 h-4 text-black stroke-[2.5]" />
              <span>WhatsApp Us</span>
            </a>
          </div>

          {/* Mobile hamburger menu trigger */}
          <div className="md:hidden flex items-center space-x-3">
            <a
              href="https://wa.me/6285121535821?text=Halo%20Simpluse%20Web%20Project%2C%20saya%20tertarik%20konsultasi..."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#F97316] text-black p-2 rounded-xl"
            >
              <Send className="w-4 h-4 text-black stroke-[2.5]" />
            </a>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white focus:outline-none focus:ring-1 focus:ring-[#F97316]"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#0A0A0A]/95 border-b border-white/10 animate-fadeIn backdrop-blur-lg">
          <div className="px-3 pt-2 pb-5 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleLinkClick(item.path)}
                className={`block w-full text-left px-4 py-3 rounded-xl text-base font-medium ${
                  isLinkActive(item.path)
                    ? 'bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            <hr className="border-white/10 my-3" />
            
            {user ? (
              <>
                <button
                  onClick={() => handleLinkClick('#/dashboard')}
                  className="flex items-center space-x-2 w-full text-left px-4 py-3 text-base font-medium text-slate-300 hover:bg-white/5 hover:text-white rounded-xl"
                >
                  <LayoutDashboard className="w-5 h-5 text-[#F97316]" />
                  <span>Dashboard Admin</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full text-left px-4 py-3 text-base font-medium text-red-400 hover:bg-red-500/10 rounded-xl"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleLinkClick('#/dashboard/login')}
                className="block w-full text-left px-4 py-3 text-base font-medium text-slate-400 hover:text-white"
              >
                Log In Admin
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

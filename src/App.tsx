import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DashboardLayout from './components/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import PortfolioPage from './pages/PortfolioPage';
import OrderPage from './pages/OrderPage';
import LoginPage from './pages/LoginPage';

// Private Dashboard Pages
import DashboardHome from './pages/DashboardHome';
import ProjectsList from './pages/ProjectsList';
import ProjectEdit from './pages/ProjectEdit';
import ResellerDashboard from './pages/ResellerDashboard';
import AdminResellersPage from './pages/AdminResellersPage';
import ResellerOrderPage from './pages/ResellerOrderPage';
import AdminFinancePage from './pages/AdminFinancePage';

import { db } from './lib/db';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash || '#/');

  // Sync hash routing triggers
  useEffect(() => {
    const handleHashChange = () => {
      // Force scroll to top on every route change for beautiful UX
      window.scrollTo(0, 0);
      setCurrentRoute(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (route: string) => {
    window.location.hash = route;
    setCurrentRoute(route);
  };

  // Auth helper
  const user = db.getCurrentUser();

  // Helper parser for dynamic edit links like `#/dashboard/projects/edit/<project-id>`
  const isEditRoute = currentRoute.startsWith('#/dashboard/projects/edit/');
  const parsedProjectId = isEditRoute ? currentRoute.replace('#/dashboard/projects/edit/', '') : undefined;

  // Render Logic
  const getRenderPage = () => {
    // 1. PUBLIC ROUTES
    if (currentRoute === '' || currentRoute === '#/' || currentRoute === '#') {
      return (
        <div className="animate-fadeIn">
          <Navbar currentRoute={currentRoute} onNavigate={handleNavigate} />
          <LandingPage onNavigate={handleNavigate} />
          <Footer onNavigate={handleNavigate} />
        </div>
      );
    }
    
    if (currentRoute === '#/portfolio') {
      return (
        <div className="animate-fadeIn">
          <Navbar currentRoute={currentRoute} onNavigate={handleNavigate} />
          <PortfolioPage onNavigate={handleNavigate} />
          <Footer onNavigate={handleNavigate} />
        </div>
      );
    }

    if (currentRoute === '#/order') {
      return (
        <div className="animate-fadeIn">
          <Navbar currentRoute={currentRoute} onNavigate={handleNavigate} />
          <OrderPage onNavigate={handleNavigate} />
          <Footer onNavigate={handleNavigate} />
        </div>
      );
    }

    // 2. AUTHENTICATION ROUTE
    if (currentRoute === '#/dashboard/login') {
      if (user) {
        // Redirection to the right console if already authed
        setTimeout(() => handleNavigate(user.role === 'reseller' ? '#/reseller' : '#/dashboard'), 0);
        return null;
      }
      return <LoginPage onNavigate={handleNavigate} />;
    }

    // 3. PRIVATE ADMIN DASHBOARD GUARDED PORTALS
    if (currentRoute.startsWith('#/dashboard')) {
      if (!user) {
        // Guarded: force logins
        return (
          <div className="pt-12 text-center space-y-4">
            <p className="text-slate-400 text-sm">Akses ditolak. Mengalihkan Anda ke halaman login admin...</p>
            {setTimeout(() => handleNavigate('#/dashboard/login'), 800) && null}
          </div>
        );
      }

      if (user.role === 'reseller') {
        setTimeout(() => handleNavigate('#/reseller'), 0);
        return null;
      }

      // Determine dashboard view
      let dashboardChild = <DashboardHome onNavigate={handleNavigate} />;

      if (currentRoute === '#/dashboard/projects') {
        dashboardChild = <ProjectsList onNavigate={handleNavigate} />;
      } else if (currentRoute === '#/dashboard/projects/new') {
        dashboardChild = <ProjectEdit onNavigate={handleNavigate} />;
      } else if (isEditRoute && parsedProjectId) {
        dashboardChild = <ProjectEdit projectId={parsedProjectId} onNavigate={handleNavigate} />;
      } else if (currentRoute === '#/dashboard/resellers') {
        dashboardChild = <AdminResellersPage />;
      } else if (currentRoute === '#/dashboard/finance') {
        dashboardChild = <AdminFinancePage onNavigate={handleNavigate} />;
      }

      return (
        <DashboardLayout currentRoute={currentRoute} onNavigate={handleNavigate} role="admin">
          {dashboardChild}
        </DashboardLayout>
      );
    }

    // 4. PRIVATE RESELLER DASHBOARD GUARDED PORTAL
    if (currentRoute.startsWith('#/reseller')) {
      if (!user) {
        return (
          <div className="pt-12 text-center space-y-4">
            <p className="text-slate-400 text-sm">Akses reseller ditolak. Mengalihkan Anda ke halaman login...</p>
            {setTimeout(() => handleNavigate('#/dashboard/login'), 800) && null}
          </div>
        );
      }

      if (user.role !== 'reseller') {
        setTimeout(() => handleNavigate('#/dashboard'), 0);
        return null;
      }

      const resellerChild = currentRoute === '#/reseller/orders/new'
        ? <ResellerOrderPage onNavigate={handleNavigate} />
        : <ResellerDashboard onNavigate={handleNavigate} />;

      return (
        <DashboardLayout currentRoute={currentRoute} onNavigate={handleNavigate} role="reseller">
          {resellerChild}
        </DashboardLayout>
      );
    }

    // 5. FALLBACK 404 ROUTE
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 space-y-4">
        <h1 className="text-4xl font-extrabold text-[#F97316] font-mono select-none">404</h1>
        <h2 className="text-xl font-bold text-white">Halaman Tidak Ditemukan</h2>
        <p className="text-slate-400 text-xs max-w-xs">Tampaknya terjadi kesalahan pengetikan URL. Kembali ke halaman utama kami.</p>
        <button
          onClick={() => handleNavigate('#/')}
          className="bg-brand-orange-500 text-white text-xs px-4 py-2.5 rounded-lg text-semibold font-sans cursor-pointer"
        >
          Ke Halaman Utama
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 font-sans tracking-tight antialiased selection:bg-brand-orange-500/30 selection:text-white">
      {getRenderPage()}
    </div>
  );
}

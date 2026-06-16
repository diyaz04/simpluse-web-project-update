/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Portfolio from "./components/Portfolio";
import Services from "./components/Services";
import Pricing from "./components/Pricing";
import Testimonials from "./components/Testimonials";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import AIEstimator from "./components/AIEstimator";
import { AppProvider, useApp } from "./AppContext";

function MainContent() {
  const { user, loading } = useApp();
  const urlParams = new URLSearchParams(window.location.search);
  const isAdminParam = urlParams.get("admin") === "true";
  const isLoginPage = window.location.pathname === "/login" || isAdminParam;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (isLoginPage) {
    return user ? <Dashboard /> : <Login />;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Portfolio />
        <AIEstimator />
        <Services />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

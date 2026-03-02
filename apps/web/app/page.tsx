'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowRight, LuCalendar, LuUsers, LuLayers, LuShieldCheck, LuLayoutDashboard } from "react-icons/lu";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { GetStartedModal } from "@/components/get-started-modal";

export default function Home() {
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine where to send the user if they are logged in
  const getDashboardPath = () => {
    if (!user) return "/dashboard";
    switch (user.role) {
      case 'SUPERADMIN': return "/superadmin";
      case 'UNI_ADMIN': return "/dashboard";
      case 'DEPT_ADMIN': return "/department";
      case 'FACULTY': return "/faculty-panel";
      default: return "/dashboard";
    }
  };

  const dashboardPath = getDashboardPath();

  return (
    <div className="dark transition-none min-h-screen bg-[#0a0a0c] text-slate-200 relative overflow-hidden flex flex-col font-sans selection:bg-neon-cyan/30" style={{ colorScheme: 'dark' }}>
      {/* Deep Space Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-purple/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-neon-cyan/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />

      <header className="px-6 py-6 lg:px-12 flex justify-between items-center relative z-50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl glass border-neon-cyan/20 group-hover:border-neon-cyan/50 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <LuCalendar className="w-6 h-6 text-neon-cyan relative z-10" />
          </div>
          <span className="text-2xl font-heading font-bold text-white tracking-tight">Zembaa<span className="text-neon-cyan">.AI</span></span>
        </div>

        <nav className="hidden md:flex items-center gap-8 glass px-8 py-3 rounded-full border-white/5">
          <a href="/platform" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Platform</a>
          <a href="/solutions" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Solutions</a>
          <a href="/security" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Security</a>
        </nav>

        <div className="flex gap-4 items-center">
          {mounted && isAuthenticated ? (
            <Link
              href={dashboardPath}
              className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-all backdrop-blur-md flex items-center gap-2 group"
            >
              Dashboard <LuArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors px-4">
                Sign In
              </Link>
              <button
                onClick={() => setShowInquiryModal(true)}
                className="px-6 py-2.5 rounded-full bg-neon-cyan text-[#0a0a0c] text-sm font-bold hover:bg-white hover:text-[#0a0a0c] transition-all shadow-[0_0_20px_rgba(57,193,239,0.3)] hover:shadow-[0_0_30px_rgba(57,193,239,0.6)] flex items-center gap-2"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 mt-20 mb-32">

        {/* Hero Section */}
        <div className="text-center max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative">

          <div className="inline-flex items-center rounded-full px-4 py-1.5 glass border-neon-cyan/30 text-neon-cyan text-sm font-medium mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(57,193,239,0.15)]">
            <span className="flex h-2 w-2 rounded-full bg-neon-cyan mr-2 animate-pulse glow-cyan"></span>
            Zembaa Engine v2.0 Live
          </div>

          <h1 className="text-5xl lg:text-7xl font-heading font-extrabold tracking-tight text-white leading-[1.1]">
            AI-Powered Scheduling for <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-blue-400 to-neon-purple pb-2">
              Modern Universities
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
            Eliminate scheduling conflicts instantly. Our next-generation constraint solver optimizes faculty workloads and university resources with mathematical precision.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row gap-6 justify-center items-center">
            {mounted && isAuthenticated ? (
              <Link
                href={dashboardPath}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-neon-cyan to-blue-500 text-slate-900 text-lg font-bold hover:opacity-90 transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(57,193,239,0.4)] flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                Access Mission Control <LuLayoutDashboard className="w-5 h-5 ml-1" />
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setShowInquiryModal(true)}
                  className="px-8 py-4 rounded-full bg-white text-black text-lg font-bold hover:bg-slate-200 transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  Start Optimization <LuArrowRight className="w-5 h-5 ml-1" />
                </button>
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                  <LuShieldCheck className="w-5 h-5 text-neon-purple" />
                  Enterprise Grade Security
                </div>
              </>
            )}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-32 relative z-20">
          <div className="glass-card p-8 rounded-[2rem] hover:border-neon-cyan/50 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/10 blur-[50px] rounded-full group-hover:bg-neon-cyan/20 transition-colors" />
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-8 shadow-inner relative z-10 group-hover:border-neon-cyan/30 transition-colors">
              <LuLayers className="w-7 h-7 text-neon-cyan" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-white mb-3 relative z-10">Multi-Tenant Scoping</h3>
            <p className="text-slate-400 leading-relaxed font-light relative z-10">
              Cryptographically isolated database partitions securing Departments, Resources, and active Faculty data arrays.
            </p>
          </div>

          <div className="glass-card p-8 rounded-[2rem] hover:border-neon-purple/50 transition-colors group relative overflow-hidden mt-0 md:mt-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/10 blur-[50px] rounded-full group-hover:bg-neon-purple/20 transition-colors" />
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-8 shadow-inner relative z-10 group-hover:border-neon-purple/30 transition-colors">
              <LuCalendar className="w-7 h-7 text-neon-purple" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-white mb-3 relative z-10">Neural Constraint Solver</h3>
            <p className="text-slate-400 leading-relaxed font-light relative z-10">
              Advanced pooling algorithms that instantaneously resolve hyper-dimensional temporal collisions.
            </p>
          </div>

          <div className="glass-card p-8 rounded-[2rem] hover:border-pink-500/50 transition-colors group relative overflow-hidden mt-0 md:mt-16">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 blur-[50px] rounded-full group-hover:bg-pink-500/20 transition-colors" />
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-8 shadow-inner relative z-10 group-hover:border-pink-500/30 transition-colors">
              <LuUsers className="w-7 h-7 text-pink-400" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-white mb-3 relative z-10">Role Based Topology</h3>
            <p className="text-slate-400 leading-relaxed font-light relative z-10">
              Strict cryptographic JWT validations dictating access parameters across the core microservices.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-slate-500 text-sm border-t border-white/5 relative z-10 glass">
        <p className="font-light">© {new Date().getFullYear()} Zembaa AI Timetable Systems. All systems operational.</p>
      </footer>

      {/* Get Started Inquiry Modal */}
      <GetStartedModal isOpen={showInquiryModal} onClose={() => setShowInquiryModal(false)} />
    </div>
  );
}

'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowRight, LuCalendar, LuUsers, LuLayers, LuShieldCheck, LuLayoutDashboard } from "react-icons/lu";
import { useAuthStore } from "@/lib/store/useAuthStore";

export default function Home() {
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

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
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -ml-[40rem] w-[80rem] h-[40rem] opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 blur-3xl rounded-full mix-blend-multiply" />
      </div>

      <header className="px-6 py-6 lg:px-12 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <LuCalendar className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight leading-tight">Zembaa Solution</span>
        </div>
        <div className="flex gap-4 items-center">
          {mounted && isAuthenticated ? (
            <Link
              href={dashboardPath}
              className="px-6 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md hover:shadow-xl hover:shadow-indigo-200 flex items-center gap-2"
            >
              Go to Dashboard <LuLayoutDashboard className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors shadow-md hover:shadow-xl hover:shadow-indigo-200 flex items-center gap-2"
            >
              Access Portal <LuArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 mt-12 mb-24">
        <div className="text-center max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center rounded-full px-4 py-1.5 bg-indigo-50 text-indigo-600 text-sm font-semibold border border-indigo-100 mb-4">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 mr-2 animate-pulse"></span>
            Version 1.1 Live Deployment
          </div>

          <h1 className="text-4xl lg:text-7xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm leading-tight text-center">
            Zembaa <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Solution
            </span>
          </h1>

          <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed text-center">
            The next-generation scheduling architecture built for excellence.
            Leveraging intelligent algorithms for resource optimization and conflict resolution.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            {mounted && isAuthenticated ? (
              <Link
                href={dashboardPath}
                className="px-8 py-4 rounded-full bg-indigo-600 text-white text-lg font-bold hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-xl shadow-indigo-200 flex items-center justify-center gap-2"
              >
                Go to Dashboard <LuLayoutDashboard className="w-5 h-5 ml-1" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-8 py-4 rounded-full bg-indigo-600 text-white text-lg font-bold hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-xl shadow-indigo-200 flex items-center justify-center gap-2"
              >
                Secure Login <LuShieldCheck className="w-5 h-5 ml-1" />
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <LuLayers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Multi-Tenant Scoping</h3>
            <p className="text-slate-500 leading-relaxed">
              Isolated database mappings securely dividing Universities, Departments, and active Faculty.
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
              <LuCalendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">AI Constraint Solver</h3>
            <p className="text-slate-500 leading-relaxed">
              Automated resource pooling resolving temporal collisions between teaching capacities.
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
              <LuUsers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Role Based Security</h3>
            <p className="text-slate-500 leading-relaxed">
              Strict cryptographic JWT payload validations across Express middleware interceptors.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-slate-500 text-sm border-t border-slate-200">
        <p>© {new Date().getFullYear()} Timetable Management System. Authorized usage only.</p>
      </footer>
    </div>
  );
}

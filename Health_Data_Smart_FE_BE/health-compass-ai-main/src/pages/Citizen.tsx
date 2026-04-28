import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Activity, ArrowLeft, Shield, Users, Calendar, Heart, Sparkles, Dumbbell,
    Wind, FileText, Pill, Stethoscope,
} from "lucide-react";
import { DashboardPage, TreatmentsPage, ReportsPage, MedicinesPage, SymptomsPage, NAV, PATIENT, fadeIn } from "./_citizen_part1";
import type { Page } from "./_citizen_part1";
import { LongevityPage, AppointmentsPage, ExercisePage, ProfilePage } from "./_citizen_part2";

// ─── MAIN COMPONENT ────────────────────────────────────────────────
const Citizen = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState<Page>("dashboard");

    const pages: Record<Page, React.ReactNode> = {
        dashboard: <DashboardPage />,
        treatments: <TreatmentsPage />,
        reports: <ReportsPage />,
        medicines: <MedicinesPage />,
        symptoms: <SymptomsPage />,
        longevity: <LongevityPage />,
        appointments: <AppointmentsPage />,
        exercise: <ExercisePage />,
        profile: <ProfilePage />,
    };

    const current = NAV.find(n => n.id === page);

    return (
        <div className="relative flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 z-40 flex h-screen w-[200px] flex-col border-r border-slate-200 bg-white">
                {/* Logo */}
                <div className="border-b border-slate-100 px-4 py-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                            <Activity className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">MedAI</p>
                            <p className="text-[9px] text-slate-400">Patient Portal</p>
                        </div>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
                    {NAV.map(n => {
                        const Icon = n.icon;
                        const active = page === n.id;
                        return (
                            <button
                                key={n.id}
                                onClick={() => setPage(n.id)}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12px] font-medium transition-colors ${active
                                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                    }`}
                            >
                                <Icon className={`h-4 w-4 ${active ? "text-emerald-600" : "text-slate-400"}`} />
                                {n.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Patient Card */}
                <div className="border-t border-slate-100 p-3">
                    <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                            AM
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-[11px] font-bold text-slate-800">{PATIENT.name}</p>
                            <p className="text-[9px] text-slate-400">{PATIENT.age}y · {PATIENT.blood} · {PATIENT.gender}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="ml-[200px] flex-1">
                {/* Top bar */}
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
                    <div className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate("/login")} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            <div>
                                <h1 className="text-base font-bold text-slate-900">{current?.label}</h1>
                                <p className="text-[10px] text-slate-400">{PATIENT.location}, Telangana · AQI 142</p>
                            </div>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-600">
                            <Shield className="mr-1 inline h-3 w-3" />AYUSH Integrated
                        </span>
                    </div>
                </header>

                {/* Page Content */}
                <main className="mx-auto max-w-[1200px] px-6 py-6">
                    <motion.div key={page} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                        {pages[page]}
                    </motion.div>
                    <p className="mt-8 text-center text-[9px] text-slate-400">
                        <Shield className="mr-1 inline h-2.5 w-2.5" />
                        MedAI Patient Portal · Data encrypted end-to-end · AYUSH Health Intelligence Platform
                    </p>
                </main>
            </div>
        </div>
    );
};

export default Citizen;

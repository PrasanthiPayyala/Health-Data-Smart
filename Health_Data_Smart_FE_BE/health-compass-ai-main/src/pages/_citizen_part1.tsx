import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    Activity, AlertTriangle, TrendingUp, Users, ArrowLeft, Shield, ChevronUp,
    ChevronDown, Zap, Play, Pause, X, Check, Calendar, Heart, Apple, Dumbbell,
    Brain, Sparkles, Droplets, Moon, Cigarette, Wine, Bot, Lightbulb, Plus,
    FileText, Upload, Pill, Clock, MapPin, Stethoscope, Eye, Hand, Footprints,
    Timer, RotateCcw, Flame, Star, ChevronRight, Loader2, Search,
} from "lucide-react";
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    AreaChart, Area, BarChart, Bar,
} from "recharts";

// ─── TYPES ──────────────────────────────────────────────────────────
type Page = "dashboard" | "treatments" | "reports" | "medicines" | "symptoms" | "longevity" | "appointments" | "exercise" | "profile";

// ─── NAV ────────────────────────────────────────────────────────────
const NAV: { id: Page; icon: any; label: string }[] = [
    { id: "dashboard", icon: Activity, label: "Dashboard" },
    { id: "medicines", icon: Pill, label: "Medicines" },
    { id: "treatments", icon: Heart, label: "Treatments" },
    { id: "reports", icon: FileText, label: "Reports" },
    { id: "symptoms", icon: Stethoscope, label: "Symptoms" },
    { id: "longevity", icon: Sparkles, label: "Longevity" },
    { id: "appointments", icon: Calendar, label: "Appointments" },
    { id: "exercise", icon: Dumbbell, label: "Exercise" },
    { id: "profile", icon: Users, label: "Profile" },
];

// ─── MOCK DATA ──────────────────────────────────────────────────────
const PATIENT = { name: "Arjun Mehta", age: 38, gender: "Male", blood: "B+", bmi: 26.4, location: "Hyderabad", allergies: ["Penicillin", "Dust"], conditions: ["Pre-diabetes", "Mild Hypertension"], familyHistory: ["Diabetes", "Heart Disease"] };

const VITALS = [
    { label: "Blood Pressure", value: "136/86", unit: "mmHg", status: "warning", icon: "❤️" },
    { label: "Blood Sugar", value: "118", unit: "mg/dL", status: "warning", icon: "🩸" },
    { label: "SpO2", value: "97", unit: "%", status: "good", icon: "🫁" },
    { label: "BMI", value: "26.4", unit: "kg/m²", status: "warning", icon: "⚖️" },
    { label: "Weight", value: "78.5", unit: "kg", status: "good", icon: "🏋️" },
    { label: "Heart Rate", value: "74", unit: "bpm", status: "good", icon: "💓" },
];

const APPOINTMENTS = [
    { doctor: "Dr. Ramesh Kumar", specialty: "Cardiologist", date: "Mar 5, 2025", time: "10:30 AM", status: "upcoming" as const },
    { doctor: "Dr. Priya Sharma", specialty: "Endocrinologist", date: "Mar 12, 2025", time: "2:00 PM", status: "upcoming" as const },
    { doctor: "Dr. Anjali Nair", specialty: "General Physician", date: "Feb 10, 2025", time: "11:00 AM", status: "completed" as const },
    { doctor: "Dr. Sunil Rao", specialty: "Ophthalmologist", date: "Jan 22, 2025", time: "3:30 PM", status: "completed" as const },
];

const TREATMENTS = [
    { name: "Hypertension Management", doctor: "Dr. Ramesh Kumar", start: "Nov 2024", status: "active" as const, progress: 65, meds: ["Telmisartan 40mg"] },
    { name: "Pre-diabetes Control", doctor: "Dr. Priya Sharma", start: "Jan 2025", status: "active" as const, progress: 40, meds: ["Metformin 500mg"] },
    { name: "Vitamin D Supplementation", doctor: "Dr. Anjali Nair", start: "May 2024", status: "completed" as const, progress: 100, meds: ["Vitamin D3 60K IU"] },
];

const REPORTS = [
    { name: "HbA1c Report", date: "Jan 2025", type: "Blood" as const, value: "6.1%", status: "Borderline" },
    { name: "Lipid Profile", date: "Aug 2024", type: "Blood" as const, value: "LDL 148", status: "Elevated" },
    { name: "ECG", date: "Mar 2024", type: "Scan" as const, value: "Normal SR", status: "Normal" },
    { name: "Chest X-Ray", date: "Dec 2023", type: "Scan" as const, value: "Clear", status: "Normal" },
    { name: "Vitamin D", date: "May 2024", type: "Blood" as const, value: "14 ng/mL", status: "Deficient" },
];

const MEDICINES = [
    { id: 1, name: "Telmisartan 40mg", dose: "1 tablet", freq: "Once daily", time: "Morning", adherence: 85, active: true, reminder: true, category: "Cardiac" },
    { id: 2, name: "Metformin 500mg", dose: "1 tablet", freq: "Twice daily", time: "Morning & Night", adherence: 92, active: true, reminder: true, category: "Diabetes" },
    { id: 3, name: "Vitamin D3 60K IU", dose: "1 capsule", freq: "Weekly", time: "Sunday", adherence: 70, active: true, reminder: false, category: "Supplement" },
    { id: 4, name: "Aspirin 75mg", dose: "1 tablet", freq: "Once daily", time: "After lunch", adherence: 0, active: false, reminder: false, category: "Cardiac" },
];

const SYMPTOM_DB = [
    { symptom: "Chest pain", diseases: ["Angina", "GERD", "Costochondritis"], doctor: "Cardiologist", tests: ["ECG", "Troponin", "Chest X-Ray"], medCategory: "Cardiac", urgency: "High" as const },
    { symptom: "Headache", diseases: ["Migraine", "Tension Headache", "Sinusitis"], doctor: "Neurologist", tests: ["CT Scan", "Eye Test"], medCategory: "Analgesic", urgency: "Medium" as const },
    { symptom: "Fatigue", diseases: ["Anemia", "Thyroid Disorder", "Diabetes"], doctor: "General Physician", tests: ["CBC", "TSH", "HbA1c"], medCategory: "Supplement", urgency: "Low" as const },
    { symptom: "Joint pain", diseases: ["Arthritis", "Gout", "Vitamin D Deficiency"], doctor: "Orthopedic", tests: ["X-Ray", "Uric Acid", "Vitamin D"], medCategory: "Anti-inflammatory", urgency: "Medium" as const },
    { symptom: "Shortness of breath", diseases: ["Asthma", "COPD", "Cardiac Issue"], doctor: "Pulmonologist", tests: ["PFT", "Chest X-Ray", "ECG"], medCategory: "Bronchodilator", urgency: "High" as const },
    { symptom: "Dizziness", diseases: ["Vertigo", "Low BP", "Anemia"], doctor: "ENT / General", tests: ["CBC", "BP Monitoring", "Audiometry"], medCategory: "Vestibular", urgency: "Medium" as const },
    { symptom: "Skin rash", diseases: ["Eczema", "Allergic Dermatitis", "Fungal"], doctor: "Dermatologist", tests: ["Skin Biopsy", "Allergy Panel"], medCategory: "Topical", urgency: "Low" as const },
    { symptom: "Fever", diseases: ["Viral Infection", "UTI", "Dengue"], doctor: "General Physician", tests: ["CBC", "Dengue NS1", "Urine Culture"], medCategory: "Antipyretic", urgency: "Medium" as const },
];

const SYMPTOM_CATEGORIES: { label: string; symptoms: string[] }[] = [
    { label: "Common", symptoms: ["Headache", "Fatigue", "Fever", "Dizziness"] },
    { label: "Respiratory", symptoms: ["Shortness of breath"] },
    { label: "Pain", symptoms: ["Chest pain", "Joint pain"] },
    { label: "Other", symptoms: ["Skin rash"] },
];

const LIFESTYLE = [
    { cat: "Hydration", score: 55, tip: "Target 3.5L+ water daily in Hyderabad heat. Add ORS in summer.", icon: "💧", color: "bg-blue-500" },
    { cat: "Diet", score: 62, tip: "Include millets (jowar, bajra). Reduce refined carbs. Add turmeric & fenugreek.", icon: "🥗", color: "bg-emerald-500" },
    { cat: "Exercise", score: 70, tip: "Walk 8K steps. Exercise 5-7am to avoid heat. Yoga reduces BP.", icon: "🏃", color: "bg-amber-500" },
    { cat: "Sleep", score: 58, tip: "Keep room 22-24°C. Avoid screens 1hr before bed. 7-8hrs optimal.", icon: "😴", color: "bg-indigo-500" },
    { cat: "Air Quality", score: 40, tip: "AQI 142 — wear N95 outdoors. Run air purifier. Consider lung screening.", icon: "😷", color: "bg-red-500" },
    { cat: "Stress", score: 50, tip: "Try 10-min pranayama daily. Digital detox weekends reduce cortisol.", icon: "🧘", color: "bg-purple-500" },
];

const RISK_CARDS = [
    { label: "Cardiovascular", pct: 42, detail: "Family history + mild hypertension. Monitor BP weekly.", severity: "Moderate" as const },
    { label: "Diabetes Type 2", pct: 55, detail: "HbA1c 6.1 + sedentary lifestyle. Lifestyle changes critical.", severity: "High" as const },
    { label: "Kidney", pct: 18, detail: "Low risk. Monitor KFT with Metformin use.", severity: "Low" as const },
];

const BODY_PARTS = [
    { id: "brain", label: "Brain / Mind", icon: "🧠", exercises: ["4-4-6 Breathing", "Box Breathing", "Meditation", "Focus Exercise"] },
    { id: "neck", label: "Neck", icon: "🦒", exercises: ["Neck Stretch", "Chin Tuck", "Side Bend", "Rotation"] },
    { id: "shoulders", label: "Shoulders", icon: "💪", exercises: ["Shoulder Roll", "Arm Circle", "Wall Push", "Shrug Hold"] },
    { id: "chest", label: "Chest / Lungs", icon: "🫁", exercises: ["Deep Breathing", "Chest Opener", "Diaphragm Stretch", "Pursed Lip"] },
    { id: "back", label: "Back", icon: "🔙", exercises: ["Cat-Cow", "Child Pose", "Spinal Twist", "Back Extension"] },
    { id: "core", label: "Core", icon: "🎯", exercises: ["Plank", "Dead Bug", "Bird Dog", "Pelvic Tilt"] },
    { id: "legs", label: "Legs", icon: "🦵", exercises: ["Squat", "Calf Raise", "Hamstring Stretch", "Lunge"] },
    { id: "eyes", label: "Eyes", icon: "👁️", exercises: ["20-20-20 Rule", "Eye Roll", "Palming", "Focus Shift"] },
    { id: "fullbody", label: "Full Body", icon: "🧍", exercises: ["Sun Salutation", "Full Stretch", "Jumping Jack", "Cool Down"] },
];

const EXERCISE_DETAILS: Record<string, { difficulty: string; duration: string; benefits: string; steps: string[]; doctorTag?: boolean }> = {
    "4-4-6 Breathing": { difficulty: "Easy", duration: "5 min", benefits: "Reduces anxiety, lowers heart rate, improves focus", steps: ["Inhale through nose for 4 seconds", "Hold breath for 4 seconds", "Exhale slowly through mouth for 6 seconds", "Repeat 8-10 cycles"], doctorTag: true },
    "Box Breathing": { difficulty: "Easy", duration: "5 min", benefits: "Calms nervous system, reduces stress", steps: ["Inhale for 4 seconds", "Hold for 4 seconds", "Exhale for 4 seconds", "Hold empty for 4 seconds"], doctorTag: true },
    "Meditation": { difficulty: "Easy", duration: "10 min", benefits: "Improves mental clarity, reduces cortisol", steps: ["Find a quiet comfortable position", "Close eyes and focus on breath", "Notice thoughts without judgment", "Gently return focus to breathing"] },
    "Plank": { difficulty: "Medium", duration: "3 min", benefits: "Core strength, posture improvement", steps: ["Start in push-up position", "Keep body straight from head to heels", "Engage core muscles", "Hold for 30-60 seconds, rest, repeat"] },
    "Sun Salutation": { difficulty: "Medium", duration: "15 min", benefits: "Full body flexibility, cardiovascular health", steps: ["Stand tall, hands at heart", "Reach arms overhead", "Fold forward", "Step back to plank, lower down", "Cobra pose, then downward dog", "Step forward, rise up"], doctorTag: true },
};

const TREND_DATA = [
    { month: "Sep", bp: 140, sugar: 125, weight: 80 }, { month: "Oct", bp: 138, sugar: 122, weight: 79.5 },
    { month: "Nov", bp: 137, sugar: 120, weight: 79 }, { month: "Dec", bp: 136, sugar: 119, weight: 78.8 },
    { month: "Jan", bp: 136, sugar: 118, weight: 78.5 }, { month: "Feb", bp: 135, sugar: 117, weight: 78.2 },
];

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

// ─── HELPERS ────────────────────────────────────────────────────────
function StatCard({ icon, label, value, unit, status }: { icon: string; label: string; value: string; unit: string; status: string }) {
    const c = status === "good" ? "emerald" : status === "warning" ? "amber" : "red";
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{icon}</span>
                <span className={`rounded-full bg-${c}-100 px-2 py-0.5 text-[9px] font-bold text-${c}-700 uppercase`}>{status}</span>
            </div>
            <p className="text-xl font-black text-slate-900">{value}<span className="ml-1 text-xs font-normal text-slate-400">{unit}</span></p>
            <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
        </div>
    );
}

function ScoreRing({ score, size = 100, color = "#10b981", label = "SCORE" }: { score: number; size?: number; color?: string; label?: string }) {
    const r = (size - 10) / 2; const circ = 2 * Math.PI * r; const dash = (score / 100) * circ;
    return (
        <div className="relative inline-flex" style={{ width: size, height: size }}>
            <svg width={size} height={size}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={8} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} /></svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900">{score}</span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
            </div>
        </div>
    );
}

// ─── PAGE: DASHBOARD ────────────────────────────────────────────────
function DashboardPage() {
    return (
        <div className="space-y-6">
            {/* Health Score + Alerts */}
            <div className="grid gap-5 lg:grid-cols-3">
                <motion.div {...fadeIn} className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
                    <ScoreRing score={68} size={120} color="#10b981" label="HEALTH" />
                    <p className="mt-3 text-sm font-bold text-slate-800">Longevity Score</p>
                    <p className="text-xs text-slate-500">Health Age: <strong className="text-amber-600">41</strong> (Actual: 38)</p>
                    <p className="mt-2 text-[10px] text-slate-400">Lifestyle changes can reclaim 4-6 years</p>
                </motion.div>
                <motion.div {...fadeIn} transition={{ delay: 0.05 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Alerts</h3>
                    {[
                        { icon: "🚨", title: "AQI Alert — Hyderabad (142)", desc: "Air quality Unhealthy. Avoid outdoor 12-4pm.", color: "border-red-200 bg-red-50" },
                        { icon: "⚠️", title: "HbA1c Checkup Due — March 2025", desc: "Family diabetes history. Schedule test within 2 weeks.", color: "border-amber-200 bg-amber-50" },
                        { icon: "💊", title: "Metformin Due — 9:00 PM", desc: "Take 500mg with dinner. Adherence: 92%", color: "border-blue-200 bg-blue-50" },
                    ].map(a => (
                        <div key={a.title} className={`flex items-start gap-3 rounded-xl border p-3 ${a.color}`}>
                            <span className="text-lg">{a.icon}</span>
                            <div><p className="text-xs font-bold text-slate-800">{a.title}</p><p className="text-[11px] text-slate-500">{a.desc}</p></div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Vitals Grid */}
            <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Daily Vitals</h3>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                    {VITALS.map(v => <StatCard key={v.label} {...v} />)}
                </div>
            </motion.div>

            {/* Trends + Upcoming */}
            <div className="grid gap-5 lg:grid-cols-5">
                <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">6-Month Health Trends</h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={TREND_DATA}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: 10, fontSize: 11, color: "#f8fafc" }} />
                                <Line type="monotone" dataKey="bp" name="BP (Systolic)" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="sugar" name="Blood Sugar" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="weight" name="Weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
                <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Upcoming</h3>
                    {APPOINTMENTS.filter(a => a.status === "upcoming").map(a => (
                        <div key={a.doctor} className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100"><Calendar className="h-4 w-4 text-emerald-600" /></div>
                            <div className="flex-1 min-w-0"><p className="text-xs font-bold text-slate-800 truncate">{a.doctor}</p><p className="text-[10px] text-slate-500">{a.specialty} · {a.date}</p></div>
                            <span className="text-[10px] font-bold text-emerald-600">{a.time}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

// ─── PAGE: TREATMENTS ───────────────────────────────────────────────
function TreatmentsPage() {
    return (
        <div className="space-y-4">
            {TREATMENTS.map((t, i) => (
                <motion.div key={t.name} {...fadeIn} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div><p className="text-sm font-bold text-slate-900">{t.name}</p><p className="text-[10px] text-slate-500">{t.doctor} · Since {t.start}</p></div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${t.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{t.status}</span>
                    </div>
                    <div className="mb-2 flex items-center justify-between text-[10px]"><span className="text-slate-500">Progress</span><span className="font-bold text-slate-700">{t.progress}%</span></div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${t.progress}%` }} transition={{ duration: 1 }} className={`h-full rounded-full ${t.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} /></div>
                    <div className="mt-3 flex flex-wrap gap-1.5">{t.meds.map(m => <span key={m} className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-700">{m}</span>)}</div>
                </motion.div>
            ))}
        </div>
    );
}

// ─── PAGE: REPORTS ──────────────────────────────────────────────────
function ReportsPage() {
    const [filter, setFilter] = useState("All");
    const types = ["All", "Blood", "Scan", "Prescription"];
    const filtered = filter === "All" ? REPORTS : REPORTS.filter(r => r.type === filter);
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex gap-1.5">{types.map(t => <button key={t} onClick={() => setFilter(t)} className={`rounded-full px-3 py-1 text-[10px] font-bold transition ${filter === t ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>{t}</button>)}</div>
                <button onClick={() => toast.success("Upload feature coming soon!")} className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm"><Upload className="h-3 w-3" />Upload</button>
            </div>
            {filtered.map((r, i) => (
                <motion.div key={r.name} {...fadeIn} transition={{ delay: i * 0.04 }} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${r.type === "Blood" ? "bg-red-50" : "bg-blue-50"}`}>
                        <FileText className={`h-5 w-5 ${r.type === "Blood" ? "text-red-500" : "text-blue-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-900 truncate">{r.name}</p><p className="text-[10px] text-slate-500">{r.date} · {r.type}</p></div>
                    <span className="text-sm font-bold text-slate-700">{r.value}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${r.status === "Normal" ? "bg-emerald-100 text-emerald-700" : r.status === "Borderline" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{r.status}</span>
                </motion.div>
            ))}
        </div>
    );
}

// ─── PAGE: MEDICINES ────────────────────────────────────────────────
function MedicinesPage() {
    const [meds, setMeds] = useState(MEDICINES);
    const toggleReminder = (id: number) => { setMeds(m => m.map(x => x.id === id ? { ...x, reminder: !x.reminder } : x)); toast.success("Reminder updated"); };
    const active = meds.filter(m => m.active), stopped = meds.filter(m => !m.active);
    return (
        <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active — {active.length}</h3>
            {active.map((m, i) => (
                <motion.div key={m.id} {...fadeIn} transition={{ delay: i * 0.04 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div><p className="text-sm font-bold text-slate-900">{m.name}</p><p className="text-[10px] text-slate-500">{m.dose} · {m.freq} · {m.time}</p></div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">{m.category}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <div className="flex-1 mr-4">
                            <div className="flex justify-between text-[10px] mb-1"><span className="text-slate-500">Adherence</span><span className={`font-bold ${m.adherence > 80 ? "text-emerald-600" : "text-amber-600"}`}>{m.adherence}%</span></div>
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${m.adherence > 80 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${m.adherence}%` }} /></div>
                        </div>
                        <button onClick={() => toggleReminder(m.id)} className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition ${m.reminder ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                            <Clock className="h-3 w-3" />{m.reminder ? "On" : "Off"}
                        </button>
                    </div>
                </motion.div>
            ))}
            {stopped.length > 0 && <><h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-6">Stopped — {stopped.length}</h3>
                {stopped.map(m => <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm opacity-50"><p className="text-sm font-bold text-slate-900">{m.name}</p><p className="text-[10px] text-slate-500">{m.dose} · {m.category}</p></div>)}</>}
        </div>
    );
}

// ─── PAGE: SYMPTOMS (AI Symptom Checker) ──────────────────────────────
type AnalysisStatus = "idle" | "loading" | "done";
type MockScenario = "critical" | "routine" | "generic";

function SymptomsPage() {
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
    const [mockScenario, setMockScenario] = useState<MockScenario | null>(null);

    const toggleSymptom = (symptom: string) => {
        setSelectedSymptoms((prev) =>
            prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
        );
        setAnalysisStatus("idle");
        setMockScenario(null);
    };

    type UrgencyLevel = "low" | "moderate" | "critical";
    const getMockResponse = (): {
        scenario: MockScenario;
        title: string;
        body: string;
        isCritical: boolean;
        urgencyLevel: UrgencyLevel;
        specialist: string;
    } => {
        const hasChestPain = selectedSymptoms.includes("Chest pain");
        const hasShortness = selectedSymptoms.includes("Shortness of breath");
        const hasHeadache = selectedSymptoms.includes("Headache");
        const hasFatigue = selectedSymptoms.includes("Fatigue");

        if (hasChestPain && hasShortness) {
            return {
                scenario: "critical",
                title: "CRITICAL ALERT",
                body: "These symptoms require immediate emergency evaluation. Please call emergency services or go to the nearest ER.",
                isCritical: true,
                urgencyLevel: "critical",
                specialist: "Emergency Care / Cardiologist",
            };
        }
        if (hasHeadache && hasFatigue) {
            return {
                scenario: "routine",
                title: "Low Risk",
                body: "Likely causes: Dehydration, Stress, or mild viral infection. Recommendation: Rest, hydrate, and monitor for 24 hours.",
                isCritical: false,
                urgencyLevel: "low",
                specialist: "General Physician",
            };
        }
        const matched = SYMPTOM_DB.filter((s) => selectedSymptoms.includes(s.symptom));
        const hasHigh = matched.some((s) => s.urgency === "High");
        const specialist = matched.length > 0 ? matched[0].doctor : "General Physician";
        return {
            scenario: "generic",
            title: hasHigh ? "Moderate to High Risk" : "Low to Moderate Risk",
            body: "Based on your symptoms, we recommend consulting a healthcare provider for a proper evaluation. You can book a teleconsultation below for timely advice.",
            isCritical: false,
            urgencyLevel: hasHigh ? "moderate" : "low",
            specialist,
        };
    };

    const handleAnalyze = () => {
        if (selectedSymptoms.length === 0) return;
        setAnalysisStatus("loading");
        setMockScenario(null);
        setTimeout(() => {
            setMockScenario(getMockResponse().scenario);
            setAnalysisStatus("done");
        }, 1500);
    };

    const searchLower = searchQuery.toLowerCase().trim();
    const filteredCategories = SYMPTOM_CATEGORIES.map((cat) => ({
        ...cat,
        symptoms: cat.symptoms.filter((s) => s.toLowerCase().includes(searchLower)),
    })).filter((cat) => cat.symptoms.length > 0);

    const result = analysisStatus === "done" && mockScenario ? getMockResponse() : null;

    return (
        <div className="grid grid-cols-12 gap-8">
            {/* Left Column (7): Symptom Selection */}
            <div className="col-span-12 lg:col-span-7 space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                        Search Symptoms
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Type a symptom..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-bold text-slate-800">Select your symptoms</h3>
                    <p className="mb-4 text-xs text-slate-500">Click to select or deselect. You can choose multiple symptoms.</p>
                    <div className="space-y-6">
                        {filteredCategories.length === 0 ? (
                            <p className="text-xs text-slate-400">No symptoms match your search.</p>
                        ) : (
                            filteredCategories.map((cat) => (
                                <div key={cat.label}>
                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        {cat.label}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {cat.symptoms.map((symptom) => {
                                            const isActive = selectedSymptoms.includes(symptom);
                                            return (
                                                <button
                                                    key={symptom}
                                                    type="button"
                                                    onClick={() => toggleSymptom(symptom)}
                                                    className={`rounded-full px-4 py-2 text-xs font-medium transition ${isActive
                                                        ? "bg-emerald-500 text-white ring-2 ring-emerald-300 ring-offset-2"
                                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
                                                        }`}
                                                >
                                                    {symptom}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {selectedSymptoms.length > 0 && (
                        <p className="mt-4 text-[10px] text-slate-500">
                            {selectedSymptoms.length} selected: {selectedSymptoms.join(", ")}
                        </p>
                    )}
                </div>
            </div>

            {/* Right Column (5): AI Analysis & Next Steps */}
            <div className="col-span-12 lg:col-span-5">
                <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[280px] flex flex-col">
                    <h3 className="mb-1 text-sm font-bold text-slate-800">AI Analysis & Next Steps</h3>
                    <p className="mb-4 text-[10px] text-slate-400 uppercase tracking-wider">Preliminary assessment</p>

                    {selectedSymptoms.length === 0 && (
                        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 mb-3">
                                <Stethoscope className="h-7 w-7 text-emerald-600" />
                            </div>
                            <p className="text-sm font-medium text-slate-700">
                                Select your symptoms to receive an instant AI preliminary assessment.
                            </p>
                            <p className="mt-1 text-xs text-slate-500 max-w-[220px]">
                                Choose one or more symptoms from the left. The analysis will update here.
                            </p>
                        </div>
                    )}

                    {selectedSymptoms.length > 0 && analysisStatus === "idle" && (
                        <div className="flex flex-1 flex-col justify-center">
                            <p className="mb-3 text-xs text-slate-600">
                                You selected: <strong>{selectedSymptoms.join(", ")}</strong>
                            </p>
                            <button
                                type="button"
                                onClick={handleAnalyze}
                                className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600"
                            >
                                Analyze Symptoms
                            </button>
                        </div>
                    )}

                    {selectedSymptoms.length > 0 && analysisStatus === "loading" && (
                        <div className="flex flex-1 flex-col items-center justify-center gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                            <p className="text-sm font-medium text-slate-600">Analyzing your symptoms...</p>
                        </div>
                    )}

                    {selectedSymptoms.length > 0 && analysisStatus === "done" && result && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-1 flex-col"
                        >
                            {/* Urgency Level Badge */}
                            <div className="mb-3">
                                {result.urgencyLevel === "low" && (
                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
                                        Low Urgency
                                    </span>
                                )}
                                {result.urgencyLevel === "moderate" && (
                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
                                        Moderate Urgency — See doctor within 24h
                                    </span>
                                )}
                                {result.urgencyLevel === "critical" && (
                                    <span className="inline-flex items-center rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white animate-pulse">
                                        CRITICAL — Seek Immediate Care
                                    </span>
                                )}
                            </div>

                            <div
                                className={`rounded-xl border-2 p-4 ${result.isCritical
                                    ? "border-red-400 bg-red-100"
                                    : "border-emerald-200 bg-emerald-50/50"
                                    }`}
                            >
                                <h4
                                    className={`text-sm font-bold ${result.isCritical ? "text-red-800" : "text-slate-900"
                                        }`}
                                >
                                    {result.title}
                                </h4>
                                <p
                                    className={`mt-2 text-xs leading-relaxed ${result.isCritical
                                        ? "text-red-800 font-semibold"
                                        : "text-slate-700"
                                        }`}
                                >
                                    {result.body}
                                </p>

                                {/* Recommended Specialist */}
                                <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-2.5">
                                    <Stethoscope className="h-4 w-4 shrink-0 text-slate-500" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recommended Specialist</p>
                                        <p className="text-sm font-semibold text-slate-800">{result.specialist}</p>
                                    </div>
                                </div>
                            </div>

                            {result.isCritical ? (
                                <button
                                    type="button"
                                    onClick={() => toast.success("Dialing 108 — Emergency services")}
                                    className="mt-4 w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700"
                                >
                                    Call Emergency Services (108)
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => toast.success("Opening teleconsultation booking...")}
                                    className="mt-4 w-full rounded-xl border-2 border-emerald-500 bg-white py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
                                >
                                    Book Teleconsultation
                                </button>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

export {
    DashboardPage, TreatmentsPage, ReportsPage, MedicinesPage, SymptomsPage,
    PATIENT, NAV, APPOINTMENTS, LIFESTYLE, RISK_CARDS, BODY_PARTS, EXERCISE_DETAILS,
    TREND_DATA, fadeIn, ScoreRing, StatCard
};
export type { Page };

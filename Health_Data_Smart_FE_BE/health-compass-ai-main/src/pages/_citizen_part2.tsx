import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    Calendar, Heart, Sparkles, Wind, Timer, Play, Pause, Star, ChevronRight,
    MapPin, Dumbbell, X, Check, Flame, RotateCcw, Users, Shield, Droplets,
    Moon, Brain, TrendingUp, Zap,
} from "lucide-react";
import { LIFESTYLE, RISK_CARDS, BODY_PARTS, EXERCISE_DETAILS, APPOINTMENTS, PATIENT, fadeIn, ScoreRing } from "./_citizen_part1";

// ─── PAGE: LONGEVITY ────────────────────────────────────────────────
export function LongevityPage() {
    return (
        <div className="space-y-6">
            {/* Lifestyle Scores */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {LIFESTYLE.map((l, i) => (
                    <motion.div key={l.cat} {...fadeIn} transition={{ delay: i * 0.04 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2"><span className="text-lg">{l.icon}</span><p className="text-xs font-bold text-slate-800">{l.cat}</p></div>
                            <span className={`text-lg font-black ${l.score < 50 ? "text-red-500" : l.score < 70 ? "text-amber-500" : "text-emerald-500"}`}>{l.score}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-2"><div className={`h-full rounded-full ${l.color}`} style={{ width: `${l.score}%` }} /></div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{l.tip}</p>
                    </motion.div>
                ))}
            </div>
            {/* Risk Prediction */}
            <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">AI Risk Prediction</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                    {RISK_CARDS.map((r, i) => (
                        <motion.div key={r.label} {...fadeIn} transition={{ delay: 0.1 + i * 0.05 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-bold text-slate-900">{r.label}</p>
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${r.severity === "High" ? "bg-red-100 text-red-700" : r.severity === "Moderate" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{r.severity}</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-2"><motion.div initial={{ width: 0 }} animate={{ width: `${r.pct}%` }} transition={{ duration: 1 }} className={`h-full rounded-full ${r.pct > 50 ? "bg-red-400" : r.pct > 30 ? "bg-amber-400" : "bg-emerald-400"}`} /></div>
                            <p className="text-[10px] font-bold text-slate-400 text-right">{r.pct}% probability</p>
                            <p className="text-[11px] text-slate-500 mt-2">{r.detail}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
            {/* Preventive */}
            <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3"><Shield className="h-4 w-4 text-emerald-600" /><h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">Preventive Schedule</h3></div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {[{ test: "HbA1c", due: "Mar 2025", pri: "high" }, { test: "Lipid Profile", due: "Apr 2025", pri: "high" }, { test: "KFT", due: "May 2025", pri: "medium" }, { test: "Eye Checkup", due: "Jun 2025", pri: "medium" }, { test: "ECG", due: "Jul 2025", pri: "low" }, { test: "Colonoscopy", due: "Jan 2026", pri: "low" }].map(p => (
                        <div key={p.test} className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-200">
                            <div><p className="text-xs font-bold text-slate-800">{p.test}</p><p className="text-[10px] text-slate-500">Due: {p.due}</p></div>
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${p.pri === "high" ? "bg-red-100 text-red-700" : p.pri === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{p.pri}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

// ─── PAGE: APPOINTMENTS ─────────────────────────────────────────────
export function AppointmentsPage() {
    const [booking, setBooking] = useState(false);
    const upcoming = APPOINTMENTS.filter(a => a.status === "upcoming"), past = APPOINTMENTS.filter(a => a.status === "completed");
    return (
        <div className="space-y-5">
            <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Upcoming — {upcoming.length}</h3>
                <button onClick={() => setBooking(true)} className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm"><Calendar className="h-3 w-3" />Book Appointment</button>
            </div>
            {upcoming.map((a, i) => (
                <motion.div key={a.doctor + a.date} {...fadeIn} transition={{ delay: i * 0.04 }} className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100"><Calendar className="h-5 w-5 text-emerald-600" /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-900">{a.doctor}</p><p className="text-[10px] text-slate-500"><MapPin className="inline h-2.5 w-2.5" /> {a.specialty}</p></div>
                    <div className="text-right"><p className="text-xs font-bold text-slate-700">{a.date}</p><p className="text-[10px] text-emerald-600">{a.time}</p></div>
                </motion.div>
            ))}
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-6">History — {past.length}</h3>
            {past.map(a => (
                <div key={a.doctor + a.date} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm opacity-60">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100"><Check className="h-5 w-5 text-slate-400" /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-900">{a.doctor}</p><p className="text-[10px] text-slate-500">{a.specialty}</p></div>
                    <div className="text-right"><p className="text-xs text-slate-500">{a.date}</p><p className="text-[10px] text-slate-400">{a.time}</p></div>
                </div>
            ))}
            <AnimatePresence>{booking && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setBooking(false)}>
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-slate-900">Book Appointment</h2><button onClick={() => setBooking(false)}><X className="h-5 w-5 text-slate-400" /></button></div>
                        <div className="space-y-3">
                            {["Cardiologist", "Endocrinologist", "General Physician", "Dermatologist", "Neurologist", "Pulmonologist"].map(s => (
                                <button key={s} onClick={() => { setBooking(false); toast.success(`Appointment request sent to ${s}!`); }} className="w-full rounded-xl border border-slate-200 p-3 text-left text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 transition">{s}</button>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}</AnimatePresence>
        </div>
    );
}

// ─── PAGE: EXERCISE ─────────────────────────────────────────────────
export function ExercisePage() {
    const [part, setPart] = useState<string | null>(null);
    const [detail, setDetail] = useState<string | null>(null);
    const [showBreathingModal, setShowBreathingModal] = useState(false);
    const selected = part ? BODY_PARTS.find(b => b.id === part) : null;
    const ex = detail ? EXERCISE_DETAILS[detail] : null;
    return (
        <div className="space-y-5">
            {/* Guided Breathing Sessions — premium card */}
            <motion.div {...fadeIn} className="relative overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-lg shadow-emerald-100/50">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-emerald-100/40" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                            <Wind className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Guided Breathing Sessions</h2>
                            <p className="text-xs text-slate-600 mt-0.5">4-4-6 breathing, box breathing & more. Calm your mind, lower stress.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowBreathingModal(true)}
                        className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-600 hover:shadow-lg"
                    >
                        <Play className="h-4 w-4" />
                        Start Breathing
                    </button>
                </div>
            </motion.div>

            {!part && (<>
                <p className="text-sm text-slate-500">Select a body part to see recommended exercises.</p>
                <div className="grid gap-3 grid-cols-3 lg:grid-cols-3">
                    {BODY_PARTS.map((b, i) => (
                        <motion.button key={b.id} {...fadeIn} transition={{ delay: i * 0.03 }} onClick={() => setPart(b.id)} className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/50 transition">
                            <span className="text-3xl mb-2">{b.icon}</span>
                            <span className="text-xs font-bold text-slate-700">{b.label}</span>
                            <span className="text-[9px] text-slate-400 mt-0.5">{b.exercises.length} exercises</span>
                        </motion.button>
                    ))}
                </div>
            </>)}
            {part && !detail && selected && (<>
                <button onClick={() => setPart(null)} className="text-xs text-emerald-600 font-bold hover:underline">← Back to body parts</button>
                <div className="flex items-center gap-3 mb-2"><span className="text-3xl">{selected.icon}</span><div><p className="text-lg font-bold text-slate-900">{selected.label}</p><p className="text-[10px] text-slate-500">{selected.exercises.length} exercises available</p></div></div>
                <div className="grid gap-3 sm:grid-cols-2">
                    {selected.exercises.map((e, i) => {
                        const d = EXERCISE_DETAILS[e]; return (
                            <motion.button key={e} {...fadeIn} transition={{ delay: i * 0.04 }} onClick={() => setDetail(e)} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-left hover:border-emerald-300 transition">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50"><Dumbbell className="h-5 w-5 text-emerald-600" /></div>
                                <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-900">{e}</p>{d && <p className="text-[10px] text-slate-500">{d.difficulty} · {d.duration}</p>}</div>
                                {d?.doctorTag && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-bold text-blue-600">Dr. Recommended</span>}
                                <ChevronRight className="h-4 w-4 text-slate-300" />
                            </motion.button>
                        );
                    })}
                </div>
            </>)}
            {detail && ex && (<>
                <button onClick={() => setDetail(null)} className="text-xs text-emerald-600 font-bold hover:underline">← Back to exercises</button>
                <motion.div {...fadeIn} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div><p className="text-xl font-bold text-slate-900">{detail}</p><p className="text-xs text-slate-500">{ex.difficulty} · {ex.duration} · {ex.benefits}</p></div>
                        {ex.doctorTag && <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-bold text-blue-700">🩺 Doctor Recommended</span>}
                    </div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Step-by-Step</h4>
                    <div className="space-y-2">{ex.steps.map((s, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">{i + 1}</div>
                            <p className="text-sm text-slate-700">{s}</p>
                        </div>
                    ))}</div>
                </motion.div>
            </>)}

            {/* Breathing modal overlay */}
            <AnimatePresence>
                {showBreathingModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => setShowBreathingModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col"
                        >
                            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                                <h2 className="text-lg font-bold text-slate-900">Guided Breathing</h2>
                                <button
                                    type="button"
                                    onClick={() => setShowBreathingModal(false)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                                    aria-label="Close"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                <BreathingPage />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── PAGE: BREATHING ────────────────────────────────────────────────
export function BreathingPage() {
    const [active, setActive] = useState(false);
    const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
    const [timer, setTimer] = useState(0);
    const [cycles, setCycles] = useState(0);
    const [streak] = useState(5);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const phaseRef = useRef(phase);
    const timerRef = useRef(timer);
    phaseRef.current = phase; timerRef.current = timer;

    const stop = useCallback(() => { if (intervalRef.current) clearInterval(intervalRef.current); setActive(false); setPhase("inhale"); setTimer(0); }, []);
    const start = useCallback(() => {
        setActive(true); setCycles(0); setPhase("inhale"); setTimer(4);
        intervalRef.current = setInterval(() => {
            const t = timerRef.current - 1;
            if (t > 0) { setTimer(t); return; }
            const p = phaseRef.current;
            if (p === "inhale") { setPhase("hold"); setTimer(4); }
            else if (p === "hold") { setPhase("exhale"); setTimer(6); }
            else { setCycles(c => c + 1); setPhase("inhale"); setTimer(4); }
        }, 1000);
    }, []);
    useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

    const scale = phase === "inhale" ? 1.4 : phase === "hold" ? 1.4 : 0.8;
    const col = phase === "inhale" ? "from-emerald-400 to-teal-500" : phase === "hold" ? "from-amber-400 to-orange-500" : "from-blue-400 to-indigo-500";
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h2 className="text-lg font-bold text-slate-900">4-4-6 Breathing</h2><p className="text-xs text-slate-500">Inhale 4s → Hold 4s → Exhale 6s</p></div>
                <div className="flex items-center gap-2"><Flame className="h-4 w-4 text-amber-500" /><span className="text-sm font-bold text-slate-700">{streak} day streak</span><Star className="h-4 w-4 text-amber-400" /></div>
            </div>
            <motion.div {...fadeIn} className="mx-auto flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
                <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
                    <motion.div animate={{ scale, opacity: active ? 1 : 0.3 }} transition={{ duration: phase === "exhale" ? 6 : 4, ease: "easeInOut" }} className={`absolute rounded-full bg-gradient-to-br ${col} opacity-20`} style={{ width: 200, height: 200 }} />
                    <motion.div animate={{ scale: active ? scale * 0.7 : 0.7, opacity: active ? 0.5 : 0.15 }} transition={{ duration: phase === "exhale" ? 6 : 4, ease: "easeInOut" }} className={`absolute rounded-full bg-gradient-to-br ${col}`} style={{ width: 140, height: 140 }} />
                    <div className="relative z-10 flex flex-col items-center">
                        <span className="text-4xl font-black text-slate-900">{active ? timer : "—"}</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">{active ? phase : "Ready"}</span>
                    </div>
                </div>
                <p className="mt-4 text-sm text-slate-600">Cycles: <strong>{cycles}</strong></p>
                <div className="mt-6 flex gap-3">
                    {!active ? <button onClick={start} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 transition"><Play className="h-4 w-4" />Start</button>
                        : <><button onClick={stop} className="flex items-center gap-2 rounded-xl bg-red-500 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-600 transition"><Pause className="h-4 w-4" />Stop</button>
                            <button onClick={() => { stop(); start(); }} className="flex items-center gap-2 rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-300 transition"><RotateCcw className="h-4 w-4" />Reset</button></>}
                </div>
            </motion.div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Benefits</h3>
                <div className="grid gap-2 sm:grid-cols-2">{["Reduces anxiety & stress", "Lowers resting heart rate", "Improves focus & clarity", "Activates parasympathetic system", "Lowers blood pressure", "Improves sleep quality"].map(b => (
                    <div key={b} className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3"><Check className="h-3.5 w-3.5 text-emerald-600" /><span className="text-xs text-slate-700">{b}</span></div>
                ))}</div>
            </div>
        </div>
    );
}

// ─── PAGE: PROFILE ──────────────────────────────────────────────────
export function ProfilePage() {
    return (
        <div className="space-y-5">
            <motion.div {...fadeIn} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xl font-bold text-white">AM</div>
                    <div><p className="text-lg font-bold text-slate-900">{PATIENT.name}</p><p className="text-xs text-slate-500">Age {PATIENT.age} · {PATIENT.gender} · {PATIENT.blood} · BMI {PATIENT.bmi}</p><p className="text-[10px] text-slate-400"><MapPin className="inline h-2.5 w-2.5" /> {PATIENT.location}, Telangana</p></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4"><h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Allergies</h4>{PATIENT.allergies.map(a => <span key={a} className="mr-1.5 inline-block rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-medium text-red-700 mb-1">{a}</span>)}</div>
                    <div className="rounded-xl bg-slate-50 p-4"><h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Conditions</h4>{PATIENT.conditions.map(c => <span key={c} className="mr-1.5 inline-block rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-medium text-amber-700 mb-1">{c}</span>)}</div>
                    <div className="rounded-xl bg-slate-50 p-4"><h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Family History</h4>{PATIENT.familyHistory.map(f => <span key={f} className="mr-1.5 inline-block rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-medium text-blue-700 mb-1">{f}</span>)}</div>
                </div>
            </motion.div>
        </div>
    );
}

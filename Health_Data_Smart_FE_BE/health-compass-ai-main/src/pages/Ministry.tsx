import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    Activity, AlertTriangle, TrendingUp, Users, MapPin, ArrowLeft,
    Building2, Shield, ChevronUp, ChevronDown, Flame, Zap, Play, Pause,
    Filter, Clock, BellRing, Truck, X, Check, Send, Radio,
    Siren, Hospital, Bell, Globe, Thermometer,
} from "lucide-react";
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart,
} from "recharts";

// Leaflet map loaded only on client to avoid window/document SSR issues (use next/dynamic with ssr: false in Next.js)
const MapComponent = lazy(() => import("@/components/MapComponent"));

// ─── TYPES ───────────────────────────────────────────────────────────────────
type DiseaseType = "All" | "Fever" | "Cough" | "Hypertension" | "Diabetes" | "Gastric" | "Allergy";
type Region = "All" | "North Andhra" | "Godavari" | "Delta" | "South Coastal" | "Rayalaseema";
type Scenario = "baseline" | "intervention" | "worstCase";

// ─── STATIC DATA ─────────────────────────────────────────────────────────────
const kpis = [
    { label: "Active Districts", value: "13", change: "+2", up: true, icon: Flame, gradient: "from-red-500 to-rose-600", glow: "shadow-red-500/20" },
    { label: "Avg Risk Index", value: "7.1", change: "+0.3", up: true, icon: AlertTriangle, gradient: "from-amber-500 to-orange-600", glow: "shadow-amber-500/20" },
    { label: "7-Day Case Trend", value: "+18%", change: "-4%", up: false, icon: Zap, gradient: "from-blue-500 to-cyan-600", glow: "shadow-blue-500/20" },
    { label: "OPD Visits (24h)", value: "1,147", change: "+8%", up: true, icon: Users, gradient: "from-emerald-500 to-teal-600", glow: "shadow-emerald-500/20" },
];

const baseOutbreak = [
    { day: "Mon", baseline: 320, intervention: 305, worstCase: 340, predicted: 335 },
    { day: "Tue", baseline: 345, intervention: 318, worstCase: 375, predicted: 358 },
    { day: "Wed", baseline: 338, intervention: 298, worstCase: 392, predicted: 372 },
    { day: "Thu", baseline: 380, intervention: 335, worstCase: 428, predicted: 395 },
    { day: "Fri", baseline: 412, intervention: 362, worstCase: 478, predicted: 418 },
    { day: "Sat", baseline: 445, intervention: 388, worstCase: 532, predicted: 440 },
    { day: "Sun", baseline: 428, intervention: 370, worstCase: 565, predicted: 462 },
];

const heatmapDistricts = [
    { name: "East Godavari", region: "Godavari" as const, lat: 17.0005, lng: 81.804, intensity: 1.0, cases: 1090, capacity: 82, disease: "Fever" },
    { name: "Krishna", region: "Delta" as const, lat: 16.1875, lng: 81.1343, intensity: 0.92, cases: 1007, capacity: 78, disease: "Cough" },
    { name: "West Godavari", region: "Godavari" as const, lat: 16.7107, lng: 81.0952, intensity: 0.84, cases: 917, capacity: 75, disease: "Gastric" },
    { name: "Visakhapatnam", region: "North Andhra" as const, lat: 17.6868, lng: 83.2185, intensity: 0.72, cases: 785, capacity: 68, disease: "Fever" },
    { name: "Guntur", region: "Delta" as const, lat: 16.3067, lng: 80.4365, intensity: 0.68, cases: 745, capacity: 65, disease: "Cough" },
    { name: "Nellore", region: "South Coastal" as const, lat: 14.4426, lng: 79.9865, intensity: 0.66, cases: 724, capacity: 62, disease: "Cough" },
    { name: "Vizianagaram", region: "North Andhra" as const, lat: 18.1167, lng: 83.4167, intensity: 0.64, cases: 696, capacity: 60, disease: "Fever" },
    { name: "Srikakulam", region: "North Andhra" as const, lat: 18.2969, lng: 83.8973, intensity: 0.60, cases: 659, capacity: 58, disease: "Fever" },
    { name: "Prakasam", region: "South Coastal" as const, lat: 15.5057, lng: 80.0499, intensity: 0.55, cases: 601, capacity: 54, disease: "Fever" },
    { name: "Kurnool", region: "Rayalaseema" as const, lat: 15.8281, lng: 78.0373, intensity: 0.43, cases: 473, capacity: 46, disease: "Fever" },
    { name: "Chittoor", region: "Rayalaseema" as const, lat: 13.2172, lng: 79.1003, intensity: 0.36, cases: 397, capacity: 40, disease: "Allergy" },
    { name: "Ananthapuramu", region: "Rayalaseema" as const, lat: 14.6819, lng: 77.6006, intensity: 0.26, cases: 286, capacity: 32, disease: "Fever" },
    { name: "YSR Kadapa", region: "Rayalaseema" as const, lat: 14.4674, lng: 78.8241, intensity: 0.24, cases: 261, capacity: 30, disease: "Fever" },
];

const DISTRICT_OPTIONS = ["All", ...heatmapDistricts.map((d) => d.name)];

const districtTable = [
    { district: "East Godavari", mandals: 61, activeCases: 1090, predicted7d: 1340, riskScore: 9.1, trend: "up" as const, disease: "Fever", region: "Godavari" as const, beds: 2800, bedsUsed: 2352, phcCount: 142 },
    { district: "Krishna", mandals: 46, activeCases: 1007, predicted7d: 1220, riskScore: 8.8, trend: "up" as const, disease: "Cough", region: "Delta" as const, beds: 3200, bedsUsed: 2624, phcCount: 128 },
    { district: "West Godavari", mandals: 47, activeCases: 917, predicted7d: 1085, riskScore: 8.5, trend: "stable" as const, disease: "Gastric", region: "Godavari" as const, beds: 2400, bedsUsed: 1872, phcCount: 118 },
    { district: "Visakhapatnam", mandals: 40, activeCases: 785, predicted7d: 940, riskScore: 7.8, trend: "up" as const, disease: "Fever", region: "North Andhra" as const, beds: 4200, bedsUsed: 3108, phcCount: 106 },
    { district: "Guntur", mandals: 48, activeCases: 745, predicted7d: 880, riskScore: 7.5, trend: "up" as const, disease: "Cough", region: "Delta" as const, beds: 2600, bedsUsed: 1924, phcCount: 132 },
    { district: "Nellore", mandals: 45, activeCases: 724, predicted7d: 850, riskScore: 7.2, trend: "stable" as const, disease: "Cough", region: "South Coastal" as const, beds: 2200, bedsUsed: 1540, phcCount: 124 },
    { district: "Vizianagaram", mandals: 34, activeCases: 696, predicted7d: 820, riskScore: 7.0, trend: "up" as const, disease: "Fever", region: "North Andhra" as const, beds: 1800, bedsUsed: 1314, phcCount: 98 },
    { district: "Srikakulam", mandals: 39, activeCases: 659, predicted7d: 775, riskScore: 6.8, trend: "stable" as const, disease: "Fever", region: "North Andhra" as const, beds: 1600, bedsUsed: 1120, phcCount: 110 },
    { district: "Prakasam", mandals: 49, activeCases: 601, predicted7d: 710, riskScore: 6.5, trend: "down" as const, disease: "Fever", region: "South Coastal" as const, beds: 1900, bedsUsed: 1235, phcCount: 138 },
    { district: "Kurnool", mandals: 40, activeCases: 473, predicted7d: 550, riskScore: 6.0, trend: "down" as const, disease: "Fever", region: "Rayalaseema" as const, beds: 2100, bedsUsed: 1365, phcCount: 115 },
    { district: "Chittoor", mandals: 36, activeCases: 397, predicted7d: 460, riskScore: 5.5, trend: "down" as const, disease: "Allergy", region: "Rayalaseema" as const, beds: 1700, bedsUsed: 1003, phcCount: 102 },
    { district: "Ananthapuramu", mandals: 38, activeCases: 286, predicted7d: 320, riskScore: 4.8, trend: "stable" as const, disease: "Fever", region: "Rayalaseema" as const, beds: 1500, bedsUsed: 810, phcCount: 108 },
    { district: "YSR Kadapa", mandals: 34, activeCases: 261, predicted7d: 295, riskScore: 4.5, trend: "stable" as const, disease: "Fever", region: "Rayalaseema" as const, beds: 1400, bedsUsed: 742, phcCount: 96 },
];

const diseaseFilters: DiseaseType[] = ["All", "Fever", "Cough", "Hypertension", "Diabetes", "Gastric", "Allergy"];
const regionFilters: Region[] = ["All", "North Andhra", "Godavari", "Delta", "South Coastal", "Rayalaseema"];
const timeframes = ["Last 7 Days", "Last 14 Days", "Last 30 Days"];

const fadeIn = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

// ─── RESOURCE DEPLOYMENT MODAL ───────────────────────────────────────────────
function DeploymentModal({
    type,
    district,
    onClose,
}: {
    type: "alert" | "beds";
    district: typeof districtTable[0];
    onClose: () => void;
}) {
    const [sending, setSending] = useState(false);
    const [alertMsg, setAlertMsg] = useState(
        type === "alert"
            ? `URGENT: ${district.disease} outbreak alert for ${district.district} District, Andhra Pradesh. ${district.activeCases} active cases reported across ${district.mandals} mandals. Predicted to reach ${district.predicted7d} in 7 days. All PHCs to activate emergency protocol. District risk score: ${district.riskScore}/10.`
            : ""
    );
    const [bedCount, setBedCount] = useState(50);
    const [fromFacility, setFromFacility] = useState("State Reserve");
    const [selectedCenters, setSelectedCenters] = useState<number[]>([0, 1, 2]);

    const centerNames = [
        `${district.district} PHC – Urban`,
        `${district.district} CHC – Central`,
        `${district.district} District Hospital`,
        `${district.district} PHC – Rural North`,
        `${district.district} PHC – Rural South`,
    ].slice(0, 5);

    const handleSend = () => {
        setSending(true);
        setTimeout(() => {
            setSending(false);
            if (type === "alert") {
                toast.success(
                    `Alert dispatched to ${selectedCenters.length} PHC/CHC facilities in ${district.district}`,
                    { description: "Emergency protocol activated. SMS & dashboard push sent to District Health Officer." }
                );
            } else {
                toast.success(
                    `${bedCount} beds allocated to ${district.district}`,
                    { description: `Resource deployment order confirmed from ${fromFacility}.` }
                );
            }
            onClose();
        }, 1500);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${type === "alert" ? "bg-red-50" : "bg-emerald-50"}`}>
                                {type === "alert" ? <Siren className="h-5 w-5 text-red-500" /> : <Hospital className="h-5 w-5 text-emerald-500" />}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    {type === "alert" ? "Issue Public Health Alert" : "Allocate Hospital Beds"}
                                </h3>
                                <p className="text-xs text-slate-500">{district.district}, Andhra Pradesh · Risk: {district.riskScore}/10</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5 space-y-4">
                        {type === "alert" ? (
                            <>
                                {/* Alert Message */}
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Alert Message</label>
                                    <textarea
                                        value={alertMsg}
                                        onChange={(e) => setAlertMsg(e.target.value)}
                                        rows={4}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                                    />
                                </div>

                                {/* Severity */}
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Severity Level</label>
                                    <div className="flex gap-2">
                                        {["Critical", "High", "Medium"].map((sev) => (
                                            <button
                                                key={sev}
                                                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${sev === "Critical"
                                                    ? "bg-red-50 text-red-600 ring-2 ring-red-200"
                                                    : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {sev}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* AYUSH Centers */}
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Target PHC / CHC Facilities ({selectedCenters.length} selected)
                                    </label>
                                    <div className="space-y-1.5">
                                        {centerNames.map((c, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedCenters((prev) =>
                                                    prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
                                                )}
                                                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs transition ${selectedCenters.includes(i)
                                                    ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <div className={`flex h-4 w-4 items-center justify-center rounded border transition ${selectedCenters.includes(i) ? "border-red-500 bg-red-500" : "border-slate-300"}`}>
                                                    {selectedCenters.includes(i) && <Check className="h-2.5 w-2.5 text-white" />}
                                                </div>
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Channels */}
                                <div className="flex gap-2">
                                    {[
                                        { label: "SMS Blast", icon: Send },
                                        { label: "Dashboard Push", icon: Bell },
                                        { label: "Radio Broadcast", icon: Radio },
                                    ].map((ch) => (
                                        <div key={ch.label} className="flex flex-1 items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-2 text-[10px] font-semibold text-emerald-700">
                                            <ch.icon className="h-3 w-3" />
                                            {ch.label}
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Current Status */}
                                <div className="rounded-xl bg-slate-50 p-4">
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div>
                                            <p className="text-lg font-bold text-slate-900">{district.beds.toLocaleString()}</p>
                                            <p className="text-[10px] text-slate-500">Total Beds</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-red-600">{district.bedsUsed.toLocaleString()}</p>
                                            <p className="text-[10px] text-slate-500">In Use</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-emerald-600">{(district.beds - district.bedsUsed).toLocaleString()}</p>
                                            <p className="text-[10px] text-slate-500">Available</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                                        <div
                                            className={`h-full rounded-full transition-all ${(district.bedsUsed / district.beds) > 0.85 ? "bg-red-500" : "bg-emerald-500"}`}
                                            style={{ width: `${(district.bedsUsed / district.beds) * 100}%` }}
                                        />
                                    </div>
                                    <p className="mt-1 text-right text-[10px] font-bold text-slate-400">
                                        {Math.round((district.bedsUsed / district.beds) * 100)}% occupied
                                    </p>
                                </div>

                                {/* Bed Count */}
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Beds to Allocate</label>
                                    <input
                                        type="number"
                                        value={bedCount}
                                        onChange={(e) => setBedCount(Number(e.target.value))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                                    />
                                </div>

                                {/* Source */}
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Source Facility</label>
                                    <div className="flex gap-2">
                                        {["State Reserve", "NDRF Pool", "Army Medical"].map((f) => (
                                            <button
                                                key={f}
                                                onClick={() => setFromFacility(f)}
                                                className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition ${fromFacility === f
                                                    ? "bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200"
                                                    : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Priority */}
                                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    <p className="text-xs text-amber-700">Deployment priority: <strong>P1 — Critical</strong>. Expected arrival in 6–8 hours.</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
                        <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={sending}
                            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-bold text-white shadow-lg transition ${type === "alert"
                                ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/25 hover:shadow-red-500/40"
                                : "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/25 hover:shadow-emerald-500/40"
                                } disabled:opacity-60`}
                        >
                            {sending ? (
                                <span className="flex items-center gap-2">
                                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="20 40" /></svg>
                                    {type === "alert" ? "Dispatching…" : "Processing…"}
                                </span>
                            ) : (
                                <>
                                    {type === "alert" ? <BellRing className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                                    {type === "alert" ? "Dispatch Alert" : "Confirm Allocation"}
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const Ministry = () => {
    const navigate = useNavigate();

    // Filters
    const [disease, setDisease] = useState<DiseaseType>("All");
    const [region, setRegion] = useState<Region>("All");
    const [timeframe, setTimeframe] = useState(timeframes[0]);
    const [selectedDistrict, setSelectedDistrict] = useState<string>("All");

    // Map / timeline
    const [timelineDay, setTimelineDay] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Chart
    const [scenario, setScenario] = useState<Scenario>("baseline");

    // Modal
    const [modal, setModal] = useState<{ type: "alert" | "beds"; district: typeof districtTable[0] } | null>(null);

    // ─── Timeline Play/Pause ─────────────────────────────────────────────
    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setTimelineDay((prev) => {
                    if (prev >= 6) {
                        setIsPlaying(false);
                        return 6;
                    }
                    return prev + 1;
                });
            }, 900);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isPlaying]);

    const playTimeline = useCallback(() => {
        if (timelineDay >= 6) setTimelineDay(0);
        setIsPlaying(true);
    }, [timelineDay]);

    // ─── Filtered Data ───────────────────────────────────────────────────
    const filteredDistricts = heatmapDistricts.filter((d) => {
        if (disease !== "All" && d.disease !== disease) return false;
        if (region !== "All" && d.region !== region) return false;
        return true;
    });

    const filteredTable = districtTable.filter((d) => {
        if (disease !== "All" && d.disease !== disease) return false;
        if (region !== "All" && d.region !== region) return false;
        return true;
    });

    // Map nodes: filter by disease, region, district
    const mapNodes = filteredDistricts
        .filter((d) => selectedDistrict === "All" || d.name === selectedDistrict)
        .map((d) => ({ name: d.name, lat: d.lat, lng: d.lng, intensity: d.intensity, cases: d.cases, capacity: d.capacity, disease: d.disease }));

    const selectedDistrictData = selectedDistrict !== "All" ? filteredDistricts.find(d => d.name === selectedDistrict) : null;

    return (
        <div className="relative min-h-screen bg-slate-50">
            {/* Gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-800 via-red-500 to-emerald-500" />

            {/* Header */}
            <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
                <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate("/login")} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 shadow-lg shadow-slate-800/30">
                                <Building2 className="h-4.5 w-4.5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-slate-900">AP Health Intelligence Platform</h1>
                                <p className="text-[10px] text-slate-500">Public Health Surveillance · Andhra Pradesh State Dashboard</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold text-red-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                            {filteredTable.filter((d) => d.riskScore > 8).length} Critical Zones
                        </span>
                        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            LIVE
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                            <Shield className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                    </div>
                </div>
            </header>

            {/* ─── GLASS CONTROL BAR ──────────────────────────────────────────── */}
            <div className="sticky top-[57px] z-20 border-b border-slate-200/60 bg-white/60 backdrop-blur-xl">
                <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-6 py-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <Filter className="h-3 w-3" /> Filters
                    </div>

                    {/* Disease */}
                    <div className="relative">
                        <select
                            value={disease}
                            onChange={(e) => setDisease(e.target.value as DiseaseType)}
                            className="appearance-none rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 pr-7 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        >
                            {diseaseFilters.map((d) => <option key={d} value={d}>{d === "All" ? "All Diseases" : d}</option>)}
                        </select>
                        <Thermometer className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                    </div>

                    {/* Region */}
                    <div className="relative">
                        <select
                            value={region}
                            onChange={(e) => setRegion(e.target.value as Region)}
                            className="appearance-none rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 pr-7 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        >
                            {regionFilters.map((r) => <option key={r} value={r}>{r === "All" ? "All Regions" : r}</option>)}
                        </select>
                        <Globe className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                    </div>

                    {/* Timeframe */}
                    <div className="relative">
                        <select
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value)}
                            className="appearance-none rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 pr-7 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        >
                            {timeframes.map((t) => <option key={t}>{t}</option>)}
                        </select>
                        <Clock className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                    </div>

                    {/* Select District */}
                    <div className="relative">
                        <select
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="appearance-none rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 pr-7 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        >
                            {DISTRICT_OPTIONS.map((d) => (
                                <option key={d} value={d}>{d === "All" ? "All Districts" : d}</option>
                            ))}
                        </select>
                        <MapPin className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="ml-auto flex items-center gap-2 text-[10px] text-slate-400">
                        <Activity className="h-3 w-3 text-emerald-500" />
                        Last sync: 2 min ago
                    </div>
                </div>
            </div>

            <main className="mx-auto max-w-[1440px] px-6 py-6">

                {/* ─── KPI Cards ──────────────────────────────────────────────── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {kpis.map((kpi, i) => (
                        <motion.div
                            key={kpi.label} {...fadeIn} transition={{ delay: i * 0.04 }}
                            className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-lg ${kpi.glow} transition hover:shadow-xl hover:${kpi.glow}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{kpi.label}</span>
                                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.gradient} shadow-lg`}>
                                    <kpi.icon className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <p className="mt-2 text-2xl font-black text-slate-900 tracking-tight">{kpi.value}</p>
                            <div className={`mt-1 flex items-center gap-1 text-xs font-bold ${kpi.up ? "text-red-500" : "text-emerald-500"}`}>
                                {kpi.up ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                {kpi.change} vs last week
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ─── MIDDLE: Heatmap + Chart ────────────────────────────────── */}
                <div className="mt-6 grid gap-6 lg:grid-cols-5">

                    {/* ─── LEAFLET MAP ─────────────────────────────────────────── */}
                    <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg lg:col-span-3">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">Spatiotemporal Heatmap</h2>
                                <p className="text-[10px] text-slate-500">Disease cluster density · Day {timelineDay + 1} simulation</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {[
                                    { label: "Critical", color: "bg-red-500" },
                                    { label: "High", color: "bg-amber-500" },
                                    { label: "Moderate", color: "bg-emerald-500" },
                                ].map((l) => (
                                    <span key={l.label} className="flex items-center gap-1 text-[9px] font-semibold text-slate-400">
                                        <span className={`h-2 w-2 rounded-full ${l.color}`} /> {l.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* District focus card — shown when a specific district is selected */}
                        {selectedDistrictData && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm"
                            >
                                <p className="text-xs font-bold uppercase tracking-wider text-amber-800">{selectedDistrictData.name} District Focus</p>
                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {selectedDistrictData.cases} active cases · Top condition: {selectedDistrictData.disease} · Region: {selectedDistrictData.region}
                                </p>
                            </motion.div>
                        )}

                        {/* Real Leaflet map — loaded with lazy + Suspense (use next/dynamic ssr: false in Next.js) */}
                        <div className="relative h-[340px] overflow-hidden rounded-xl border border-slate-200">
                            <Suspense
                                fallback={
                                    <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-100">
                                        <span className="text-xs text-slate-500">Loading map…</span>
                                    </div>
                                }
                            >
                                <MapComponent nodes={mapNodes} timelineDay={timelineDay} />
                            </Suspense>
                            {mapNodes.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-500">
                                    No districts match current filters
                                </div>
                            )}
                        </div>

                        {/* Timeline Slider */}
                        <div className="mt-4 flex items-center gap-3">
                            <button
                                onClick={() => isPlaying ? setIsPlaying(false) : playTimeline()}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-md transition hover:bg-slate-800"
                            >
                                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                            </button>
                            <div className="flex-1">
                                <input
                                    type="range"
                                    min={0} max={6} value={timelineDay}
                                    onChange={(e) => { setTimelineDay(Number(e.target.value)); setIsPlaying(false); }}
                                    className="w-full cursor-pointer accent-red-500"
                                />
                                <div className="mt-0.5 flex justify-between text-[9px] font-semibold text-slate-400">
                                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                                        <span key={d} className={i === timelineDay ? "text-red-500" : ""}>{d}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ─── OUTBREAK CHART ──────────────────────────────────────── */}
                    <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg lg:col-span-2">
                        <div className="mb-3">
                            <h2 className="text-sm font-bold text-slate-900">7-Day Outbreak Trend</h2>
                            <p className="text-[10px] text-slate-500">Actual vs scenario-based projections</p>
                        </div>

                        {/* Scenario Toggles */}
                        <div className="mb-4 flex gap-1.5">
                            {([
                                { key: "baseline" as Scenario, label: "Baseline", color: "emerald" },
                                { key: "intervention" as Scenario, label: "With Intervention", color: "blue" },
                                { key: "worstCase" as Scenario, label: "Worst Case", color: "red" },
                            ]).map((s) => (
                                <button
                                    key={s.key}
                                    onClick={() => setScenario(s.key)}
                                    className={`rounded-full px-3 py-1 text-[10px] font-bold transition ${scenario === s.key
                                        ? s.color === "emerald" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                            : s.color === "blue" ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                                                : "bg-red-50 text-red-700 ring-1 ring-red-200"
                                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                        }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        {/* Chart */}
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={baseOutbreak}>
                                    <defs>
                                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={scenario === "worstCase" ? "#ef4444" : scenario === "intervention" ? "#3b82f6" : "#10b981"} stopOpacity={0.2} />
                                            <stop offset="100%" stopColor={scenario === "worstCase" ? "#ef4444" : scenario === "intervention" ? "#3b82f6" : "#10b981"} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#1e293b", border: "none",
                                            borderRadius: "12px", fontSize: "11px", color: "#f8fafc",
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey={scenario}
                                        name={scenario === "baseline" ? "Baseline" : scenario === "intervention" ? "With Intervention" : "Worst Case"}
                                        stroke={scenario === "worstCase" ? "#ef4444" : scenario === "intervention" ? "#3b82f6" : "#10b981"}
                                        strokeWidth={2.5}
                                        fill="url(#areaGrad)"
                                        dot={{ r: 4, fill: scenario === "worstCase" ? "#ef4444" : scenario === "intervention" ? "#3b82f6" : "#10b981" }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="predicted"
                                        name="AI Predicted"
                                        stroke="#f59e0b"
                                        strokeWidth={1.5}
                                        strokeDasharray="6 3"
                                        dot={{ r: 3, fill: "#f59e0b" }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <span className={`h-2 w-5 rounded-full ${scenario === "worstCase" ? "bg-red-500" : scenario === "intervention" ? "bg-blue-500" : "bg-emerald-500"}`} />
                                {scenario === "baseline" ? "Baseline" : scenario === "intervention" ? "With Intervention" : "Worst Case"}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-px w-5 border-t-2 border-dashed border-amber-500" /> AI Predicted
                            </span>
                        </div>

                        {/* Scenario insight */}
                        <div className={`mt-4 rounded-lg p-3 text-xs ${scenario === "worstCase" ? "bg-red-50 text-red-700" : scenario === "intervention" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
                            {scenario === "baseline" && "Current trajectory: AP cases projected to reach ~445/day by Saturday. Moderate PHC resource strain expected across Godavari and Delta regions."}
                            {scenario === "intervention" && "With early PHC mobilisation + district health officer deployment, peak reduces by 18%. OPD load stays within manageable range across AP."}
                            {scenario === "worstCase" && "Without intervention: rapid spread predicted across East Godavari, Krishna, and Visakhapatnam. Peak 565 cases/day by Sunday. District hospital capacity will breach."}
                        </div>
                    </motion.div>
                </div>

                {/* ─── DISTRICT TABLE ─────────────────────────────────────────── */}
                <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">High-Risk District Surveillance</h2>
                            <p className="text-[10px] text-slate-500">{filteredTable.length} districts under active monitoring</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
                                {filteredTable.filter((d) => d.riskScore > 8).length} Critical
                            </span>
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600">
                                {filteredTable.filter((d) => d.riskScore > 6 && d.riskScore <= 8).length} High
                            </span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    {["District", "Region", "Disease", "Active Cases", "7d Predicted", "AI Risk", "Trend", "Quick Action"].map((h) => (
                                        <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTable.map((row) => (
                                    <tr key={row.district} className="border-b border-slate-50 transition-colors hover:bg-slate-50/60">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <MapPin className={`h-3.5 w-3.5 ${row.riskScore > 8 ? "text-red-400" : "text-slate-400"}`} />
                                                <span className="text-sm font-semibold text-slate-800">{row.district}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-slate-500">{row.region}</td>
                                        <td className="px-5 py-3.5">
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                                                {row.disease}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm font-bold text-slate-800">{row.activeCases.toLocaleString()}</td>
                                        <td className="px-5 py-3.5 text-sm text-slate-600">{row.predicted7d.toLocaleString()}</td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${row.riskScore > 8 ? "bg-red-500" : row.riskScore > 6 ? "bg-amber-500" : "bg-emerald-500"}`}
                                                        style={{ width: `${(row.riskScore / 10) * 100}%` }}
                                                    />
                                                </div>
                                                <span className={`text-xs font-black ${row.riskScore > 8 ? "text-red-600" : row.riskScore > 6 ? "text-amber-600" : "text-emerald-600"}`}>
                                                    {row.riskScore}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`flex items-center gap-0.5 text-xs font-bold ${row.trend === "up" ? "text-red-500" : row.trend === "down" ? "text-emerald-500" : "text-slate-400"}`}>
                                                {row.trend === "up" ? <TrendingUp className="h-3 w-3" /> : row.trend === "down" ? <ChevronDown className="h-3 w-3" /> : "—"}
                                                {row.trend === "stable" ? "Stable" : row.trend}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => setModal({ type: "alert", district: row })}
                                                    className="rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-600 transition hover:bg-red-100 hover:shadow-sm"
                                                >
                                                    <BellRing className="mr-1 inline h-3 w-3" />
                                                    Alert
                                                </button>
                                                <button
                                                    onClick={() => setModal({ type: "beds", district: row })}
                                                    className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-600 transition hover:bg-emerald-100 hover:shadow-sm"
                                                >
                                                    <Truck className="mr-1 inline h-3 w-3" />
                                                    Beds
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredTable.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-10 text-center text-xs text-slate-400">
                                            No districts match current filter criteria
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Footer */}
                <p className="mt-6 text-center text-[10px] text-slate-400">
                    <Shield className="mr-1 inline h-3 w-3" />
                    AP Health Intelligence Platform · Health, Medical & Family Welfare Department, Govt. of Andhra Pradesh · All actions are logged and audited
                </p>
            </main>

            {/* ─── DEPLOYMENT MODAL ───────────────────────────────────────────── */}
            {modal && (
                <DeploymentModal
                    type={modal.type}
                    district={modal.district}
                    onClose={() => setModal(null)}
                />
            )}
        </div>
    );
};

export default Ministry;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Stethoscope,
    Building2,
    ArrowRight,
    Lock,
    Mail,
    Activity,
    Shield,
    MapPin,
    Hospital,
    Users,
    Heart,
    PlayCircle,
    Info,
    Database,
    Phone,
    HelpCircle,
    ChevronRight,
} from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import GuidedDemo from "@/components/GuidedDemo";

/**
 * AP Health IQ — Hero / Login page
 *
 * Professional government-style palette (NO dark theme, NO glassmorphism, NO
 * decorative animations). All sections are full-bleed (100% width).
 *
 *   Navy Blue       : #0D47A1
 *   Electric Blue   : #1976D2
 *   Sky Blue        : #E3F2FD
 *   Light Blue line : #90CAF9
 *   Page background : #F4F8FC
 *   White surfaces  : #FFFFFF
 */
const NAVY = "#0D47A1";
const ELECTRIC = "#1976D2";
const SKY = "#E3F2FD";
const SKY_LINE = "#90CAF9";
const PAGE_BG = "#F4F8FC";

const roles = [
    {
        id: "state" as const,
        icon: Building2,
        route: "/state-dashboard",
        badge: { label: "Fully Optimized", color: "#0D47A1", bg: "#E3F2FD" },
    },
    {
        id: "district" as const,
        icon: MapPin,
        route: "/district-dashboard",
        badge: { label: "New Data", color: "#1565C0", bg: "#E1F5FE" },
    },
    {
        id: "chc" as const,
        icon: Hospital,
        route: "/chc-dashboard",
        badge: { label: "Active", color: "#2E7D32", bg: "#E8F5E9" },
    },
    {
        id: "phc" as const,
        icon: Stethoscope,
        route: "/phc-dashboard",
        badge: { label: "Fully Optimized", color: "#0D47A1", bg: "#E3F2FD" },
    },
    {
        id: "field" as const,
        icon: Users,
        route: "/field-dashboard",
        badge: { label: "Offline Capable", color: "#6A1B9A", bg: "#F3E5F5" },
    },
    {
        id: "citizen" as const,
        icon: Heart,
        route: "/citizen-portal",
        badge: { label: "Public Access", color: "#AD1457", bg: "#FCE4EC" },
    },
];

type RoleId = "state" | "district" | "chc" | "phc" | "field" | "citizen";

const SOURCE_RECORDS = [
    {
        source: "OPD Records (PHC / UPHC)",
        coverage: "29 districts · 700+ PHCs",
        status: "Live",
        statusColor: "#2E7D32",
        statusBg: "#E8F5E9",
        updated: "Real-time",
    },
    {
        source: "ANM / ASHA Field Signals",
        coverage: "Sub-centre level · all blocks",
        status: "Daily Sync",
        statusColor: "#0D47A1",
        statusBg: "#E3F2FD",
        updated: "Every 24 hr",
    },
    {
        source: "IDSP Weekly Surveillance",
        coverage: "Govt of India · National",
        status: "Validated",
        statusColor: "#6A1B9A",
        statusBg: "#F3E5F5",
        updated: "Weekly (Mon)",
    },
    {
        source: "ABHA / Citizen Registry",
        coverage: "Consented citizens · DPDP Act 2023",
        status: "Encrypted",
        statusColor: "#AD1457",
        statusBg: "#FCE4EC",
        updated: "On consent",
    },
    {
        source: "Lab / Diagnostic Feeds",
        coverage: "District Hospitals + private labs",
        status: "Pilot",
        statusColor: "#E65100",
        statusBg: "#FFF3E0",
        updated: "Phase 2",
    },
];

const Login = () => {
    const navigate = useNavigate();
    const { t, isRTL } = useLang();
    const [selectedRole, setSelectedRole] = useState<RoleId | null>(null);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [guidedDemoOpen, setGuidedDemoOpen] = useState(false);

    const roleLabel = (id: string) => {
        const map: Record<string, string> = {
            state: t("role_state"), district: t("role_district"), chc: t("role_chc"),
            phc: t("role_phc"), field: t("role_field"), citizen: t("role_citizen"),
        };
        return map[id] || id;
    };
    const roleDesignation = (id: string) => {
        const map: Record<string, string> = {
            state: t("role_state_desig"), district: t("role_district_desig"), chc: t("role_chc_desig"),
            phc: t("role_phc_desig"), field: t("role_field_desig"), citizen: t("role_citizen_desig"),
        };
        return map[id] || "";
    };
    const roleDesc = (id: string) => {
        const map: Record<string, string> = {
            state: t("role_state_desc"), district: t("role_district_desc"), chc: t("role_chc_desc"),
            phc: t("role_phc_desc"), field: t("role_field_desc"), citizen: t("role_citizen_desc"),
        };
        return map[id] || "";
    };
    const roleLevel = (id: string) => {
        const map: Record<string, string> = {
            state: t("level_state"), district: t("level_district"), chc: t("level_chc"),
            phc: t("level_phc"), field: t("level_field"), citizen: t("level_citizen"),
        };
        return map[id] || "";
    };

    const handleRoleSelect = (roleId: RoleId) => {
        if (roleId === "citizen") {
            navigate("/citizen-portal");
            return;
        }
        setSelectedRole(roleId);
        setError("");
        setUsername("");
        setPassword("");
    };

    const handleSignIn = () => {
        if (!username.trim() || !password.trim()) { setError(t("login_error_blank")); return; }
        const role = roles.find((r) => r.id === selectedRole);
        if (role) navigate(role.route);
    };

    const activeRole = roles.find((r) => r.id === selectedRole);

    // ─── Sign-in panel takeover ─────────────────────────────────────────
    if (selectedRole && activeRole) {
        return (
            <div className="min-h-screen w-full" style={{ background: PAGE_BG }}>
                {/* Top nav — full width */}
                <header className="w-full border-b" style={{ background: "#FFFFFF", borderColor: SKY_LINE }}>
                    <div className="w-full flex items-center justify-between px-8 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md" style={{ background: NAVY }}>
                                <Activity className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-base font-bold leading-tight" style={{ color: NAVY }}>AP Health IQ</p>
                                <p className="text-[11px] text-slate-600 leading-tight">Govt. of Andhra Pradesh</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setSelectedRole(null); setError(""); }}
                            className="text-sm font-semibold hover:underline"
                            style={{ color: NAVY }}
                        >
                            ← Back to home
                        </button>
                    </div>
                </header>

                <main className="w-full flex items-center justify-center px-6 py-16">
                    <div
                        className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm"
                        style={{ borderColor: SKY_LINE }}
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: SKY }}>
                                <activeRole.icon className="h-4 w-4" style={{ color: NAVY }} />
                                <span className="text-xs font-bold" style={{ color: NAVY }}>{roleLabel(activeRole.id)}</span>
                            </div>
                        </div>

                        <h2 dir={isRTL ? "rtl" : "ltr"} className="text-2xl font-bold text-slate-900">{t("login_signin")}</h2>
                        <p dir={isRTL ? "rtl" : "ltr"} className="mt-1 text-sm text-slate-600">{t("login_enter_credentials")}</p>

                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                                    {t("login_username")}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={username}
                                        onChange={(e) => { setUsername(e.target.value); setError(""); }}
                                        placeholder="Enter username"
                                        className="w-full rounded-md border bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none"
                                        style={{ borderColor: SKY_LINE }}
                                        onFocus={(e) => (e.currentTarget.style.borderColor = ELECTRIC)}
                                        onBlur={(e) => (e.currentTarget.style.borderColor = SKY_LINE)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                                    {t("login_password")}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                        type="password"
                                        placeholder="Enter password"
                                        onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                                        className="w-full rounded-md border bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none"
                                        style={{ borderColor: SKY_LINE }}
                                        onFocus={(e) => (e.currentTarget.style.borderColor = ELECTRIC)}
                                        onBlur={(e) => (e.currentTarget.style.borderColor = SKY_LINE)}
                                    />
                                </div>
                            </div>
                            {error && <p className="text-xs font-medium text-red-600">{error}</p>}
                            <button
                                onClick={handleSignIn}
                                className="w-full rounded-md py-3.5 text-sm font-bold text-white"
                                style={{ background: NAVY }}
                            >
                                {t("login_signin")}
                            </button>
                        </div>
                    </div>
                </main>

                <GuidedDemo open={guidedDemoOpen} onClose={() => setGuidedDemoOpen(false)} />
            </div>
        );
    }

    // ─── Hero / Landing — every section full width (100%) ──────────────
    return (
        <div className="min-h-screen w-full" style={{ background: PAGE_BG }}>

            {/* ─── HEADER (full width, white, navy text) ─── */}
            <header className="w-full border-b" style={{ background: "#FFFFFF", borderColor: SKY_LINE }}>
                <div className="w-full flex items-center justify-between px-8 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md" style={{ background: NAVY }}>
                            <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-base font-bold leading-tight" style={{ color: NAVY }}>AP Health IQ</p>
                            <p className="text-[11px] text-slate-600 leading-tight">Govt. of Andhra Pradesh · Public Health Platform</p>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-6 text-sm font-semibold" style={{ color: NAVY }}>
                        <a href="#hero" className="hover:underline">Home</a>
                        <a href="#sources" className="hover:underline">Data Sources</a>
                        <a href="#roles" className="hover:underline">Sign In</a>
                        <a href="#contact" className="hover:underline">Contact</a>
                    </nav>

                    <div className="flex items-center gap-2">
                        <LanguageToggle />
                        <button
                            onClick={() => setGuidedDemoOpen(true)}
                            className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold text-white"
                            style={{ background: NAVY }}
                        >
                            <PlayCircle className="h-3.5 w-3.5" />
                            Guided Demo
                        </button>
                    </div>
                </div>
            </header>

            {/* ─── HERO (full width, navy → electric blue gradient) ─── */}
            <section
                id="hero"
                className="w-full px-8 py-24"
                style={{
                    background: `linear-gradient(135deg, ${NAVY} 0%, ${ELECTRIC} 100%)`,
                }}
            >
                <div className="w-full text-center">
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest mb-6"
                        style={{ background: "rgba(255,255,255,0.18)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.35)" }}
                    >
                        <Shield className="h-3 w-3" />
                        Govt of AP · DPDP Act 2023 Compliant
                    </span>

                    <h1
                        dir={isRTL ? "rtl" : "ltr"}
                        className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white"
                    >
                        {t("login_title")}
                    </h1>

                    <p
                        dir={isRTL ? "rtl" : "ltr"}
                        className="mt-5 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed"
                        style={{ color: "#E3F2FD" }}
                    >
                        {t("login_subtitle")} — A unified disease surveillance and health
                        intelligence platform connecting State Health Officers, District units,
                        CHCs, PHCs, ANM/ASHA field workers and citizens through one secure
                        government channel.
                    </p>

                    <p className="mt-2 text-xs" style={{ color: "#BBDEFB" }}>{t("login_dept")}</p>

                    <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
                        <a
                            href="#roles"
                            className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-bold"
                            style={{ background: "#FFFFFF", color: NAVY }}
                        >
                            Sign In to Your Role
                            <ArrowRight className="h-4 w-4" />
                        </a>
                        <button
                            onClick={() => setGuidedDemoOpen(true)}
                            className="inline-flex items-center gap-2 rounded-md border-2 px-6 py-3 text-sm font-bold text-white"
                            style={{ borderColor: "#FFFFFF", background: "transparent" }}
                        >
                            <PlayCircle className="h-4 w-4" />
                            Start Guided Demo
                        </button>
                    </div>

                    {/* Quick stats — full-width strip on hero */}
                    <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
                        {[
                            { v: "29", l: "Districts" },
                            { v: "700+", l: "PHCs" },
                            { v: "26", l: "Mandals (live)" },
                            { v: "DPDP", l: "Compliant" },
                        ].map((s) => (
                            <div
                                key={s.l}
                                className="rounded-md px-4 py-4 text-center"
                                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}
                            >
                                <p className="text-3xl font-extrabold text-white">{s.v}</p>
                                <p className="text-[11px] uppercase tracking-wider mt-1" style={{ color: "#BBDEFB" }}>{s.l}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── SOURCE OF RECORDS (full width, white background) ─── */}
            <section id="sources" className="w-full px-8 py-16" style={{ background: "#FFFFFF" }}>
                <div className="w-full">
                    <div className="mb-8 text-center">
                        <p
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                            style={{ background: SKY, color: NAVY }}
                        >
                            <Database className="h-3 w-3" /> Source of Records
                        </p>
                        <h2 className="mt-3 text-3xl font-extrabold" style={{ color: NAVY }}>
                            Authoritative Health Data Pipelines
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 max-w-2xl mx-auto">
                            Every dashboard signal is traceable to a verified Govt. of AP / Govt. of India source.
                        </p>
                    </div>

                    <div className="w-full overflow-hidden rounded-lg border" style={{ borderColor: SKY_LINE }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead style={{ background: SKY }}>
                                    <tr>
                                        <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: NAVY }}>
                                            Data Source
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: NAVY }}>
                                            Coverage
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: NAVY }}>
                                            Status
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: NAVY }}>
                                            Updated
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {SOURCE_RECORDS.map((row, i) => (
                                        <tr
                                            key={row.source}
                                            style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F8FBFE" }}
                                            className="border-t"
                                        >
                                            <td className="px-6 py-4 font-semibold text-slate-900">{row.source}</td>
                                            <td className="px-6 py-4 text-slate-600">{row.coverage}</td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                                                    style={{ background: row.statusBg, color: row.statusColor }}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{row.updated}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── ROLE BENTO GRID (full width) ─── */}
            <section id="roles" className="w-full px-8 py-16" style={{ background: PAGE_BG }}>
                <div className="w-full">
                    <div className="mb-8 text-center">
                        <p
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                            style={{ background: SKY, color: NAVY }}
                        >
                            <Users className="h-3 w-3" /> Choose Your Access Level
                        </p>
                        <h2 className="mt-3 text-3xl font-extrabold" style={{ color: NAVY }}>
                            {t("login_select_role")}
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 max-w-2xl mx-auto">
                            Each role surfaces only the data and tools relevant to that level — enforced by role-based access control.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {roles.map((role) => (
                            <button
                                key={role.id}
                                onClick={() => handleRoleSelect(role.id)}
                                className="group relative flex flex-col items-start text-left rounded-lg border bg-white p-6 hover:shadow-md"
                                style={{ borderColor: SKY_LINE }}
                            >
                                <div className="flex w-full items-start justify-between mb-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-md" style={{ background: SKY }}>
                                        <role.icon className="h-5 w-5" style={{ color: NAVY }} />
                                    </div>
                                    <span
                                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                                        style={{ background: role.badge.bg, color: role.badge.color }}
                                    >
                                        {role.badge.label}
                                    </span>
                                </div>

                                <h3 className="text-base font-bold text-slate-900">{roleLabel(role.id)}</h3>
                                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: NAVY }}>
                                    {roleLevel(role.id)}
                                </p>
                                <p className="mt-2 text-xs text-slate-500 font-medium">{roleDesignation(role.id)}</p>
                                <p className="mt-2 text-sm text-slate-700 leading-relaxed">{roleDesc(role.id)}</p>

                                <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: NAVY }}>
                                    {role.id === "citizen" ? "Open Public Portal" : "Sign In"}
                                    <ChevronRight className="h-4 w-4" />
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Demo credentials */}
                    <div className="mt-8 w-full rounded-lg border p-5" style={{ borderColor: SKY_LINE, background: "#FFFFFF" }}>
                        <div className="flex items-start gap-3">
                            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: NAVY }} />
                            <div className="text-xs text-slate-700">
                                <p className="font-bold mb-1" style={{ color: NAVY }}>
                                    Demo Credentials (synthetic / anonymised data only)
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 font-mono text-[11px]">
                                    <span>state_officer / pass123</span>
                                    <span>district_officer / pass123</span>
                                    <span>phc_officer / pass123</span>
                                    <span>field_worker / pass123</span>
                                </div>
                                <p className="mt-2 text-[11px] text-slate-500 italic">
                                    Any non-empty username + password is accepted in demo mode. Production deployment will use SSO via state IT department.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── FOOTER (full width, navy) ─── */}
            <footer id="contact" className="w-full" style={{ background: NAVY, color: "#FFFFFF" }}>
                <div className="w-full px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: "#FFFFFF" }}>
                                    <Activity className="h-4 w-4" style={{ color: NAVY }} />
                                </div>
                                <p className="text-base font-bold text-white">AP Health IQ</p>
                            </div>
                            <p className="text-xs max-w-md leading-relaxed" style={{ color: "#BBDEFB" }}>
                                A Govt. of Andhra Pradesh public health intelligence platform —
                                connecting district health officers, primary care, field workers and
                                citizens through one secure DPDP-compliant channel.
                            </p>
                        </div>

                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-white">Platform</p>
                            <ul className="space-y-1.5 text-xs" style={{ color: "#BBDEFB" }}>
                                <li><a href="#hero" className="hover:underline hover:text-white">Overview</a></li>
                                <li><a href="#sources" className="hover:underline hover:text-white">Data Sources</a></li>
                                <li><a href="#roles" className="hover:underline hover:text-white">Sign In</a></li>
                                <li>
                                    <button onClick={() => setGuidedDemoOpen(true)} className="hover:underline hover:text-white text-left">
                                        Guided Demo
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-white">Contact</p>
                            <ul className="space-y-1.5 text-xs" style={{ color: "#BBDEFB" }}>
                                <li className="flex items-center gap-2">
                                    <Phone className="h-3 w-3" /> 1075 (Health Helpline)
                                </li>
                                <li className="flex items-center gap-2">
                                    <Mail className="h-3 w-3" /> ap.health@ap.gov.in
                                </li>
                                <li className="flex items-center gap-2">
                                    <HelpCircle className="h-3 w-3" /> DPDP grievance
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 pt-5 border-t flex items-center justify-between flex-wrap gap-2" style={{ borderColor: "rgba(255,255,255,0.20)" }}>
                        <p className="text-[11px]" style={{ color: "#BBDEFB" }}>
                            <Shield className="mr-1 inline h-3 w-3" />
                            © Govt. of Andhra Pradesh · End-to-end encrypted · HIPAA + DPDP 2023 compliant
                        </p>
                        <p className="text-[11px]" style={{ color: "#BBDEFB" }}>v2.6 · Pilot: Krishna / East Godavari</p>
                    </div>
                </div>
            </footer>

            <GuidedDemo open={guidedDemoOpen} onClose={() => setGuidedDemoOpen(false)} />
        </div>
    );
};

export default Login;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

const roles = [
    {
        id: "state" as const,
        label: "State Health Officer",
        designation: "Commissioner / Director, Public Health",
        description: "Statewide disease surveillance, outbreak clusters, IDSP status",
        icon: Building2,
        gradient: "from-slate-700 to-slate-900",
        bgLight: "bg-slate-50",
        textColor: "text-slate-700",
        route: "/state-dashboard",
        level: "State Level",
    },
    {
        id: "district" as const,
        label: "District Health Officer",
        designation: "DM&HO / District Surveillance Officer",
        description: "District disease trends, mandal breakdown, PHC performance, IDSP reports",
        icon: MapPin,
        gradient: "from-blue-600 to-indigo-700",
        bgLight: "bg-blue-50",
        textColor: "text-blue-700",
        route: "/district-dashboard",
        level: "District Level",
    },
    {
        id: "chc" as const,
        label: "CHC Medical Officer",
        designation: "CHC Superintendent / Block Medical Officer",
        description: "Block-level referrals, disease classification results, feedback loop",
        icon: Hospital,
        gradient: "from-violet-500 to-purple-700",
        bgLight: "bg-violet-50",
        textColor: "text-violet-700",
        route: "/chc-dashboard",
        level: "CHC / Block Level",
    },
    {
        id: "phc" as const,
        label: "PHC Medical Officer",
        designation: "Medical Officer PHC / UPHC",
        description: "OP records, AI disease classification, ICD/SNOMED mapping, validation",
        icon: Stethoscope,
        gradient: "from-teal-500 to-emerald-600",
        bgLight: "bg-teal-50",
        textColor: "text-teal-700",
        route: "/phc-dashboard",
        level: "PHC Level",
    },
    {
        id: "field" as const,
        label: "ANM / ASHA / Anganwadi",
        designation: "Sub-centre Field Health Worker",
        description: "Daily community signal reporting — fever, diarrhea, maternal health",
        icon: Users,
        gradient: "from-emerald-400 to-teal-500",
        bgLight: "bg-emerald-50",
        textColor: "text-emerald-700",
        route: "/field-dashboard",
        level: "Sub-centre / Village Level",
    },
    {
        id: "citizen" as const,
        label: "AP Citizen",
        designation: "Public Health Information Portal",
        description: "Disease alerts, PHC load, screenings & your anonymised health record",
        icon: Heart,
        gradient: "from-rose-400 to-pink-500",
        bgLight: "bg-rose-50",
        textColor: "text-rose-700",
        route: "/citizen-portal",
        level: "Public Citizen Access",
    },
];

type RoleId = "state" | "district" | "chc" | "phc" | "field" | "citizen";

const Login = () => {
    const navigate = useNavigate();
    const { t, isRTL } = useLang();
    const [selectedRole, setSelectedRole] = useState<RoleId | null>(null);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Lookup translated role labels
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
        // Citizens skip auth — go straight to portal
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

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-50">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgb(15 23 42) 1px, transparent 0)`,
                backgroundSize: "40px 40px",
            }} />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />

            <div className="relative flex min-h-screen items-center justify-center px-6">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10 text-center"
                    >
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                            <Activity className="h-7 w-7 text-white" />
                        </div>
                        <h1 dir={isRTL ? "rtl" : "ltr"} className="text-3xl font-bold tracking-tight text-slate-900">{t("login_title")}</h1>
                        <p dir={isRTL ? "rtl" : "ltr"} className="mt-1.5 text-sm text-slate-500">{t("login_subtitle")}</p>
                        <p dir={isRTL ? "rtl" : "ltr"} className="mt-0.5 text-[11px] text-slate-400">{t("login_dept")}</p>
                        <div className="mt-4 flex justify-center"><LanguageToggle size="md" /></div>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {!selectedRole ? (
                            /* ─── Role Selection ─── */
                            <motion.div
                                key="roles"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                className="space-y-3"
                            >
                                <p dir={isRTL ? "rtl" : "ltr"} className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
                                    {t("login_select_role")}
                                </p>
                                {roles.map((role, i) => (
                                    <motion.button
                                        key={role.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.07 }}
                                        onClick={() => handleRoleSelect(role.id)}
                                        className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                                    >
                                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${role.gradient} shadow-sm`}>
                                            <role.icon className="h-5 w-5 text-white" />
                                        </div>
                                        <div dir={isRTL ? "rtl" : "ltr"} className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-slate-900">{roleLabel(role.id)}</p>
                                                <span className={`hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${role.bgLight} ${role.textColor}`}>{roleLevel(role.id)}</span>
                                            </div>
                                            <p className="mt-0.5 text-[11px] text-slate-400 font-medium">{roleDesignation(role.id)}</p>
                                            <p className="mt-0.5 text-xs text-slate-500 truncate">{roleDesc(role.id)}</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-slate-500" />
                                    </motion.button>
                                ))}
                            </motion.div>
                        ) : (
                            /* ─── Doctor / Ministry: Username + Password ─── */
                            <motion.div
                                key="auth-form"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
                            >
                                <div className="mb-6 flex items-center gap-3">
                                    <button
                                        onClick={() => { setSelectedRole(null); setError(""); }}
                                        className="text-xs font-medium text-slate-400 hover:text-slate-600"
                                    >
                                        ← {t("back")}
                                    </button>
                                    <div className="flex-1" />
                                    {activeRole && (
                                        <div className={`flex items-center gap-1.5 rounded-full ${activeRole.bgLight} px-3 py-1`}>
                                            <activeRole.icon className={`h-3.5 w-3.5 ${activeRole.textColor}`} />
                                            <span className={`text-xs font-semibold ${activeRole.textColor}`}>{roleLabel(activeRole.id)}</span>
                                        </div>
                                    )}
                                </div>

                                <h2 dir={isRTL ? "rtl" : "ltr"} className="text-xl font-bold text-slate-900">{t("login_signin")}</h2>
                                <p dir={isRTL ? "rtl" : "ltr"} className="mt-1 text-sm text-slate-500">{t("login_enter_credentials")}</p>

                                <div className="mt-6 space-y-4">
                                    <div>
                                        <label dir={isRTL ? "rtl" : "ltr"} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">{t("login_username")}</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <input
                                                value={username}
                                                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                                                placeholder="Enter username"
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label dir={isRTL ? "rtl" : "ltr"} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">{t("login_password")}</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <input
                                                value={password}
                                                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                                type="password"
                                                placeholder="Enter password"
                                                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                                            />
                                        </div>
                                    </div>
                                    {error && (
                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-medium text-red-500">
                                            {error}
                                        </motion.p>
                                    )}
                                    <button
                                        onClick={handleSignIn}
                                        className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:shadow-emerald-500/20"
                                    >
                                        {t("login_signin")}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <p className="mt-8 text-center text-xs text-slate-400">
                        <Shield className="mr-1 inline h-3 w-3" />
                        Secured by end-to-end encryption · HIPAA compliant
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

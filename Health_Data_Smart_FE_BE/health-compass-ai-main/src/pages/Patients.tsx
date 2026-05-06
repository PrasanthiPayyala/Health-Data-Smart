import AppLayout from "@/components/AppLayout";
import HealthScore from "@/components/HealthScore";
import RiskBadge from "@/components/RiskBadge";
import { motion } from "framer-motion";
import { useState } from "react";
import { Search, Filter, Users } from "lucide-react";
import { Link } from "react-router-dom";

const allPatients = [
    { id: 1, name: "Priya Sharma", age: 58, gender: "F", condition: "CKD Stage 3, Type 2 DM", risk: "critical" as const, score: 34, lastVisit: "Feb 18, 2026", doctor: "Dr. Srinivasan" },
    { id: 2, name: "Kavita Reddy", age: 45, gender: "F", condition: "Hypertension, Hyperlipidemia", risk: "high" as const, score: 62, lastVisit: "Feb 17, 2026", doctor: "Dr. Srinivasan" },
    { id: 3, name: "Arjun Mehta", age: 52, gender: "M", condition: "Type 2 DM, Obesity", risk: "moderate" as const, score: 78, lastVisit: "Feb 16, 2026", doctor: "Dr. Srinivasan" },
    { id: 4, name: "Rajesh Verma", age: 67, gender: "M", condition: "COPD, Heart Failure", risk: "high" as const, score: 48, lastVisit: "Feb 15, 2026", doctor: "Dr. Patel" },
    { id: 5, name: "Sneha Iyer", age: 39, gender: "F", condition: "Asthma, Anxiety", risk: "low" as const, score: 89, lastVisit: "Feb 14, 2026", doctor: "Dr. Srinivasan" },
    { id: 6, name: "Vikram Desai", age: 61, gender: "M", condition: "Uncontrolled DM, Neuropathy", risk: "critical" as const, score: 41, lastVisit: "Feb 13, 2026", doctor: "Dr. Patel" },
    { id: 7, name: "Anjali Nair", age: 55, gender: "F", condition: "Heart Failure, AFib", risk: "high" as const, score: 45, lastVisit: "Feb 12, 2026", doctor: "Dr. Srinivasan" },
    { id: 8, name: "Sunil Rao", age: 43, gender: "M", condition: "Hypertension", risk: "low" as const, score: 85, lastVisit: "Feb 10, 2026", doctor: "Dr. Patel" },
];

const fadeIn = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
};

const Patients = () => {
    const [search, setSearch] = useState("");
    const [filterRisk, setFilterRisk] = useState<string>("all");

    const filtered = allPatients.filter((p) => {
        const matchesSearch =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.condition.toLowerCase().includes(search.toLowerCase());
        const matchesRisk = filterRisk === "all" || p.risk === filterRisk;
        return matchesSearch && matchesRisk;
    });

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                <motion.div {...fadeIn} className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Patients</h1>
                        <p className="text-sm text-muted-foreground">
                            {allPatients.length} patients · {allPatients.filter((p) => p.risk === "critical").length} critical
                        </p>
                    </div>
                </motion.div>

                {/* Search & Filters */}
                <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or condition..."
                            className="w-full rounded-xl border bg-card py-3 pl-10 pr-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border bg-card p-1">
                        {["all", "critical", "high", "moderate", "low"].map((level) => (
                            <button
                                key={level}
                                onClick={() => setFilterRisk(level)}
                                className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${filterRisk === level
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-secondary"
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Patient List */}
                <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="rounded-xl border bg-card shadow-card">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 border-b px-6 py-3">
                        <span className="col-span-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patient</span>
                        <span className="col-span-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Condition</span>
                        <span className="col-span-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Score</span>
                        <span className="col-span-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Risk</span>
                        <span className="col-span-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Visit</span>
                        <span className="col-span-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Doctor</span>
                    </div>

                    {/* Patient Rows */}
                    <div className="divide-y">
                        {filtered.map((p, i) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * i }}
                            >
                                <Link
                                    to={`/patient/${p.id}`}
                                    className="grid grid-cols-12 items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40"
                                >
                                    {/* Patient Info */}
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                                            {p.name.split(" ").map((n) => n[0]).join("")}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-card-foreground">{p.name}</p>
                                            <p className="text-xs text-muted-foreground">{p.age}y · {p.gender} · PT-{String(2800 + p.id).padStart(4, "0")}</p>
                                        </div>
                                    </div>

                                    {/* Condition */}
                                    <div className="col-span-3">
                                        <p className="text-sm text-card-foreground">{p.condition}</p>
                                    </div>

                                    {/* Health Score */}
                                    <div className="col-span-1 flex justify-center">
                                        <HealthScore score={p.score} size="sm" />
                                    </div>

                                    {/* Risk */}
                                    <div className="col-span-1 flex justify-center">
                                        <RiskBadge level={p.risk} />
                                    </div>

                                    {/* Last Visit */}
                                    <div className="col-span-2">
                                        <p className="text-sm text-muted-foreground">{p.lastVisit}</p>
                                    </div>

                                    {/* Doctor */}
                                    <div className="col-span-1 text-center">
                                        <p className="text-xs text-muted-foreground">{p.doctor}</p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Users className="mb-3 h-10 w-10 opacity-40" />
                            <p className="text-sm font-medium">No patients found</p>
                            <p className="text-xs">Try adjusting your search or filters</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </AppLayout>
    );
};

export default Patients;

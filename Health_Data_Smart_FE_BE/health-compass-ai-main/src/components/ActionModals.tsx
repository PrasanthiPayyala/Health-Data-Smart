import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    Upload,
    Mic,
    MicOff,
    FileText,
    X,
    Check,
    CloudUpload,
    File,
    Globe,
    ChevronDown,
    AlertTriangle,
    Pill,
    FlaskConical,
    Calendar,
    Stethoscope,
    Activity,
    Clock,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// SHARED: Modal Overlay
// ═══════════════════════════════════════════════════════════════════════════
function ModalOverlay({
    open,
    onClose,
    children,
    className = "",
    slideOver = false,
}: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
    slideOver?: boolean;
}) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`fixed inset-0 z-[100] flex ${slideOver ? "justify-end" : "items-center justify-center"} bg-black/40 backdrop-blur-sm`}
                    onClick={onClose}
                >
                    <motion.div
                        initial={slideOver ? { x: "100%" } : { scale: 0.95, opacity: 0 }}
                        animate={slideOver ? { x: 0 } : { scale: 1, opacity: 1 }}
                        exit={slideOver ? { x: "100%" } : { scale: 0.95, opacity: 0 }}
                        transition={slideOver ? { type: "spring", damping: 26, stiffness: 300 } : undefined}
                        onClick={(e) => e.stopPropagation()}
                        className={className}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. UPLOAD REPORT MODAL
// ═══════════════════════════════════════════════════════════════════════════
export function UploadReportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const resetState = useCallback(() => {
        setFile(null);
        setProgress(0);
        setUploading(false);
        setIsDragging(false);
    }, []);

    const handleClose = useCallback(() => {
        resetState();
        onClose();
    }, [onClose, resetState]);

    const startUpload = useCallback((selectedFile: File) => {
        setFile(selectedFile);
        setUploading(true);
        setProgress(0);
        const start = Date.now();
        const duration = 2000;
        const tick = () => {
            const elapsed = Date.now() - start;
            const pct = Math.min(100, Math.round((elapsed / duration) * 100));
            setProgress(pct);
            if (pct < 100) {
                requestAnimationFrame(tick);
            } else {
                setTimeout(() => {
                    toast.success(`"${selectedFile.name}" uploaded successfully to Priya Sharma's records`);
                    resetState();
                    onClose();
                }, 300);
            }
        };
        requestAnimationFrame(tick);
    }, [onClose, resetState]);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) startUpload(e.target.files[0]);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) startUpload(e.dataTransfer.files[0]);
    };

    return (
        <ModalOverlay open={open} onClose={handleClose}>
            <div className="w-full max-w-lg rounded-2xl border bg-card p-0 shadow-elevated">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-card-foreground">Upload Report</h3>
                            <p className="text-xs text-muted-foreground">Patient: Priya Sharma · PT-2847</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-card-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {!uploading ? (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={onDrop}
                            onClick={() => inputRef.current?.click()}
                            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-14 transition-colors ${isDragging
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50 hover:bg-muted/30"
                                }`}
                        >
                            <CloudUpload className={`mb-3 h-10 w-10 ${isDragging ? "text-primary" : "text-muted-foreground/50"}`} />
                            <p className="text-sm font-medium text-card-foreground">
                                {isDragging ? "Drop file here" : "Drag & drop your report here"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">or click to browse · PDF, JPG, PNG, DICOM</p>
                            <input ref={inputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.dicom" onChange={onFileChange} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 rounded-xl bg-secondary/60 p-4">
                                <File className="h-8 w-8 text-primary" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-card-foreground">{file?.name}</p>
                                    <p className="text-xs text-muted-foreground">{file ? (file.size / 1024).toFixed(1) + " KB" : ""}</p>
                                </div>
                                {progress === 100 && <Check className="h-5 w-5 text-primary" />}
                            </div>
                            <div>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {progress < 100 ? "Uploading..." : "Complete"}
                                    </span>
                                    <span className="text-xs font-semibold text-primary">{progress}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                                    <motion.div
                                        className="h-full rounded-full bg-primary"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ ease: "linear", duration: 0.1 }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ModalOverlay>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. VOICE INPUT / DICTATION MODAL
// ═══════════════════════════════════════════════════════════════════════════
const languages = [
    { code: "en", label: "English", native: "English" },
    { code: "hi", label: "Hindi", native: "हिन्दी" },
    { code: "te", label: "Telugu", native: "తెలుగు" },
    { code: "ta", label: "Tamil", native: "தமிழ்" },
    { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
    { code: "mr", label: "Marathi", native: "मराठी" },
    { code: "bn", label: "Bengali", native: "বাংলা" },
    { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
];

const simulatedTranscriptions: Record<string, string[]> = {
    en: [
        "Patient presents with ",
        "worsening shortness of breath ",
        "over the past two weeks. ",
        "Bilateral pedal edema observed. ",
        "Blood pressure measured at 180 over 110. ",
        "Recommend urgent renal panel ",
        "and echocardiogram.",
    ],
    hi: [
        "मरीज को पिछले दो सप्ताह से ",
        "सांस लेने में कठिनाई बढ़ रही है। ",
        "दोनों पैरों में सूजन देखी गई। ",
        "रक्तचाप 180/110 मापा गया। ",
        "तत्काल रीनल पैनल ",
        "और इकोकार्डियोग्राम की सिफारिश।",
    ],
    te: [
        "రోగికి గత రెండు వారాలుగా ",
        "శ్వాసకష్టం పెరుగుతోంది. ",
        "రెండు కాళ్ళలో వాపు గమనించబడింది. ",
        "రక్తపోటు 180/110 కొలవబడింది. ",
        "అత్యవసర రీనల్ ప్యానెల్ ",
        "మరియు ఎకోకార్డియోగ్రామ్ సూచించబడింది.",
    ],
};

export function VoiceInputModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [language, setLanguage] = useState("en");
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const [recording, setRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [charIndex, setCharIndex] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const resetState = useCallback(() => {
        setRecording(false);
        setTranscript("");
        setCharIndex(0);
        setLangDropdownOpen(false);
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    const handleClose = useCallback(() => {
        resetState();
        onClose();
    }, [onClose, resetState]);

    const fullText = (simulatedTranscriptions[language] || simulatedTranscriptions.en).join("");

    const startRecording = () => {
        setRecording(true);
        setTranscript("");
        setCharIndex(0);
    };

    const stopRecording = () => {
        setRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    // Simulate live transcription
    useEffect(() => {
        if (recording && charIndex < fullText.length) {
            timerRef.current = setInterval(() => {
                setCharIndex((prev) => {
                    const next = prev + 1;
                    setTranscript(fullText.slice(0, next));
                    if (next >= fullText.length) {
                        setRecording(false);
                        if (timerRef.current) clearInterval(timerRef.current);
                    }
                    return next;
                });
            }, 50);
            return () => { if (timerRef.current) clearInterval(timerRef.current); };
        }
    }, [recording, charIndex, fullText]);

    const selectedLang = languages.find((l) => l.code === language) || languages[0];

    return (
        <ModalOverlay open={open} onClose={handleClose}>
            <div className="w-full max-w-lg rounded-2xl border bg-card p-0 shadow-elevated">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Mic className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-card-foreground">Voice Dictation</h3>
                            <p className="text-xs text-muted-foreground">Speak to capture clinical notes</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-card-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-5 p-6">
                    {/* Language Selector */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <Globe className="mr-1 inline h-3.5 w-3.5" />
                            Dictation Language
                        </label>
                        <div className="relative">
                            <button
                                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                                className="flex w-full items-center justify-between rounded-xl border bg-background px-4 py-3 text-sm font-medium text-card-foreground transition-colors hover:bg-muted/30"
                            >
                                <span>{selectedLang.label} <span className="ml-1 text-muted-foreground">({selectedLang.native})</span></span>
                                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${langDropdownOpen ? "rotate-180" : ""}`} />
                            </button>
                            <AnimatePresence>
                                {langDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border bg-card py-1 shadow-card-hover"
                                    >
                                        {languages.map((l) => (
                                            <button
                                                key={l.code}
                                                onClick={() => { setLanguage(l.code); setLangDropdownOpen(false); setTranscript(""); setCharIndex(0); }}
                                                className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors ${l.code === language ? "bg-primary/10 text-primary font-medium" : "text-card-foreground hover:bg-muted"
                                                    }`}
                                            >
                                                <span>{l.label}</span>
                                                <span className="text-xs text-muted-foreground">{l.native}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Recording Area */}
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={recording ? stopRecording : startRecording}
                            className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all ${recording
                                ? "bg-risk-critical text-white shadow-lg"
                                : "bg-primary/10 text-primary hover:bg-primary/20"
                                }`}
                        >
                            {recording && (
                                <motion.div
                                    className="absolute inset-0 rounded-full bg-risk-critical/30"
                                    animate={{ scale: [1, 1.4, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            )}
                            {recording ? <MicOff className="relative z-10 h-8 w-8" /> : <Mic className="h-8 w-8" />}
                        </button>
                        <p className="text-sm font-medium text-muted-foreground">
                            {recording ? "Listening... Click to stop" : "Click to start recording"}
                        </p>
                    </div>

                    {/* Transcription Area */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Live Transcription
                        </label>
                        <textarea
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="Transcription will appear here as you speak..."
                            rows={5}
                            className="w-full resize-none rounded-xl border bg-background p-4 text-sm text-card-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
                        />
                        {recording && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-risk-critical">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-risk-critical opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-risk-critical" />
                                </span>
                                Recording in {selectedLang.label}...
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleClose}
                            className="flex-1 rounded-xl border px-4 py-3 text-sm font-medium text-card-foreground transition-colors hover:bg-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (!transcript.trim()) {
                                    toast.error("No transcription to save. Please record first.");
                                    return;
                                }
                                toast.success("Clinical notes saved to Priya Sharma's EHR");
                                handleClose();
                            }}
                            className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            Save to EHR
                        </button>
                    </div>
                </div>
            </div>
        </ModalOverlay>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. NEW PRESCRIPTION MODAL
// ═══════════════════════════════════════════════════════════════════════════
const medicineDatabase = [
    "Losartan 25mg", "Losartan 50mg", "Losartan 100mg",
    "Amlodipine 5mg", "Amlodipine 10mg",
    "Metformin 500mg", "Metformin 1000mg",
    "Insulin Glargine 10U", "Insulin Glargine 20U",
    "Atorvastatin 10mg", "Atorvastatin 20mg", "Atorvastatin 40mg",
    "Furosemide 20mg", "Furosemide 40mg",
    "Aspirin 75mg", "Aspirin 150mg",
    "Clopidogrel 75mg",
    "Pantoprazole 40mg",
    "Erythropoietin 4000IU",
];

const frequencyOptions = [
    { value: "OD", label: "OD — Once daily" },
    { value: "BD", label: "BD — Twice daily" },
    { value: "TDS", label: "TDS — Three times daily" },
    { value: "QID", label: "QID — Four times daily" },
    { value: "SOS", label: "SOS — As needed" },
    { value: "HS", label: "HS — At bedtime" },
];

export type DraftPrescription = { medicines: string[]; tests: string[] };

export function PrescriptionModal({
    open,
    onClose,
    draftPrescription = { medicines: [], tests: [] },
    onPrescriptionSigned,
}: {
    open: boolean;
    onClose: () => void;
    draftPrescription?: DraftPrescription;
    onPrescriptionSigned?: () => void;
}) {
    const [medicine, setMedicine] = useState("");
    const [dosage, setDosage] = useState("");
    const [frequency, setFrequency] = useState("");
    const [duration, setDuration] = useState("");
    const [showMedDropdown, setShowMedDropdown] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const hasDraftItems = draftPrescription.medicines.length > 0 || draftPrescription.tests.length > 0;

    const resetState = useCallback(() => {
        setMedicine("");
        setDosage("");
        setFrequency("");
        setDuration("");
        setShowMedDropdown(false);
        setErrors({});
    }, []);

    const handleClose = useCallback(() => {
        resetState();
        onClose();
    }, [onClose, resetState]);

    const filteredMeds = medicineDatabase.filter(
        (m) => m.toLowerCase().includes(medicine.toLowerCase()) && medicine.length > 0
    );

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!medicine.trim()) e.medicine = "Medicine is required";
        if (!dosage.trim()) e.dosage = "Dosage is required";
        if (!frequency) e.frequency = "Select frequency";
        if (!duration.trim()) e.duration = "Duration is required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSignAndPrescribe = () => {
        const addingNewMed = medicine.trim() && dosage.trim() && frequency && duration.trim();
        if (addingNewMed && !validate()) return;

        const medCount = draftPrescription.medicines.length + (addingNewMed ? 1 : 0);
        const testCount = draftPrescription.tests.length;
        const parts: string[] = [];
        if (medCount > 0) parts.push(`${medCount} medicine(s)`);
        if (testCount > 0) parts.push(`${testCount} test(s)`);
        if (addingNewMed) parts.push(`New: ${medicine} ${dosage} ${frequency} ${duration}`);
        const message = parts.length > 0 ? `Prescription signed. ${parts.join(", ")}.` : "Prescription signed.";
        toast.success(message);
        onPrescriptionSigned?.();
        handleClose();
    };

    return (
        <ModalOverlay open={open} onClose={handleClose}>
            <div className="w-full max-w-lg rounded-2xl border bg-card p-0 shadow-elevated max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-medical-purple/10">
                            <FileText className="h-5 w-5 text-medical-purple" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-card-foreground">New Prescription</h3>
                            <p className="text-xs text-muted-foreground">Patient: Priya Sharma · PT-2847</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-card-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 p-6 overflow-y-auto flex-1">
                    {/* Draft prescription review */}
                    {hasDraftItems && (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                            <h4 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                Items in this prescription
                            </h4>
                            {draftPrescription.medicines.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Medicines</p>
                                    <ul className="space-y-1">
                                        {draftPrescription.medicines.map((m) => (
                                            <li key={m} className="flex items-center gap-2 text-sm text-card-foreground">
                                                <Pill className="h-3.5 w-3.5 text-medical-purple shrink-0" />
                                                {m}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {draftPrescription.tests.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Tests</p>
                                    <ul className="space-y-1">
                                        {draftPrescription.tests.map((t) => (
                                            <li key={t} className="flex items-center gap-2 text-sm text-card-foreground">
                                                <FlaskConical className="h-3.5 w-3.5 text-medical-blue shrink-0" />
                                                {t}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Medicine search / add optional */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {hasDraftItems ? "Add another medicine (optional)" : "Search Medicine"}
                        </label>
                        <div className="relative">
                            <input
                                value={medicine}
                                onChange={(e) => { setMedicine(e.target.value); setShowMedDropdown(true); setErrors({ ...errors, medicine: "" }); }}
                                onFocus={() => setShowMedDropdown(true)}
                                placeholder="Type medicine name..."
                                className={`w-full rounded-xl border ${errors.medicine ? "border-risk-critical" : ""} bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring`}
                            />
                            {showMedDropdown && filteredMeds.length > 0 && (
                                <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border bg-card py-1 shadow-card-hover">
                                    {filteredMeds.slice(0, 8).map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => { setMedicine(m); setShowMedDropdown(false); setErrors({ ...errors, medicine: "" }); }}
                                            className="w-full px-4 py-2.5 text-left text-sm text-card-foreground hover:bg-muted"
                                        >
                                            <Pill className="mr-2 inline h-3.5 w-3.5 text-medical-purple" />
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {errors.medicine && <p className="mt-1 text-xs text-risk-critical">{errors.medicine}</p>}
                    </div>

                    {/* Dosage */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Dosage / Instructions
                        </label>
                        <input
                            value={dosage}
                            onChange={(e) => { setDosage(e.target.value); setErrors({ ...errors, dosage: "" }); }}
                            placeholder="e.g. 1 tablet, 10ml, 10 units..."
                            className={`w-full rounded-xl border ${errors.dosage ? "border-risk-critical" : ""} bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring`}
                        />
                        {errors.dosage && <p className="mt-1 text-xs text-risk-critical">{errors.dosage}</p>}
                    </div>

                    {/* Frequency */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Frequency
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {frequencyOptions.map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => { setFrequency(f.value); setErrors({ ...errors, frequency: "" }); }}
                                    className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${frequency === f.value
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "text-card-foreground hover:bg-muted"
                                        }`}
                                >
                                    <span className="font-semibold">{f.value}</span>
                                    <span className="ml-1 text-muted-foreground">{f.label.split("—")[1]}</span>
                                </button>
                            ))}
                        </div>
                        {errors.frequency && <p className="mt-1 text-xs text-risk-critical">{errors.frequency}</p>}
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Duration
                        </label>
                        <input
                            value={duration}
                            onChange={(e) => { setDuration(e.target.value); setErrors({ ...errors, duration: "" }); }}
                            placeholder="e.g. 7 days, 2 weeks, Ongoing..."
                            className={`w-full rounded-xl border ${errors.duration ? "border-risk-critical" : ""} bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring`}
                        />
                        {errors.duration && <p className="mt-1 text-xs text-risk-critical">{errors.duration}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 shrink-0">
                        <button
                            onClick={handleClose}
                            className="flex-1 rounded-xl border px-4 py-3 text-sm font-medium text-card-foreground transition-colors hover:bg-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSignAndPrescribe}
                            className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            Sign & Prescribe
                        </button>
                    </div>
                </div>
            </div>
        </ModalOverlay>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. FULL HISTORY SLIDE-OVER PANEL
// ═══════════════════════════════════════════════════════════════════════════
const patientHistory = [
    {
        date: "Feb 18, 2026",
        title: "Lab Results — Critical",
        type: "report" as const,
        risk: "critical" as const,
        details: [
            { label: "Creatinine", value: "2.8 mg/dL", flag: "High" },
            { label: "eGFR", value: "28 mL/min", flag: "Low" },
            { label: "HbA1c", value: "9.2%", flag: "High" },
            { label: "BUN", value: "42 mg/dL", flag: "High" },
            { label: "Potassium", value: "5.1 mEq/L", flag: "High" },
        ],
        diagnosis: "Acute-on-Chronic Kidney Disease exacerbation",
    },
    {
        date: "Feb 15, 2026",
        title: "Emergency Visit",
        type: "visit" as const,
        risk: "high" as const,
        details: [
            { label: "BP", value: "180/110 mmHg", flag: "Critical" },
            { label: "SpO2", value: "92%", flag: "Low" },
            { label: "HR", value: "102 bpm", flag: "High" },
        ],
        diagnosis: "Hypertensive emergency with acute dyspnea",
    },
    {
        date: "Feb 10, 2026",
        title: "Prescription Update",
        type: "prescription" as const,
        risk: "moderate" as const,
        details: [
            { label: "Metformin", value: "↑ 1000mg BD", flag: "" },
            { label: "Amlodipine", value: "Added 5mg OD", flag: "New" },
            { label: "Furosemide", value: "Added 20mg OD", flag: "New" },
        ],
        diagnosis: "Uncontrolled DM and HTN management adjustment",
    },
    {
        date: "Feb 1, 2026",
        title: "Routine Check-up",
        type: "visit" as const,
        risk: "moderate" as const,
        details: [
            { label: "BP", value: "150/95 mmHg", flag: "High" },
            { label: "Weight", value: "78 kg (+2kg)", flag: "" },
            { label: "Edema", value: "Mild pedal", flag: "Present" },
        ],
        diagnosis: "Progressive hypertension, early fluid overload",
    },
    {
        date: "Jan 20, 2026",
        title: "Lab Results",
        type: "report" as const,
        risk: "high" as const,
        details: [
            { label: "Creatinine", value: "2.2 mg/dL", flag: "High" },
            { label: "eGFR", value: "35 mL/min", flag: "Low" },
            { label: "HbA1c", value: "8.8%", flag: "High" },
            { label: "Urine ACR", value: "320 mg/g", flag: "High" },
        ],
        diagnosis: "CKD Stage 3b, Diabetic nephropathy progression",
    },
];

const typeConfig: Record<string, { icon: typeof Stethoscope; bg: string; fg: string }> = {
    report: { icon: FlaskConical, bg: "bg-medical-blue-light", fg: "text-medical-blue" },
    visit: { icon: Stethoscope, bg: "bg-medical-teal-light", fg: "text-medical-teal" },
    prescription: { icon: Pill, bg: "bg-medical-purple-light", fg: "text-medical-purple" },
};

const riskColors: Record<string, string> = {
    critical: "bg-risk-critical text-white",
    high: "bg-risk-high text-white",
    moderate: "bg-risk-moderate text-risk-moderate-foreground",
    low: "bg-risk-low text-white",
};

export function FullHistorySlideOver({ open, onClose }: { open: boolean; onClose: () => void }) {
    return (
        <ModalOverlay open={open} onClose={onClose} slideOver className="h-full w-full max-w-md border-l bg-card shadow-elevated">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-5">
                <div>
                    <h3 className="text-lg font-bold text-card-foreground">Full Medical History</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">Priya Sharma · 58y · PT-2847</p>
                </div>
                <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-card-foreground">
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-0">
                    {patientHistory.map((entry, i) => {
                        const config = typeConfig[entry.type] || typeConfig.visit;
                        const Icon = config.icon;
                        return (
                            <div key={i} className="relative flex gap-4 pb-8 last:pb-0">
                                {/* Vertical line */}
                                {i < patientHistory.length - 1 && (
                                    <div className="absolute left-[19px] top-10 h-[calc(100%-16px)] w-px bg-border" />
                                )}
                                {/* Icon */}
                                <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                                    <Icon className={`h-4 w-4 ${config.fg}`} />
                                </div>
                                {/* Content */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-card-foreground">{entry.title}</p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {entry.date}
                                                </span>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${riskColors[entry.risk]}`}>
                                                    {entry.risk}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metrics */}
                                    <div className="rounded-lg border bg-background p-3">
                                        <div className="space-y-1.5">
                                            {entry.details.map((d) => (
                                                <div key={d.label} className="flex items-center justify-between">
                                                    <span className="text-xs text-muted-foreground">{d.label}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-card-foreground">{d.value}</span>
                                                        {d.flag && (
                                                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${d.flag === "High" || d.flag === "Critical" ? "bg-risk-critical/10 text-risk-critical"
                                                                : d.flag === "Low" ? "bg-risk-high/10 text-risk-high"
                                                                    : d.flag === "New" ? "bg-primary/10 text-primary"
                                                                        : d.flag === "Present" ? "bg-risk-moderate/10 text-risk-moderate"
                                                                            : "bg-secondary text-muted-foreground"
                                                                }`}>
                                                                {d.flag}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Diagnosis */}
                                    <div className="rounded-lg bg-accent/50 px-3 py-2">
                                        <p className="text-xs text-accent-foreground">
                                            <span className="font-semibold">Dx:</span> {entry.diagnosis}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-4">
                <button
                    onClick={() => {
                        toast.success("Full history exported as PDF");
                        onClose();
                    }}
                    className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    Export as PDF
                </button>
            </div>
        </ModalOverlay>
    );
}

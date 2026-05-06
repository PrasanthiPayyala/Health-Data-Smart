import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle, Home } from "lucide-react";

const NAVY = "#0D47A1";
const SKY_LINE = "#90CAF9";
const PAGE_BG = "#F4F8FC";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center" style={{ background: PAGE_BG }}>
      <div
        className="max-w-md w-full mx-6 rounded-lg border bg-white px-10 py-12 text-center shadow-sm"
        style={{ borderColor: SKY_LINE }}
      >
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md"
          style={{ background: "#FFEBEE" }}
        >
          <AlertTriangle className="h-8 w-8" style={{ color: "#C62828" }} />
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight" style={{ color: NAVY }}>404</h1>
        <p className="mt-3 text-lg text-slate-700">Page not found</p>
        <p className="mt-1 text-xs text-slate-500 font-mono">{location.pathname}</p>
        <a href="/" className="ap-btn-primary mt-7 inline-flex">
          <Home className="h-4 w-4" />
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;

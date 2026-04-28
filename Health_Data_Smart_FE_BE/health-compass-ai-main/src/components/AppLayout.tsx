import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import AICopilot from "./AICopilot";

const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-64 min-h-screen p-6">
        {children}
      </main>
      <AICopilot floating />
    </div>
  );
};

export default AppLayout;

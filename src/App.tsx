import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { motion, AnimatePresence } from "framer-motion";
import MainPage from "./pages/MainPage";
import OverlayPage from "./pages/OverlayPage";
import SettingsPage from "./pages/SettingsPage";
import "./App.css";

function App() {
  const [windowLabel, setWindowLabel] = useState<string | null>(null);
  const [view, setView] = useState<"main" | "settings">("main");

  useEffect(() => {
    // Determine which window we are in to show the correct page
    const label = getCurrentWindow().label;
    setWindowLabel(label);
    
    // Also support hash routing as a fallback/dev convenience
    const hash = window.location.hash;
    if (hash === "#overlay") {
      setWindowLabel("overlay");
    }
  }, []);

  if (!windowLabel) return null;

  // If we are in the overlay window, always show the OverlayPage
  if (windowLabel === "overlay") {
    return <OverlayPage />;
  }

  // If we are in the main window, support animated view switching
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      <AnimatePresence mode="wait">
        {view === "main" ? (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full w-full"
          >
            <MainPage onOpenSettings={() => setView("settings")} />
          </motion.div>
        ) : (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full w-full"
          >
            <SettingsPage onBack={() => setView("main")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

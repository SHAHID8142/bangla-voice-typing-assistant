import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { AnimatePresence, motion } from "framer-motion";
import MainPage from "./pages/MainPage";
import OverlayPage from "./pages/OverlayPage";
import SettingsPage from "./pages/SettingsPage";
import "./App.css";

function App() {
  const [windowLabel, setWindowLabel] = useState<string | null>(null);
  const [view, setView] = useState<"main" | "settings">("main");

  useEffect(() => {
    const label = getCurrentWindow().label;
    setWindowLabel(label);

    if (window.location.hash === "#overlay") {
      setWindowLabel("overlay");
    }
  }, []);

  if (!windowLabel) return null;
  if (windowLabel === "overlay") return <OverlayPage />;

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-[#07121b]">
      <div className="noise-overlay" />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb-a absolute top-[-20%] left-[3%] h-[540px] w-[540px] rounded-full bg-cyan-300/10 blur-[130px]" />
        <div className="orb-b absolute bottom-[-30%] right-[0%] h-[460px] w-[460px] rounded-full bg-lime-300/10 blur-[120px]" />
        <div className="orb-c absolute top-[28%] right-[30%] h-[360px] w-[360px] rounded-full bg-orange-300/10 blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">
        {view === "main" ? (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 16, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.99 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full relative z-10"
          >
            <MainPage onOpenSettings={() => setView("settings")} />
          </motion.div>
        ) : (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full relative z-10"
          >
            <SettingsPage onBack={() => setView("main")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

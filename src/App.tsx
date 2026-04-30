import React, { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
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

  // If we are in the main window, support view switching
  return (
    <div className="h-full w-full">
      {view === "main" ? (
        <MainPage onOpenSettings={() => setView("settings")} />
      ) : (
        <SettingsPage onBack={() => setView("main")} />
      )}
    </div>
  );
}

export default App;
